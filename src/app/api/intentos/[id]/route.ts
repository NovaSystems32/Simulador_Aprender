import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { aPreguntasPublicas, finalizarIntento } from "@/lib/intentos-server";

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

  if (intento.estado === "en_curso") {
    const inicio = new Date(intento.fecha_inicio);
    const venceEn = inicio.getTime() + intento.tiempo_limite_segundos * 1000;
    if (Date.now() >= venceEn) {
      const actualizado = await finalizarIntento(admin, id);
      return NextResponse.json({ estado: actualizado.estado, entregadoAutomaticamente: true });
    }

    const { data: evaluacion } = await admin.from("evaluaciones").select("*").eq("id", intento.evaluacion_id).single();
    const { data: preguntas } = await admin
      .from("intento_preguntas")
      .select("pregunta_id, orden, enunciado, recurso_url, recurso_alt, opciones, eje")
      .eq("intento_id", id);
    const { data: respuestas } = await admin
      .from("respuestas_estudiante")
      .select("pregunta_id, opcion_seleccionada, marcada_para_revisar")
      .eq("intento_id", id);

    return NextResponse.json({
      estado: "en_curso",
      evaluacion: {
        nombre: evaluacion?.nombre,
        permitirCalculadora: evaluacion?.permitir_calculadora,
        permitirHojaFormulas: evaluacion?.permitir_hoja_formulas,
      },
      tiempoLimiteSegundos: intento.tiempo_limite_segundos,
      tiempoRestanteSegundos: Math.max(0, intento.tiempo_limite_segundos - Math.floor((Date.now() - inicio.getTime()) / 1000)),
      preguntas: aPreguntasPublicas(preguntas ?? []),
      respuestas: respuestas ?? [],
    });
  }

  return NextResponse.json({ estado: intento.estado });
}
