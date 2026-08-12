import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  href: string;
}

/**
 * Notificaciones reales (no decorativas): últimos intentos entregados visibles según el rol.
 * RLS ya acota el resultado: un estudiante solo ve sus propios intentos, un docente los de sus
 * cursos, y un admin todos. No hay tabla de notificaciones: se deriva de datos existentes.
 */
export async function GET() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil) return NextResponse.json({ notificaciones: [] });

  if (perfil.rol === "estudiante") {
    const { data } = await supabase
      .from("intentos")
      .select("id, porcentaje_obtenido, aprobado, fecha_entrega, evaluaciones(nombre)")
      .eq("estudiante_id", user.id)
      .not("fecha_entrega", "is", null)
      .order("fecha_entrega", { ascending: false })
      .limit(5);

    const notificaciones: Notificacion[] = (data ?? []).map((i) => ({
      id: i.id,
      titulo: (i.evaluaciones as unknown as { nombre: string } | null)?.nombre ?? "Evaluación",
      descripcion: `Resultado disponible: ${i.porcentaje_obtenido ?? 0}% — ${i.aprobado ? "aprobada" : "no aprobada"}`,
      fecha: i.fecha_entrega as string,
      href: `/estudiante/resultados/${i.id}`,
    }));
    return NextResponse.json({ notificaciones });
  }

  // docente y admin: últimos intentos entregados en su alcance (RLS lo acota)
  const { data } = await supabase
    .from("intentos")
    .select(
      "id, porcentaje_obtenido, fecha_entrega, evaluacion_id, evaluaciones(nombre), perfiles!intentos_estudiante_id_fkey(nombre, apellido)"
    )
    .not("fecha_entrega", "is", null)
    .order("fecha_entrega", { ascending: false })
    .limit(5);

  const notificaciones: Notificacion[] = (data ?? []).map((i) => {
    const estudiante = i.perfiles as unknown as { nombre: string; apellido: string } | null;
    const evaluacion = i.evaluaciones as unknown as { nombre: string } | null;
    return {
      id: i.id,
      titulo: estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : "Estudiante",
      descripcion: `${evaluacion?.nombre ?? "Evaluación"} — ${i.porcentaje_obtenido ?? 0}%`,
      fecha: i.fecha_entrega as string,
      href: `/docente/evaluaciones/${i.evaluacion_id}`,
    };
  });
  return NextResponse.json({ notificaciones });
}
