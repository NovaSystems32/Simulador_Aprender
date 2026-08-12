import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";
import type { Perfil } from "./types";

/** Devuelve el perfil del usuario autenticado o null si no hay sesión. Uso en Server Components. */
export async function obtenerPerfilActual(): Promise<Perfil | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
  return (perfil as Perfil) ?? null;
}

/** Exige un perfil con alguno de los roles indicados; si no, redirige. Uso en páginas server. */
export async function exigirPerfil(rolesPermitidos: Perfil["rol"][]): Promise<Perfil> {
  const perfil = await obtenerPerfilActual();
  if (!perfil || !perfil.activo) {
    redirect("/login");
  }
  if (!rolesPermitidos.includes(perfil.rol)) {
    redirect("/no-autorizado");
  }
  return perfil;
}

export function rutaInicioPorRol(rol: Perfil["rol"]): string {
  if (rol === "admin") return "/admin";
  if (rol === "docente") return "/docente";
  return "/estudiante";
}
