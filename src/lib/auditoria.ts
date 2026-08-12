import { crearClienteAdmin } from "./supabase/admin";
import type { Perfil } from "./types";

/**
 * Registra una acción administrativa sensible. Se llama siempre desde el
 * servidor, después de exigirPerfil(["admin"]) y de ejecutar la operación.
 * No guarda contraseñas, tokens ni respuestas correctas: "detalle" debe
 * limitarse a conteos y nombres/ids de referencia.
 */
export async function registrarAuditoria(params: {
  admin: Perfil;
  accion: string;
  tablaAfectada: string;
  registroId?: string | null;
  cantidadRegistros: number;
  detalle?: Record<string, unknown>;
}) {
  const admin = crearClienteAdmin();
  const { error } = await admin.from("auditoria_admin").insert({
    admin_id: params.admin.id,
    admin_email: params.admin.email,
    accion: params.accion,
    tabla_afectada: params.tablaAfectada,
    registro_id: params.registroId ?? null,
    cantidad_registros: params.cantidadRegistros,
    detalle: params.detalle ?? null,
  });
  if (error) {
    console.error("No se pudo registrar auditoría:", error.message);
  }
}
