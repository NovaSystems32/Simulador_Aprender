import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { generarCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursoId = searchParams.get("curso");
  const evaluacionId = searchParams.get("evaluacion");

  let consulta = supabase
    .from("intentos")
    .select(
      "numero_intento, estado, correctas, incorrectas, sin_responder, porcentaje_obtenido, aprobado, tiempo_utilizado_segundos, fecha_entrega, perfiles!intentos_estudiante_id_fkey(nombre, apellido, email), evaluaciones!inner(nombre, curso_id, cursos(nombre, division))"
    )
    .in("estado", ["entregado", "expirado"]);

  if (evaluacionId) consulta = consulta.eq("evaluacion_id", evaluacionId);
  else if (cursoId) consulta = consulta.eq("evaluaciones.curso_id", cursoId);

  const { data, error } = await consulta;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  interface FilaIntento {
    numero_intento: number;
    estado: string;
    correctas: number | null;
    incorrectas: number | null;
    sin_responder: number | null;
    porcentaje_obtenido: number | null;
    aprobado: boolean | null;
    tiempo_utilizado_segundos: number | null;
    fecha_entrega: string | null;
    perfiles: { nombre: string; apellido: string; email: string } | null;
    evaluaciones: { nombre: string; cursos: { nombre: string; division: string } | null } | null;
  }

  const filas = ((data ?? []) as unknown as FilaIntento[]).map((f) => ({
    estudiante: `${f.perfiles?.nombre ?? ""} ${f.perfiles?.apellido ?? ""}`.trim(),
    email: f.perfiles?.email ?? "",
    evaluacion: f.evaluaciones?.nombre ?? "",
    curso: f.evaluaciones?.cursos ? `${f.evaluaciones.cursos.nombre} ${f.evaluaciones.cursos.division}` : "",
    intento: f.numero_intento,
    estado: f.estado,
    correctas: f.correctas ?? 0,
    incorrectas: f.incorrectas ?? 0,
    sin_responder: f.sin_responder ?? 0,
    porcentaje: f.porcentaje_obtenido ?? 0,
    aprobado: f.aprobado ? "Sí" : "No",
    tiempo_minutos: f.tiempo_utilizado_segundos ? Math.round(f.tiempo_utilizado_segundos / 60) : 0,
    fecha_entrega: f.fecha_entrega ?? "",
  }));

  const csv = generarCsv(filas, [
    { clave: "estudiante", encabezado: "Estudiante" },
    { clave: "email", encabezado: "Correo" },
    { clave: "evaluacion", encabezado: "Evaluación" },
    { clave: "curso", encabezado: "Curso" },
    { clave: "intento", encabezado: "N° intento" },
    { clave: "estado", encabezado: "Estado" },
    { clave: "correctas", encabezado: "Correctas" },
    { clave: "incorrectas", encabezado: "Incorrectas" },
    { clave: "sin_responder", encabezado: "Sin responder" },
    { clave: "porcentaje", encabezado: "Porcentaje" },
    { clave: "aprobado", encabezado: "Aprobado" },
    { clave: "tiempo_minutos", encabezado: "Tiempo (min)" },
    { clave: "fecha_entrega", encabezado: "Fecha de entrega" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte.csv"`,
    },
  });
}
