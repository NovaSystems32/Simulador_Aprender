"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirPerfil } from "@/lib/auth";

export interface EstadoConfiguracion {
  error: string | null;
  guardado?: boolean;
}

export async function guardarConfiguracion(
  _estadoPrevio: EstadoConfiguracion,
  formData: FormData
): Promise<EstadoConfiguracion> {
  const perfil = await exigirPerfil(["admin"]);
  const nombreInstitucion = String(formData.get("nombre_institucion") ?? "").trim();
  const puntajeAprobacionDefault = Number(formData.get("puntaje_aprobacion_default") ?? 60);

  if (!nombreInstitucion) return { error: "El nombre de la institución es obligatorio." };

  const supabase = await crearClienteServidor();
  const { data: miPerfil } = await supabase.from("perfiles").select("institucion_id").eq("id", perfil.id).single();
  const institucionId = miPerfil?.institucion_id;

  if (institucionId) {
    await supabase.from("instituciones").update({ nombre: nombreInstitucion }).eq("id", institucionId);
  }

  const { error } = await supabase.from("configuraciones").upsert(
    {
      institucion_id: institucionId ?? null,
      clave: "puntaje_aprobacion_default",
      valor: { valor: puntajeAprobacionDefault },
    },
    { onConflict: "institucion_id,clave" }
  );

  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/admin/configuracion");
  return { error: null, guardado: true };
}
