import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { CAPACIDADES, DIFICULTADES, EJES } from "@/lib/types";
import { agregarPorTipo, calcularEstadisticas, calcularPreguntasConMasErrores, ETIQUETA_ESTADO_INTENTO } from "@/lib/reportes";
import type { Intento } from "@/lib/types";

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
  const cursoId = searchParams.get("curso");
  const evaluacionId = searchParams.get("evaluacion");
  if (!cursoId && !evaluacionId) {
    return NextResponse.json({ error: "Indicá un curso o una evaluación." }, { status: 400 });
  }

  const admin = crearClienteAdmin();
  const esAdmin = perfil.rol === "admin";

  async function docenteEsTitularDe(idCurso: string): Promise<boolean> {
    if (esAdmin) return true;
    const { data: curso } = await admin.from("cursos").select("docente_titular_id").eq("id", idCurso).single();
    if (curso?.docente_titular_id === perfil.id) return true;
    const { data: fila } = await admin
      .from("curso_integrantes")
      .select("id")
      .eq("curso_id", idCurso)
      .eq("perfil_id", perfil.id)
      .eq("rol_en_curso", "docente")
      .maybeSingle();
    return !!fila;
  }

  // Resuelve el/los curso(s) y evaluación(es) objetivo, verificando permisos.
  let evaluacionIds: string[];
  let cursoIdsInvolucrados: string[];
  let tituloReporte: string;

  if (evaluacionId) {
    const { data: evaluacion } = await admin.from("evaluaciones").select("*").eq("id", evaluacionId).single();
    if (!evaluacion) return NextResponse.json({ error: "No se encontró la evaluación." }, { status: 404 });
    const puedeAcceder = esAdmin || evaluacion.creado_por === perfil.id || (await docenteEsTitularDe(evaluacion.curso_id));
    if (!puedeAcceder) return NextResponse.json({ error: "No administrás esta evaluación." }, { status: 403 });

    const { data: asignaciones } = await admin.from("asignaciones").select("curso_id").eq("evaluacion_id", evaluacionId);
    cursoIdsInvolucrados = Array.from(new Set([evaluacion.curso_id, ...(asignaciones ?? []).map((a) => a.curso_id)]));
    evaluacionIds = [evaluacionId];
    tituloReporte = evaluacion.nombre;
  } else {
    const puedeAcceder = await docenteEsTitularDe(cursoId!);
    if (!puedeAcceder) return NextResponse.json({ error: "No administrás este curso." }, { status: 403 });

    const { data: curso } = await admin.from("cursos").select("nombre, division").eq("id", cursoId!).single();
    if (!curso) return NextResponse.json({ error: "No se encontró el curso." }, { status: 404 });

    const [{ data: porOrigen }, { data: asignaciones }] = await Promise.all([
      admin.from("evaluaciones").select("id").eq("curso_id", cursoId!),
      admin.from("asignaciones").select("evaluacion_id").eq("curso_id", cursoId!),
    ]);
    evaluacionIds = Array.from(
      new Set([...(porOrigen ?? []).map((e) => e.id), ...(asignaciones ?? []).map((a) => a.evaluacion_id)])
    );
    cursoIdsInvolucrados = [cursoId!];
    tituloReporte = `${curso.nombre} "${curso.division}"`;
  }

  if (evaluacionIds.length === 0) {
    return NextResponse.json({ error: "No hay evaluaciones para exportar con ese filtro." }, { status: 404 });
  }

  const [{ data: evaluaciones }, { data: integrantes }] = await Promise.all([
    admin.from("evaluaciones").select("id,nombre,curso_id,puntaje_aprobacion").in("id", evaluacionIds),
    admin
      .from("curso_integrantes")
      .select("perfil_id, curso_id, perfiles(id,nombre,apellido,email)")
      .in("curso_id", cursoIdsInvolucrados)
      .eq("rol_en_curso", "estudiante"),
  ]);

  interface EstudianteInfo {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  }
  const estudiantesPorId = new Map<string, EstudianteInfo>();
  for (const i of integrantes ?? []) {
    const p = i.perfiles as unknown as EstudianteInfo | null;
    if (p) estudiantesPorId.set(p.id, p);
  }
  const estudiantes = Array.from(estudiantesPorId.values()).sort((a, b) => a.apellido.localeCompare(b.apellido));

  const nombreEvaluacion = new Map((evaluaciones ?? []).map((e) => [e.id, e.nombre]));

  const { data: todosLosIntentos } = await admin
    .from("intentos")
    .select("*")
    .in("evaluacion_id", evaluacionIds)
    .in("estudiante_id", estudiantes.map((e) => e.id))
    .returns<Intento[]>();

  // Un estudiante puede tener varios intentos por evaluación: se toma el
  // "representativo" (entregado > expirado > en_curso, y dentro de un mismo
  // estado el número de intento más alto) para la fila de resumen por
  // estudiante — el detalle completo de intentos no se pierde, solo se
  // resume acá para que cada fila sea un estudiante×evaluación.
  const PRIORIDAD_ESTADO: Record<string, number> = { entregado: 3, expirado: 2, en_curso: 1, no_iniciado: 0 };
  const representativoPorPar = new Map<string, Intento>();
  for (const intento of todosLosIntentos ?? []) {
    const clave = `${intento.estudiante_id}::${intento.evaluacion_id}`;
    const actual = representativoPorPar.get(clave);
    if (
      !actual ||
      PRIORIDAD_ESTADO[intento.estado] > PRIORIDAD_ESTADO[actual.estado] ||
      (PRIORIDAD_ESTADO[intento.estado] === PRIORIDAD_ESTADO[actual.estado] &&
        intento.numero_intento > actual.numero_intento)
    ) {
      representativoPorPar.set(clave, intento);
    }
  }

  const finalizados = (todosLosIntentos ?? []).filter((i) => i.estado === "entregado" || i.estado === "expirado");
  const stats = calcularEstadisticas(finalizados);

  const idsIntentosFinalizados = finalizados.map((i) => i.id);
  let desglose: { tipo_agrupacion: string; clave: string; correctas: number; total: number }[] = [];
  let preguntasError: ReturnType<typeof calcularPreguntasConMasErrores> = [];
  if (idsIntentosFinalizados.length > 0) {
    const [{ data: desgloseData }, { data: preguntasIntento }, { data: respuestas }, { data: preguntasInfo }] =
      await Promise.all([
        admin.from("resultado_desglose").select("tipo_agrupacion,clave,correctas,total").in("intento_id", idsIntentosFinalizados),
        admin.from("intento_preguntas").select("pregunta_id,intento_id,respuesta_correcta").in("intento_id", idsIntentosFinalizados),
        admin.from("respuestas_estudiante").select("pregunta_id,intento_id,opcion_seleccionada").in("intento_id", idsIntentosFinalizados),
        admin.from("preguntas").select("id,codigo,enunciado"),
      ]);
    desglose = desgloseData ?? [];
    const infoPorId = new Map((preguntasInfo ?? []).map((p) => [p.id, p]));
    preguntasError = calcularPreguntasConMasErrores(
      idsIntentosFinalizados,
      preguntasIntento ?? [],
      respuestas ?? [],
      infoPorId
    );
  }

  const porEje = agregarPorTipo(desglose, "eje", ETIQUETA_EJE);
  const porCapacidad = agregarPorTipo(desglose, "capacidad", ETIQUETA_CAPACIDAD);
  const porDificultad = agregarPorTipo(desglose, "dificultad", ETIQUETA_DIFICULTAD);

  // ---------------------------------------------------------------------
  // Construcción del libro
  // ---------------------------------------------------------------------
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Simulador Aprender Matemática";
  workbook.created = new Date();

  const resumen = workbook.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Indicador", key: "indicador", width: 34 },
    { header: "Valor", key: "valor", width: 20 },
  ];
  resumen.addRows([
    { indicador: "Reporte", valor: tituloReporte },
    { indicador: "Estudiantes", valor: estudiantes.length },
    { indicador: "Evaluaciones incluidas", valor: evaluacionIds.length },
    { indicador: "Intentos finalizados", valor: stats.totalIntentos },
    { indicador: "Promedio (%)", valor: stats.promedio },
    { indicador: "Porcentaje de aprobación (%)", valor: stats.porcentajeAprobacion },
    { indicador: "Puntaje más alto (%)", valor: stats.mejor },
    { indicador: "Puntaje más bajo (%)", valor: stats.peor },
    { indicador: "Tiempo promedio (min)", valor: stats.tiempoPromedioMin },
    { indicador: "Generado el", valor: new Date() },
  ]);
  resumen.getColumn("valor").numFmt = undefined;
  resumen.getCell("B10").numFmt = "dd/mm/yyyy hh:mm";
  resumen.getRow(1).font = { bold: true };

  const hojaResultados = workbook.addWorksheet("Resultados por estudiante");
  hojaResultados.columns = [
    { header: "Apellido", key: "apellido", width: 18 },
    { header: "Nombre", key: "nombre", width: 18 },
    { header: "Correo", key: "email", width: 32 },
    { header: "Evaluación", key: "evaluacion", width: 32 },
    { header: "Estado", key: "estado", width: 20 },
    { header: "Intento N°", key: "intento", width: 10 },
    { header: "Puntaje", key: "puntaje", width: 12 },
    { header: "Porcentaje", key: "porcentaje", width: 12 },
    { header: "Correctas", key: "correctas", width: 12 },
    { header: "Incorrectas", key: "incorrectas", width: 12 },
    { header: "Sin responder", key: "sin_responder", width: 14 },
    { header: "Aprobado", key: "aprobado", width: 12 },
    { header: "Tiempo (min)", key: "tiempo", width: 14 },
    { header: "Fecha de entrega", key: "fecha", width: 20 },
  ];
  for (const est of estudiantes) {
    for (const evalId of evaluacionIds) {
      const rep = representativoPorPar.get(`${est.id}::${evalId}`);
      hojaResultados.addRow({
        apellido: est.apellido,
        nombre: est.nombre,
        email: est.email,
        evaluacion: nombreEvaluacion.get(evalId) ?? "—",
        estado: rep ? (ETIQUETA_ESTADO_INTENTO[rep.estado] ?? rep.estado) : "Pendiente",
        intento: rep?.numero_intento ?? "—",
        puntaje: rep?.puntaje_obtenido ?? "—",
        porcentaje: rep?.porcentaje_obtenido ?? "—",
        correctas: rep?.correctas ?? "—",
        incorrectas: rep?.incorrectas ?? "—",
        sin_responder: rep?.sin_responder ?? "—",
        aprobado: rep ? (rep.aprobado ? "Sí" : rep.estado === "en_curso" ? "—" : "No") : "—",
        tiempo: rep?.tiempo_utilizado_segundos ? Math.round(rep.tiempo_utilizado_segundos / 60) : "—",
        fecha: rep?.fecha_entrega ? new Date(rep.fecha_entrega) : "—",
      });
    }
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
  for (const [agrupacion, filas] of [
    ["Eje", porEje],
    ["Capacidad", porCapacidad],
    ["Dificultad", porDificultad],
  ] as const) {
    for (const f of filas) {
      hojaContenidos.addRow({ agrupacion, detalle: f.etiqueta, correctas: f.correctas, total: f.total, porcentaje: f.porcentaje });
    }
  }
  hojaContenidos.getColumn("porcentaje").numFmt = '0.00"%"';
  encabezar(hojaContenidos);

  const hojaPreguntas = workbook.addWorksheet("Preguntas con más errores");
  hojaPreguntas.columns = [
    { header: "Código", key: "codigo", width: 14 },
    { header: "Enunciado", key: "enunciado", width: 60 },
    { header: "Incorrectas", key: "incorrectas", width: 14 },
    { header: "Total de respuestas", key: "total", width: 18 },
    { header: "Porcentaje de error", key: "porcentaje_error", width: 18 },
  ];
  for (const p of preguntasError) {
    hojaPreguntas.addRow({
      codigo: p.codigo,
      enunciado: p.enunciado,
      incorrectas: p.incorrectas,
      total: p.total,
      porcentaje_error: Math.round((p.incorrectas / p.total) * 10000) / 100,
    });
  }
  hojaPreguntas.getColumn("porcentaje_error").numFmt = '0.00"%"';
  encabezar(hojaPreguntas);

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `reporte-general-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
