import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";

/**
 * Devuelve las preguntas de un intento YA ENTREGADO junto con la respuesta
 * correcta y la explicación, para la revisión post-entrega. Solo accesible
 * si la evaluación tiene permitir_revision habilitado.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const admin = crearClienteAdmin();
  const { data: intento } = await admin.from("intentos").select("*").eq("id", id).single();
  if (!intento || intento.estudiante_id !== user.id) {
    return NextResponse.json({ error: "Intento no encontrado." }, { status: 404 });
  }
  if (intento.estado !== "entregado" && intento.estado !== "expirado") {
    return NextResponse.json({ error: "La evaluación todavía no fue entregada." }, { status: 403 });
  }

  const { data: evaluacion } = await admin
    .from("evaluaciones")
    .select("permitir_revision, mostrar_resoluciones")
    .eq("id", intento.evaluacion_id)
    .single();
  if (!evaluacion?.permitir_revision) {
    return NextResponse.json({ error: "El/la docente no habilitó la revisión de esta evaluación." }, { status: 403 });
  }

  const { data: preguntas } = await admin
    .from("intento_preguntas")
    .select("pregunta_id, orden, enunciado, recurso_url, recurso_alt, opciones, respuesta_correcta, explicacion, contenido")
    .eq("intento_id", id)
    .order("orden");
  const { data: respuestas } = await admin
    .from("respuestas_estudiante")
    .select("pregunta_id, opcion_seleccionada")
    .eq("intento_id", id);

  const respuestaPorPregunta = new Map((respuestas ?? []).map((r) => [r.pregunta_id, r.opcion_seleccionada]));

  return NextResponse.json({
    mostrarResoluciones: evaluacion.mostrar_resoluciones,
    preguntas: (preguntas ?? []).map((p) => ({
      ...p,
      respuesta_seleccionada: respuestaPorPregunta.get(p.pregunta_id) ?? null,
      explicacion: evaluacion.mostrar_resoluciones ? p.explicacion : null,
    })),
  });
}
