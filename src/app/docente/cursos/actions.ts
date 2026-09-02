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

// Agregar un estudiante ya registrado se hace ahora en lote desde
// GestionEstudiantesCurso (ver agregarEstudiantesAlCurso más abajo), con
// búsqueda y selección múltiple en vez de un campo de correo uno por uno.

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

export interface ResultadoAccionCurso {
  ok: boolean;
  mensaje: string;
}

/** Alta masiva: agrega varios estudiantes ya registrados a un curso de una sola vez. */
export async function agregarEstudiantesAlCurso(
  cursoId: string,
  perfilIds: string[]
): Promise<ResultadoAccionCurso> {
  await exigirPerfil(["docente", "admin"]);
  if (perfilIds.length === 0) return { ok: false, mensaje: "Seleccioná al menos un estudiante." };

  const supabase = await crearClienteServidor();

  // No duplicar inscripciones: se filtran los que ya están en el curso antes de insertar.
  const { data: yaInscriptos } = await supabase
    .from("curso_integrantes")
    .select("perfil_id")
    .eq("curso_id", cursoId)
    .in("perfil_id", perfilIds);
  const idsExistentes = new Set((yaInscriptos ?? []).map((i) => i.perfil_id));
  const nuevos = perfilIds.filter((id) => !idsExistentes.has(id));

  if (nuevos.length === 0) {
    return { ok: false, mensaje: "Los estudiantes seleccionados ya estaban en el curso." };
  }

  const { error } = await supabase
    .from("curso_integrantes")
    .insert(nuevos.map((perfilId) => ({ curso_id: cursoId, perfil_id: perfilId, rol_en_curso: "estudiante" as const })));
  if (error) return { ok: false, mensaje: `No se pudo agregar a los estudiantes: ${error.message}` };

  revalidatePath(`/docente/cursos/${cursoId}`);
  const omitidos = perfilIds.length - nuevos.length;
  return {
    ok: true,
    mensaje:
      omitidos > 0
        ? `Se agregaron ${nuevos.length} estudiante(s) (${omitidos} ya estaban en el curso).`
        : `Se agregaron ${nuevos.length} estudiante(s) al curso.`,
  };
}

/** Baja masiva: quita varios estudiantes de un curso de una sola vez. */
export async function quitarEstudiantesDelCurso(
  cursoId: string,
  perfilIds: string[]
): Promise<ResultadoAccionCurso> {
  await exigirPerfil(["docente", "admin"]);
  if (perfilIds.length === 0) return { ok: false, mensaje: "Seleccioná al menos un estudiante." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("curso_integrantes")
    .delete()
    .eq("curso_id", cursoId)
    .in("perfil_id", perfilIds);
  if (error) return { ok: false, mensaje: `No se pudo quitar a los estudiantes: ${error.message}` };

  revalidatePath(`/docente/cursos/${cursoId}`);
  return { ok: true, mensaje: `Se quitó a ${perfilIds.length} estudiante(s) del curso.` };
}
