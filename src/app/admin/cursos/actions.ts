"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirPerfil } from "@/lib/auth";

export interface EstadoFormulario {
  error: string | null;
}

export async function crearCursoAdmin(
  _estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirPerfil(["admin"]);
  const nombre = String(formData.get("nombre") ?? "").trim();
  const division = String(formData.get("division") ?? "").trim();
  const anioLectivo = Number(formData.get("anio_lectivo") ?? new Date().getFullYear());
  const docenteTitularId = String(formData.get("docente_titular_id") ?? "") || null;

  if (!nombre || !division) return { error: "Completá el nombre y la división del curso." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("cursos").insert({
    nombre,
    division,
    anio_lectivo: anioLectivo,
    docente_titular_id: docenteTitularId,
  });

  if (error) return { error: `No se pudo crear el curso: ${error.message}` };
  revalidatePath("/admin/cursos");
  return { error: null };
}
