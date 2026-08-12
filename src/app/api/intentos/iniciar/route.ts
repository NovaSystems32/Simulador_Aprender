import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { armarSnapshotPreguntas, aPreguntasPublicas, finalizarIntento } from "@/lib/intentos-server";
import type { Evaluacion } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: perfil } = await supabase.from("perfiles").select("rol, activo").eq("id", user.id).single();
  if (!perfil || !perfil.activo || perfil.rol !== "estudiante") {
    return NextResponse.json({ error: "Solo los estudiantes pueden rendir evaluaciones." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const evaluacionId = body?.evaluacionId as string | undefined;
  if (!evaluacionId) return NextResponse.json({ error: "Falta evaluacionId." }, { status: 400 });

  const admin = crearClienteAdmin();

  const { data: evaluacion } = await admin.from("evaluaciones").select("*").eq("id", evaluacionId).single();
  if (!evaluacion || evaluacion.estado !== "publicada") {
    return NextResponse.json({ error: "La evaluación no está disponible." }, { status: 404 });
  }
  const ev = evaluacion as Evaluacion;

  const ahora = new Date();
  if (ev.fecha_apertura && ahora < new Date(ev.fecha_apertura)) {
    return NextResponse.json({ error: "La evaluación todavía no está abierta." }, { status: 403 });
  }
  if (ev.fecha_cierre && ahora > new Date(ev.fecha_cierre)) {
    return NextResponse.json({ error: "La evaluación ya cerró." }, { status: 403 });
  }

  const { data: integrante } = await admin
    .from("curso_integrantes")
    .select("id")
    .eq("curso_id", ev.curso_id)
    .eq("perfil_id", user.id)
    .eq("rol_en_curso", "estudiante")
    .maybeSingle();
  const { data: asignacion } = await admin
    .from("asignaciones")
    .select("id")
    .eq("evaluacion_id", ev.id)
    .eq("curso_id", ev.curso_id)
    .maybeSingle();
  if (!integrante || !asignacion) {
    return NextResponse.json({ error: "Esta evaluación no está asignada a tu curso." }, { status: 403 });
  }

  const { data: intentosPrevios } = await admin
    .from("intentos")
    .select("*")
    .eq("evaluacion_id", ev.id)
    .eq("estudiante_id", user.id)
    .order("numero_intento", { ascending: false });

  const enCurso = (intentosPrevios ?? []).find((i) => i.estado === "en_curso");
  if (enCurso) {
    const inicio = new Date(enCurso.fecha_inicio ?? enCurso.created_at);
    const venceEn = inicio.getTime() + enCurso.tiempo_limite_segundos * 1000;
    if (ahora.getTime() < venceEn) {
      return NextResponse.json(await construirRespuestaIntento(admin, enCurso.id, ev));
    }
    await finalizarIntento(admin, enCurso.id);
  }

  const finalizados = (intentosPrevios ?? []).filter((i) => i.estado === "entregado" || i.estado === "expirado");
  if (finalizados.length >= ev.intentos_max) {
    return NextResponse.json(
      { error: "Ya usaste todos los intentos disponibles para esta evaluación." },
      { status: 403 }
    );
  }

  let snapshot;
  try {
    snapshot = await armarSnapshotPreguntas(admin, ev);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error armando la evaluación." }, { status: 500 });
  }

  const { data: nuevoIntento, error: errorIntento } = await admin
    .from("intentos")
    .insert({
      evaluacion_id: ev.id,
      estudiante_id: user.id,
      numero_intento: finalizados.length + 1,
      estado: "en_curso",
      fecha_inicio: ahora.toISOString(),
      tiempo_limite_segundos: ev.duracion_minutos * 60,
    })
    .select()
    .single();
  if (errorIntento || !nuevoIntento) {
    return NextResponse.json({ error: `No se pudo iniciar el intento: ${errorIntento?.message}` }, { status: 500 });
  }

  const { error: errorPreguntas } = await admin
    .from("intento_preguntas")
    .insert(snapshot.map((s) => ({ intento_id: nuevoIntento.id, ...s })));
  if (errorPreguntas) {
    return NextResponse.json({ error: `No se pudieron guardar las preguntas: ${errorPreguntas.message}` }, { status: 500 });
  }

  return NextResponse.json(await construirRespuestaIntento(admin, nuevoIntento.id, ev));
}

async function construirRespuestaIntento(
  admin: ReturnType<typeof crearClienteAdmin>,
  intentoId: string,
  evaluacion: Evaluacion
) {
  const { data: intento } = await admin.from("intentos").select("*").eq("id", intentoId).single();
  const { data: preguntas } = await admin
    .from("intento_preguntas")
    .select("pregunta_id, orden, enunciado, recurso_url, recurso_alt, opciones, eje")
    .eq("intento_id", intentoId);
  const { data: respuestas } = await admin
    .from("respuestas_estudiante")
    .select("pregunta_id, opcion_seleccionada, marcada_para_revisar")
    .eq("intento_id", intentoId);

  const inicio = new Date(intento.fecha_inicio);
  const tiempoRestante = Math.max(
    0,
    intento.tiempo_limite_segundos - Math.floor((Date.now() - inicio.getTime()) / 1000)
  );

  return {
    intentoId,
    evaluacion: {
      nombre: evaluacion.nombre,
      permitirCalculadora: evaluacion.permitir_calculadora,
      permitirHojaFormulas: evaluacion.permitir_hoja_formulas,
    },
    tiempoLimiteSegundos: intento.tiempo_limite_segundos,
    tiempoRestanteSegundos: tiempoRestante,
    preguntas: aPreguntasPublicas(preguntas ?? []),
    respuestas: respuestas ?? [],
  };
}
