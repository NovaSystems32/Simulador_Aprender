"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { exigirPerfil } from "@/lib/auth";
import type { RolUsuario } from "@/lib/types";

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

export async function alternarActivo(perfilId: string, activo: boolean) {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();
  const { error } = await admin.from("perfiles").update({ activo }).eq("id", perfilId);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
  revalidatePath("/admin/usuarios");
}

export async function cambiarRol(perfilId: string, rol: RolUsuario) {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();
  const { error } = await admin.from("perfiles").update({ rol }).eq("id", perfilId);
  if (error) throw new Error(`No se pudo cambiar el rol: ${error.message}`);
  revalidatePath("/admin/usuarios");
}
