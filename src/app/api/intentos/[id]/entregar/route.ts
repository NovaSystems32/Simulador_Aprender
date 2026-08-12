import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { finalizarIntento } from "@/lib/intentos-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const actualizado = await finalizarIntento(admin, id);
  const { data: evaluacion } = await admin
    .from("evaluaciones")
    .select("mostrar_resultado_inmediato")
    .eq("id", actualizado.evaluacion_id)
    .single();

  return NextResponse.json({
    estado: actualizado.estado,
    mostrarResultado: evaluacion?.mostrar_resultado_inmediato ?? true,
    porcentajeObtenido: actualizado.porcentaje_obtenido,
    correctas: actualizado.correctas,
    incorrectas: actualizado.incorrectas,
    sinResponder: actualizado.sin_responder,
    aprobado: actualizado.aprobado,
  });
}
