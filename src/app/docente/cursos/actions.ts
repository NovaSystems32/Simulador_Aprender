"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { exigirPerfil } from "@/lib/auth";

export interface EstadoFormulario {
  error: string | null;
  mensaje?: string | null;
}

export async function crearCurso(
  _estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const nombre = String(formData.get("nombre") ?? "").trim();
  const division = String(formData.get("division") ?? "").trim();
  const anioLectivo = Number(formData.get("anio_lectivo") ?? new Date().getFullYear());

  if (!nombre || !division) return { error: "Completá el nombre y la división del curso." };

  const supabase = await crearClienteServidor();
  const { data: cursoExistente } = await supabase.from("perfiles").select("institucion_id").eq("id", perfil.id).single();

  const { error } = await supabase.from("cursos").insert({
    nombre,
    division,
    anio_lectivo: anioLectivo,
    docente_titular_id: perfil.id,
    institucion_id: cursoExistente?.institucion_id ?? null,
  });

  if (error) return { error: `No se pudo crear el curso: ${error.message}` };
  revalidatePath("/docente/cursos");
  return { error: null, mensaje: "Curso creado correctamente." };
}

function generarPasswordTemporal(): string {
  return `Aprender${Math.floor(1000 + Math.random() * 9000)}!`;
}

export async function incorporarEstudianteNuevo(
  cursoId: string,
  _estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirPerfil(["docente", "admin"]);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();

  if (!email || !nombre || !apellido) return { error: "Completá nombre, apellido y correo del estudiante." };

  const admin = crearClienteAdmin();
  const passwordTemporal = generarPasswordTemporal();

  const { data: usuario, error: errorCreacion } = await admin.auth.admin.createUser({
    email,
    password: passwordTemporal,
    email_confirm: true,
    user_metadata: { rol: "estudiante", nombre, apellido },
  });

  if (errorCreacion || !usuario.user) {
    return { error: `No se pudo crear el estudiante: ${errorCreacion?.message ?? "error desconocido"}` };
  }

  const { error: errorIntegrante } = await admin
    .from("curso_integrantes")
    .insert({ curso_id: cursoId, perfil_id: usuario.user.id, rol_en_curso: "estudiante" });

  if (errorIntegrante) {
    return { error: `Estudiante creado, pero no se pudo agregar al curso: ${errorIntegrante.message}` };
  }

  revalidatePath(`/docente/cursos/${cursoId}`);
  return {
    error: null,
    mensaje: `Estudiante agregado. Usuario: ${email} — Contraseña temporal: ${passwordTemporal} (pedile que la cambie en su primer ingreso).`,
  };
}

export async function incorporarEstudianteExistente(cursoId: string, email: string): Promise<EstadoFormulario> {
  await exigirPerfil(["docente", "admin"]);
  const admin = crearClienteAdmin();

  const { data: perfilEstudiante } = await admin
    .from("perfiles")
    .select("id, rol")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!perfilEstudiante || perfilEstudiante.rol !== "estudiante") {
    return { error: "No se encontró un estudiante activo con ese correo." };
  }

  const { error } = await admin
    .from("curso_integrantes")
    .insert({ curso_id: cursoId, perfil_id: perfilEstudiante.id, rol_en_curso: "estudiante" });

  if (error) {
    if (error.code === "23505") return { error: "Ese estudiante ya está en el curso." };
    return { error: `No se pudo agregar: ${error.message}` };
  }

  revalidatePath(`/docente/cursos/${cursoId}`);
  return { error: null, mensaje: "Estudiante agregado al curso." };
}

export async function quitarIntegrante(cursoId: string, perfilId: string) {
  await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("curso_integrantes")
    .delete()
    .eq("curso_id", cursoId)
    .eq("perfil_id", perfilId);
  if (error) throw new Error(`No se pudo quitar al integrante: ${error.message}`);
  revalidatePath(`/docente/cursos/${cursoId}`);
}
