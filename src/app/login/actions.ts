"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaInicioPorRol } from "@/lib/auth";
import type { RolUsuario } from "@/lib/types";

export interface EstadoLogin {
  error: string | null;
}

export async function iniciarSesion(
  _estadoPrevio: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  if (!email || !password) {
    return { error: "Ingresá tu usuario y tu contraseña." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", data.user.id)
    .single();

  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no está activa. Consultá con la institución." };
  }

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : rutaInicioPorRol(perfil.rol as RolUsuario));
}
