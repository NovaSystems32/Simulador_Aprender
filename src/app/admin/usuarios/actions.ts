"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { exigirPerfil } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import type { RolUsuario } from "@/lib/types";

export interface ResultadoAccion {
  ok: boolean;
  mensaje: string;
}

export interface EstadoFormularioUsuario {
  error: string | null;
  mensaje?: string | null;
}

function generarPasswordTemporal(): string {
  return `Aprender${Math.floor(1000 + Math.random() * 9000)}!`;
}

export async function crearUsuario(
  _estadoPrevio: EstadoFormularioUsuario,
  formData: FormData
): Promise<EstadoFormularioUsuario> {
  await exigirPerfil(["admin"]);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const rol = String(formData.get("rol") ?? "estudiante") as RolUsuario;

  if (!email || !nombre || !apellido) return { error: "Completá todos los campos." };

  const admin = crearClienteAdmin();
  const password = generarPasswordTemporal();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { rol, nombre, apellido },
  });

  if (error || !data.user) {
    return { error: `No se pudo crear el usuario: ${error?.message ?? "error desconocido"}` };
  }

  revalidatePath("/admin/usuarios");
  return { error: null, mensaje: `Usuario creado: ${email} — Contraseña temporal: ${password}` };
}

export async function alternarActivo(perfilId: string, activo: boolean): Promise<ResultadoAccion> {
  const quienAdmin = await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { data: perfil, error: errorLectura } = await admin
    .from("perfiles")
    .select("nombre,apellido,email")
    .eq("id", perfilId)
    .single();
  if (errorLectura || !perfil) return { ok: false, mensaje: "No se encontró el usuario." };

  const { error } = await admin.from("perfiles").update({ activo }).eq("id", perfilId);
  if (error) return { ok: false, mensaje: `No se pudo actualizar: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: activo ? "reactivar_usuario" : "desactivar_usuario",
    tablaAfectada: "perfiles",
    registroId: perfilId,
    cantidadRegistros: 1,
    detalle: { email: perfil.email },
  });

  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    mensaje: activo
      ? `${perfil.nombre} ${perfil.apellido} fue reactivado/a correctamente.`
      : `${perfil.nombre} ${perfil.apellido} fue desactivado/a correctamente.`,
  };
}

export async function cambiarRol(perfilId: string, rol: RolUsuario) {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();
  const { error } = await admin.from("perfiles").update({ rol }).eq("id", perfilId);
  if (error) throw new Error(`No se pudo cambiar el rol: ${error.message}`);
  revalidatePath("/admin/usuarios");
}

export async function actualizarDatosUsuario(
  perfilId: string,
  datos: { nombre: string; apellido: string }
): Promise<ResultadoAccion> {
  await exigirPerfil(["admin"]);
  const nombre = datos.nombre.trim();
  const apellido = datos.apellido.trim();
  if (!nombre || !apellido) return { ok: false, mensaje: "Nombre y apellido son obligatorios." };

  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("perfiles")
    .update({ nombre, apellido, updated_at: new Date().toISOString() })
    .eq("id", perfilId);
  if (error) return { ok: false, mensaje: `No se pudo actualizar: ${error.message}` };

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${perfilId}`);
  return { ok: true, mensaje: "Los datos del usuario se actualizaron correctamente." };
}

export interface ResumenEliminacionEstudiante {
  nombre: string;
  apellido: string;
  email: string;
  cursoDivision: string | null;
  evaluacionesRealizadas: number;
  resultadosAsociados: number;
}

export async function obtenerResumenEliminacionEstudiante(
  perfilId: string
): Promise<ResumenEliminacionEstudiante> {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { data: perfil, error } = await admin
    .from("perfiles")
    .select("nombre,apellido,email,rol")
    .eq("id", perfilId)
    .single();
  if (error || !perfil) throw new Error("No se encontró el estudiante.");
  if (perfil.rol !== "estudiante") {
    throw new Error("Esta acción solo está disponible para cuentas de estudiante.");
  }

  const { data: integrante } = await admin
    .from("curso_integrantes")
    .select("cursos(nombre,division)")
    .eq("perfil_id", perfilId)
    .eq("rol_en_curso", "estudiante")
    .limit(1)
    .maybeSingle<{ cursos: { nombre: string; division: string } | null }>();

  const { data: intentos } = await admin
    .from("intentos")
    .select("evaluacion_id,estado")
    .eq("estudiante_id", perfilId);

  const finalizados = (intentos ?? []).filter((i) => i.estado === "entregado" || i.estado === "expirado");
  const evaluacionesRealizadas = new Set(finalizados.map((i) => i.evaluacion_id)).size;
  const resultadosAsociados = (intentos ?? []).filter((i) => i.estado === "entregado").length;

  return {
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    email: perfil.email,
    cursoDivision: integrante?.cursos ? `${integrante.cursos.nombre} / ${integrante.cursos.division}` : null,
    evaluacionesRealizadas,
    resultadosAsociados,
  };
}

export async function eliminarEstudianteDefinitivo(
  perfilId: string,
  confirmacionTexto: string
): Promise<ResultadoAccion> {
  const quienAdmin = await exigirPerfil(["admin"]);
  if (confirmacionTexto !== "ELIMINAR") {
    return { ok: false, mensaje: 'Debés escribir exactamente "ELIMINAR" para confirmar.' };
  }
  if (perfilId === quienAdmin.id) {
    return { ok: false, mensaje: "No podés eliminar tu propia cuenta de administradora." };
  }

  const admin = crearClienteAdmin();
  const { data: perfil, error: errorLectura } = await admin
    .from("perfiles")
    .select("nombre,apellido,email,rol")
    .eq("id", perfilId)
    .single();
  if (errorLectura || !perfil) return { ok: false, mensaje: "No se encontró el estudiante." };
  if (perfil.rol !== "estudiante") {
    return { ok: false, mensaje: "Esta acción solo está disponible para cuentas de estudiante." };
  }

  const { count: cantidadIntentos } = await admin
    .from("intentos")
    .select("id", { count: "exact", head: true })
    .eq("estudiante_id", perfilId);

  // Borra el usuario en Supabase Auth; el perfil, sus inscripciones a cursos,
  // intentos, respuestas y resultado_desglose se eliminan en cascada por las
  // reglas ON DELETE definidas en el esquema.
  const { error } = await admin.auth.admin.deleteUser(perfilId);
  if (error) return { ok: false, mensaje: `No se pudo eliminar el estudiante: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: "eliminar_estudiante_definitivo",
    tablaAfectada: "perfiles",
    registroId: perfilId,
    cantidadRegistros: 1 + (cantidadIntentos ?? 0),
    detalle: { email: perfil.email, intentos_eliminados: cantidadIntentos ?? 0 },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, mensaje: `${perfil.nombre} ${perfil.apellido} fue eliminado/a definitivamente.` };
}
