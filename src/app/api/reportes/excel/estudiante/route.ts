import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { EJES, CAPACIDADES, DIFICULTADES } from "@/lib/types";
import { ETIQUETA_ESTADO_INTENTO } from "@/lib/reportes";

const ETIQUETA_EJE = Object.fromEntries(EJES.map((e) => [e.value, e.label]));
const ETIQUETA_CAPACIDAD = Object.fromEntries(CAPACIDADES.map((c) => [c.value, c.label]));
const ETIQUETA_DIFICULTAD = Object.fromEntries(DIFICULTADES.map((d) => [d.value, d.label]));

const ESTILO_ENCABEZADO = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF174277" } },
};

function encabezar(hoja: ExcelJS.Worksheet) {
  hoja.getRow(1).eachCell((c) => Object.assign(c, ESTILO_ENCABEZADO));
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  if (hoja.rowCount > 0 && hoja.columnCount > 0) {
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnCount } };
  }
}

export async function GET(request: Request) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
  if (!perfil || !perfil.activo || (perfil.rol !== "docente" && perfil.rol !== "admin")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const estudianteId = searchParams.get("estudiante");
  const evaluacionFiltro = searchParams.get("evaluacion");
  if (!estudianteId) return NextResponse.json({ error: "Falta indicar el estudiante." }, { status: 400 });

  const admin = crearClienteAdmin();

  const { data: estudiante } = await admin.from("perfiles").select("*").eq("id", estudianteId).single();
  if (!estudiante || estudiante.rol !== "estudiante") {
    return NextResponse.json({ error: "No se encontró el estudiante." }, { status: 404 });
  }

  if (perfil.rol !== "admin") {
    const { data: cursosEstudiante } = await admin
      .from("curso_integrantes")
      .select("curso_id")
      .eq("perfil_id", estudianteId)
      .eq("rol_en_curso", "estudiante");
    const idsCursosEstudiante = (cursosEstudiante ?? []).map((c) => c.curso_id);
    let comparteCurso = false;
    for (const cursoId of idsCursosEstudiante) {
      const { data: curso } = await admin.from("cursos").select("docente_titular_id").eq("id", cursoId).single();
      if (curso?.docente_titular_id === perfil.id) {
        comparteCurso = true;
        break;
      }
      const { data: fila } = await admin
        .from("curso_integrantes")
        .select("id")
        .eq("curso_id", cursoId)
        .eq("perfil_id", perfil.id)
        .eq("rol_en_curso", "docente")
        .maybeSingle();
      if (fila) {
        comparteCurso = true;
        break;
      }
    }
    if (!comparteCurso) return NextResponse.json({ error: "Este estudiante no pertenece a tus cursos." }, { status: 403 });
  }

  let consultaIntentos = admin
    .from("intentos")
    .select("*, evaluaciones(id,nombre,curso_id,cursos(nombre,division))")
    .eq("estudiante_id", estudianteId)
    .neq("estado", "no_iniciado")
    .order("created_at", { ascending: false });
  if (evaluacionFiltro) consultaIntentos = consultaIntentos.eq("evaluacion_id", evaluacionFiltro);

  const { data: intentos } = await consultaIntentos;
  const listaIntentos = intentos ?? [];

  const finalizados = listaIntentos.filter((i) => i.estado === "entregado" || i.estado === "expirado");
  const idsFinalizados = finalizados.map((i) => i.id);

  let desglose: { intento_id: string; tipo_agrupacion: string; clave: string; correctas: number; total: number }[] = [];
  let detallePreguntas: {
    intento_id: string;
    pregunta_id: string;
    orden: number;
    enunciado: string;
    respuesta_correcta: string;
    eje: string;
    contenido: string;
    capacidad: string;
    dificultad: string;
  }[] = [];
  let respuestasPorIntentoYPregunta = new Map<string, string | null>();

  if (idsFinalizados.length > 0) {
    const [{ data: desgloseData }, { data: preguntasData }, { data: respuestasData }] = await Promise.all([
      admin.from("resultado_desglose").select("intento_id,tipo_agrupacion,clave,correctas,total").in("intento_id", idsFinalizados),
      admin
        .from("intento_preguntas")
        .select("intento_id,pregunta_id,orden,enunciado,respuesta_correcta,eje,contenido,capacidad,dificultad")
        .in("intento_id", idsFinalizados)
        .order("orden"),
      admin.from("respuestas_estudiante").select("intento_id,pregunta_id,opcion_seleccionada").in("intento_id", idsFinalizados),
    ]);
    desglose = desgloseData ?? [];
    detallePreguntas = preguntasData ?? [];
    respuestasPorIntentoYPregunta = new Map(
      (respuestasData ?? []).map((r) => [`${r.intento_id}::${r.pregunta_id}`, r.opcion_seleccionada])
    );
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Simulador Aprender Matemática";
  workbook.created = new Date();

  const datos = workbook.addWorksheet("Datos del estudiante");
  datos.columns = [
    { header: "Campo", key: "campo", width: 22 },
    { header: "Valor", key: "valor", width: 34 },
  ];
  const { data: cursosEstudiante } = await admin
    .from("curso_integrantes")
    .select("cursos(nombre,division)")
    .eq("perfil_id", estudianteId)
    .eq("rol_en_curso", "estudiante");
  const cursosTexto = (cursosEstudiante ?? [])
    .map((c) => {
      const curso = c.cursos as unknown as { nombre: string; division: string } | null;
      return curso ? `${curso.nombre} "${curso.division}"` : null;
    })
    .filter(Boolean)
    .join(", ");
  datos.addRows([
    { campo: "Nombre", valor: estudiante.nombre },
    { campo: "Apellido", valor: estudiante.apellido },
    { campo: "Correo", valor: estudiante.email },
    { campo: "Curso(s)", valor: cursosTexto || "Sin curso" },
    { campo: "Generado el", valor: new Date() },
  ]);
  datos.getCell("B5").numFmt = "dd/mm/yyyy hh:mm";
  datos.getRow(1).font = { bold: true };

  const hojaResultados = workbook.addWorksheet("Resultados");
  hojaResultados.columns = [
    { header: "Evaluación", key: "evaluacion", width: 32 },
    { header: "Curso", key: "curso", width: 20 },
    { header: "Intento N°", key: "intento", width: 10 },
    { header: "Estado", key: "estado", width: 22 },
    { header: "Fecha de realización", key: "fecha", width: 20 },
    { header: "Puntaje", key: "puntaje", width: 12 },
    { header: "Porcentaje", key: "porcentaje", width: 12 },
    { header: "Correctas", key: "correctas", width: 12 },
    { header: "Incorrectas", key: "incorrectas", width: 12 },
    { header: "Sin responder", key: "sin_responder", width: 14 },
    { header: "Aprobado", key: "aprobado", width: 12 },
    { header: "Tiempo utilizado (min)", key: "tiempo", width: 18 },
  ];
  for (const i of listaIntentos) {
    const ev = i.evaluaciones as unknown as { nombre: string; cursos: { nombre: string; division: string } | null } | null;
    hojaResultados.addRow({
      evaluacion: ev?.nombre ?? "—",
      curso: ev?.cursos ? `${ev.cursos.nombre} "${ev.cursos.division}"` : "—",
      intento: i.numero_intento,
      estado: ETIQUETA_ESTADO_INTENTO[i.estado] ?? i.estado,
      fecha: i.fecha_entrega ? new Date(i.fecha_entrega) : i.fecha_inicio ? new Date(i.fecha_inicio) : "—",
      puntaje: i.puntaje_obtenido ?? "—",
      porcentaje: i.porcentaje_obtenido ?? "—",
      correctas: i.correctas ?? "—",
      incorrectas: i.incorrectas ?? "—",
      sin_responder: i.sin_responder ?? "—",
      aprobado: i.estado === "en_curso" ? "—" : i.aprobado ? "Sí" : "No",
      tiempo: i.tiempo_utilizado_segundos ? Math.round(i.tiempo_utilizado_segundos / 60) : "—",
    });
  }
  hojaResultados.getColumn("porcentaje").numFmt = '0.00"%"';
  hojaResultados.getColumn("fecha").numFmt = "dd/mm/yyyy hh:mm";
  encabezar(hojaResultados);

  const hojaContenidos = workbook.addWorksheet("Contenidos");
  hojaContenidos.columns = [
    { header: "Agrupación", key: "agrupacion", width: 16 },
    { header: "Detalle", key: "detalle", width: 34 },
    { header: "Correctas", key: "correctas", width: 12 },
    { header: "Total", key: "total", width: 12 },
    { header: "Porcentaje de acierto", key: "porcentaje", width: 20 },
  ];
  const etiquetasPorTipo: Record<string, Record<string, string>> = {
    eje: ETIQUETA_EJE,
    capacidad: ETIQUETA_CAPACIDAD,
    dificultad: ETIQUETA_DIFICULTAD,
  };
  for (const tipo of ["eje", "contenido", "capacidad", "dificultad"] as const) {
    const acumulado = new Map<string, { correctas: number; total: number }>();
    for (const d of desglose.filter((f) => f.tipo_agrupacion === tipo)) {
      const actual = acumulado.get(d.clave) ?? { correctas: 0, total: 0 };
      actual.correctas += d.correctas;
      actual.total += d.total;
      acumulado.set(d.clave, actual);
    }
    for (const [clave, v] of acumulado) {
      hojaContenidos.addRow({
        agrupacion: tipo === "eje" ? "Eje" : tipo === "contenido" ? "Contenido" : tipo === "capacidad" ? "Capacidad" : "Dificultad",
        detalle: etiquetasPorTipo[tipo]?.[clave] ?? clave,
        correctas: v.correctas,
        total: v.total,
        porcentaje: v.total === 0 ? 0 : Math.round((v.correctas / v.total) * 10000) / 100,
      });
    }
  }
  hojaContenidos.getColumn("porcentaje").numFmt = '0.00"%"';
  encabezar(hojaContenidos);

  const hojaDetalle = workbook.addWorksheet("Detalle de preguntas");
  hojaDetalle.columns = [
    { header: "Evaluación", key: "evaluacion", width: 28 },
    { header: "Intento N°", key: "intento", width: 10 },
    { header: "N° pregunta", key: "orden", width: 12 },
    { header: "Enunciado", key: "enunciado", width: 55 },
    { header: "Respuesta seleccionada", key: "seleccionada", width: 18 },
    { header: "Respuesta correcta", key: "correcta", width: 16 },
    { header: "¿Acertó?", key: "acerto", width: 10 },
    { header: "Eje", key: "eje", width: 20 },
    { header: "Contenido", key: "contenido", width: 24 },
    { header: "Capacidad", key: "capacidad", width: 24 },
    { header: "Dificultad", key: "dificultad", width: 12 },
  ];
  const evaluacionPorIntento = new Map(
    listaIntentos.map((i) => [
      i.id,
      { nombre: (i.evaluaciones as unknown as { nombre: string } | null)?.nombre ?? "—", numero: i.numero_intento },
    ])
  );
  for (const pi of detallePreguntas) {
    const seleccionada = respuestasPorIntentoYPregunta.get(`${pi.intento_id}::${pi.pregunta_id}`) ?? null;
    const ev = evaluacionPorIntento.get(pi.intento_id);
    hojaDetalle.addRow({
      evaluacion: ev?.nombre ?? "—",
      intento: ev?.numero ?? "—",
      orden: pi.orden,
      enunciado: pi.enunciado,
      seleccionada: seleccionada ?? "Sin responder",
      correcta: pi.respuesta_correcta,
      acerto: seleccionada === pi.respuesta_correcta ? "Sí" : "No",
      eje: ETIQUETA_EJE[pi.eje as keyof typeof ETIQUETA_EJE] ?? pi.eje,
      contenido: pi.contenido,
      capacidad: ETIQUETA_CAPACIDAD[pi.capacidad as keyof typeof ETIQUETA_CAPACIDAD] ?? pi.capacidad,
      dificultad: ETIQUETA_DIFICULTAD[pi.dificultad as keyof typeof ETIQUETA_DIFICULTAD] ?? pi.dificultad,
    });
  }
  encabezar(hojaDetalle);

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `${estudiante.apellido}-${estudiante.nombre}-resultados.xlsx`.replace(/\s+/g, "-");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
