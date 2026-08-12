"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { exigirPerfil } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export interface ResultadoAccion {
  ok: boolean;
  mensaje: string;
}

async function contarIntentosRelacionados(admin: ReturnType<typeof crearClienteAdmin>, filtro: { estudiante_id?: string; evaluacion_id?: string }) {
  let consulta = admin.from("intentos").select("id", { count: "exact", head: true });
  if (filtro.estudiante_id) consulta = consulta.eq("estudiante_id", filtro.estudiante_id);
  if (filtro.evaluacion_id) consulta = consulta.eq("evaluacion_id", filtro.evaluacion_id);
  const { count } = await consulta;

  let idsQuery = admin.from("intentos").select("id");
  if (filtro.estudiante_id) idsQuery = idsQuery.eq("estudiante_id", filtro.estudiante_id);
  if (filtro.evaluacion_id) idsQuery = idsQuery.eq("evaluacion_id", filtro.evaluacion_id);
  const { data: intentosIds } = await idsQuery;
  const ids = (intentosIds ?? []).map((i) => i.id);

  let respuestas = 0;
  let resultados = 0;
  if (ids.length > 0) {
    const { count: cResp } = await admin
      .from("respuestas_estudiante")
      .select("id", { count: "exact", head: true })
      .in("intento_id", ids);
    respuestas = cResp ?? 0;
    const { count: cRes } = await admin
      .from("resultado_desglose")
      .select("id", { count: "exact", head: true })
      .in("intento_id", ids);
    resultados = cRes ?? 0;
  }

  return { intentos: count ?? 0, respuestas, resultados };
}

// ---------------------------------------------------------------------
// Limpiar historial de un estudiante (conserva cuenta, curso, evaluaciones)
// ---------------------------------------------------------------------
export async function obtenerResumenHistorialEstudiante(perfilId: string) {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();
  return contarIntentosRelacionados(admin, { estudiante_id: perfilId });
}

export async function limpiarHistorialEstudiante(perfilId: string): Promise<ResultadoAccion> {
  const quienAdmin = await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { data: perfil } = await admin.from("perfiles").select("nombre,apellido,email").eq("id", perfilId).single();
  if (!perfil) return { ok: false, mensaje: "No se encontró el estudiante." };

  const resumen = await contarIntentosRelacionados(admin, { estudiante_id: perfilId });
  const { error } = await admin.from("intentos").delete().eq("estudiante_id", perfilId);
  if (error) return { ok: false, mensaje: `No se pudo limpiar el historial: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: "limpiar_historial_estudiante",
    tablaAfectada: "intentos",
    registroId: perfilId,
    cantidadRegistros: resumen.intentos + resumen.respuestas + resumen.resultados,
    detalle: { email: perfil.email, ...resumen },
  });

  revalidatePath("/admin/gestion-datos");
  revalidatePath(`/admin/usuarios/${perfilId}`);
  return {
    ok: true,
    mensaje: `El historial de ${perfil.nombre} ${perfil.apellido} fue eliminado correctamente (${resumen.intentos} intento(s)).`,
  };
}

// ---------------------------------------------------------------------
// Limpiar historial de una evaluación (conserva la evaluación y sus preguntas)
// ---------------------------------------------------------------------
export async function obtenerResumenHistorialEvaluacion(evaluacionId: string) {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();
  return contarIntentosRelacionados(admin, { evaluacion_id: evaluacionId });
}

export async function limpiarHistorialEvaluacion(evaluacionId: string): Promise<ResultadoAccion> {
  const quienAdmin = await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { data: evaluacion } = await admin.from("evaluaciones").select("nombre").eq("id", evaluacionId).single();
  if (!evaluacion) return { ok: false, mensaje: "No se encontró la evaluación." };

  const resumen = await contarIntentosRelacionados(admin, { evaluacion_id: evaluacionId });
  const { error } = await admin.from("intentos").delete().eq("evaluacion_id", evaluacionId);
  if (error) return { ok: false, mensaje: `No se pudo limpiar el historial: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: "limpiar_historial_evaluacion",
    tablaAfectada: "intentos",
    registroId: evaluacionId,
    cantidadRegistros: resumen.intentos + resumen.respuestas + resumen.resultados,
    detalle: { evaluacion: evaluacion.nombre, ...resumen },
  });

  revalidatePath("/admin/gestion-datos");
  return {
    ok: true,
    mensaje: `El historial de "${evaluacion.nombre}" fue eliminado correctamente (${resumen.intentos} intento(s)). La evaluación sigue disponible como no realizada.`,
  };
}

// ---------------------------------------------------------------------
// Eliminar una evaluación completa
// ---------------------------------------------------------------------
export async function obtenerResumenEliminacionEvaluacion(evaluacionId: string) {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { count: asignaciones } = await admin
    .from("asignaciones")
    .select("id", { count: "exact", head: true })
    .eq("evaluacion_id", evaluacionId);
  const { count: preguntasVinculadas } = await admin
    .from("evaluacion_preguntas")
    .select("id", { count: "exact", head: true })
    .eq("evaluacion_id", evaluacionId);
  const historial = await contarIntentosRelacionados(admin, { evaluacion_id: evaluacionId });

  return { asignaciones: asignaciones ?? 0, preguntasVinculadas: preguntasVinculadas ?? 0, ...historial };
}

export async function eliminarEvaluacion(evaluacionId: string): Promise<ResultadoAccion> {
  const quienAdmin = await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { data: evaluacion } = await admin.from("evaluaciones").select("nombre").eq("id", evaluacionId).single();
  if (!evaluacion) return { ok: false, mensaje: "No se encontró la evaluación." };

  const resumen = await obtenerResumenEliminacionEvaluacion(evaluacionId);
  const { error } = await admin.from("evaluaciones").delete().eq("id", evaluacionId);
  if (error) return { ok: false, mensaje: `No se pudo eliminar la evaluación: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: "eliminar_evaluacion",
    tablaAfectada: "evaluaciones",
    registroId: evaluacionId,
    cantidadRegistros: 1 + resumen.asignaciones + resumen.preguntasVinculadas + resumen.intentos + resumen.respuestas + resumen.resultados,
    detalle: { evaluacion: evaluacion.nombre, ...resumen },
  });

  revalidatePath("/admin/gestion-datos");
  revalidatePath("/docente/evaluaciones");
  return { ok: true, mensaje: `La evaluación "${evaluacion.nombre}" fue eliminada definitivamente.` };
}

// ---------------------------------------------------------------------
// Limpieza general de resultados (todo el sistema)
// ---------------------------------------------------------------------
export async function obtenerResumenLimpiezaGeneral() {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();
  const { count: intentos } = await admin.from("intentos").select("id", { count: "exact", head: true });
  const { count: respuestas } = await admin.from("respuestas_estudiante").select("id", { count: "exact", head: true });
  const { count: resultados } = await admin.from("resultado_desglose").select("id", { count: "exact", head: true });
  return { intentos: intentos ?? 0, respuestas: respuestas ?? 0, resultados: resultados ?? 0 };
}

export async function limpiarHistorialGeneral(confirmacionTexto: string): Promise<ResultadoAccion> {
  const quienAdmin = await exigirPerfil(["admin"]);
  if (confirmacionTexto !== "LIMPIAR HISTORIAL") {
    return { ok: false, mensaje: 'Debés escribir exactamente "LIMPIAR HISTORIAL" para confirmar.' };
  }

  const admin = crearClienteAdmin();
  const resumen = await obtenerResumenLimpiezaGeneral();

  const { error } = await admin.from("intentos").delete().not("id", "is", null);
  if (error) return { ok: false, mensaje: `No se pudo limpiar el historial: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: "limpiar_historial_general",
    tablaAfectada: "intentos",
    cantidadRegistros: resumen.intentos + resumen.respuestas + resumen.resultados,
    detalle: resumen,
  });

  revalidatePath("/admin/gestion-datos");
  return {
    ok: true,
    mensaje: `El historial fue eliminado correctamente: ${resumen.intentos} intento(s), ${resumen.respuestas} respuesta(s), ${resumen.resultados} resultado(s). Usuarios, cursos, evaluaciones y el banco de preguntas quedaron intactos.`,
  };
}
