import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { finalizarIntento } from "@/lib/intentos-server";
import type { OpcionLetra } from "@/lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const preguntaId = body?.preguntaId as string | undefined;
  const opcionSeleccionada = (body?.opcionSeleccionada ?? null) as OpcionLetra | null;
  const marcadaParaRevisar = Boolean(body?.marcadaParaRevisar);
  if (!preguntaId) return NextResponse.json({ error: "Falta preguntaId." }, { status: 400 });

  const admin = crearClienteAdmin();
  const { data: intento } = await admin.from("intentos").select("*").eq("id", id).single();
  if (!intento || intento.estudiante_id !== user.id) {
    return NextResponse.json({ error: "Intento no encontrado." }, { status: 404 });
  }
  if (intento.estado !== "en_curso") {
    return NextResponse.json({ error: "Este intento ya fue entregado." }, { status: 409 });
  }

  const inicio = new Date(intento.fecha_inicio);
  if (Date.now() >= inicio.getTime() + intento.tiempo_limite_segundos * 1000) {
    await finalizarIntento(admin, id);
    return NextResponse.json({ error: "El tiempo de la evaluación se agotó." }, { status: 409 });
  }

  const { data: preguntaValida } = await admin
    .from("intento_preguntas")
    .select("id")
    .eq("intento_id", id)
    .eq("pregunta_id", preguntaId)
    .maybeSingle();
  if (!preguntaValida) {
    return NextResponse.json({ error: "Esa pregunta no pertenece a este intento." }, { status: 400 });
  }

  const { error } = await admin.from("respuestas_estudiante").upsert(
    {
      intento_id: id,
      pregunta_id: preguntaId,
      opcion_seleccionada: opcionSeleccionada,
      marcada_para_revisar: marcadaParaRevisar,
      respondida_en: new Date().toISOString(),
    },
    { onConflict: "intento_id,pregunta_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
