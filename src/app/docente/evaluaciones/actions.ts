"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirPerfil } from "@/lib/auth";
import type { ConfigAutomatica, EstadoEvaluacion } from "@/lib/types";

export interface EstadoFormularioEvaluacion {
  error: string | null;
}

function leerConfiguracionComun(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    curso_id: String(formData.get("curso_id") ?? ""),
    fecha_apertura: String(formData.get("fecha_apertura") ?? "") || null,
    fecha_cierre: String(formData.get("fecha_cierre") ?? "") || null,
    duracion_minutos: Number(formData.get("duracion_minutos") ?? 0),
    orden_aleatorio_preguntas: formData.get("orden_aleatorio_preguntas") === "on",
    orden_aleatorio_opciones: formData.get("orden_aleatorio_opciones") === "on",
    intentos_max: Number(formData.get("intentos_max") ?? 1),
    puntaje_aprobacion: Number(formData.get("puntaje_aprobacion") ?? 60),
    mostrar_resultado_inmediato: formData.get("mostrar_resultado_inmediato") === "on",
    permitir_revision: formData.get("permitir_revision") === "on",
    mostrar_resoluciones: formData.get("mostrar_resoluciones") === "on",
    permitir_calculadora: formData.get("permitir_calculadora") === "on",
    permitir_hoja_formulas: formData.get("permitir_hoja_formulas") === "on",
    descuento_por_incorrecta: formData.get("descuento_por_incorrecta") === "on",
  };
}

function validarComun(campos: ReturnType<typeof leerConfiguracionComun>): string | null {
  if (!campos.nombre) return "El nombre de la evaluación es obligatorio.";
  if (!campos.curso_id) return "Seleccioná un curso.";
  if (!campos.duracion_minutos || campos.duracion_minutos <= 0) return "Indicá una duración válida en minutos.";
  if (!campos.intentos_max || campos.intentos_max <= 0) return "La cantidad máxima de intentos debe ser mayor a 0.";
  if (campos.puntaje_aprobacion < 0 || campos.puntaje_aprobacion > 100) {
    return "El puntaje de aprobación debe estar entre 0 y 100.";
  }
  return null;
}

export async function crearEvaluacionManual(
  _estadoPrevio: EstadoFormularioEvaluacion,
  formData: FormData
): Promise<EstadoFormularioEvaluacion> {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const comun = leerConfiguracionComun(formData);
  const errorComun = validarComun(comun);
  if (errorComun) return { error: errorComun };

  const preguntaIds = formData.getAll("pregunta_ids").map(String);
  if (preguntaIds.length === 0) {
    return { error: "Seleccioná al menos una pregunta del banco." };
  }

  const supabase = await crearClienteServidor();
  const { data: evaluacion, error } = await supabase
    .from("evaluaciones")
    .insert({
      ...comun,
      tipo: "manual",
      cantidad_preguntas: preguntaIds.length,
      config_automatica: null,
      estado: "borrador",
      creado_por: perfil.id,
    })
    .select()
    .single();

  if (error || !evaluacion) {
    return { error: `No se pudo crear la evaluación: ${error?.message}` };
  }

  const filas = preguntaIds.map((preguntaId, indice) => ({
    evaluacion_id: evaluacion.id,
    pregunta_id: preguntaId,
    orden: indice + 1,
  }));
  const { error: errorPreguntas } = await supabase.from("evaluacion_preguntas").insert(filas);
  if (errorPreguntas) {
    return { error: `Evaluación creada, pero hubo un error al asociar las preguntas: ${errorPreguntas.message}` };
  }

  await autoAsignarCursoDeOrigen(supabase, evaluacion.id, comun.curso_id);

  revalidatePath("/docente/evaluaciones");
  redirect(`/docente/evaluaciones/${evaluacion.id}`);
}

/**
 * El curso elegido al crear la evaluación (evaluaciones.curso_id) es
 * obligatorio, así que también debe quedar "asignado" desde el vamos: sin
 * esto, los estudiantes de ese curso no veían la evaluación en su panel ni
 * podían rendirla hasta que alguien repitiera manualmente el mismo curso en
 * "Cursos asignados". No falla la creación de la evaluación si esto falla
 * (ya existe, por ejemplo); el docente puede agregarlo a mano desde el panel.
 */
async function autoAsignarCursoDeOrigen(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  evaluacionId: string,
  cursoId: string
) {
  await supabase.from("asignaciones").insert({ evaluacion_id: evaluacionId, curso_id: cursoId });
}

export async function crearEvaluacionAutomatica(
  _estadoPrevio: EstadoFormularioEvaluacion,
  formData: FormData
): Promise<EstadoFormularioEvaluacion> {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const comun = leerConfiguracionComun(formData);
  const errorComun = validarComun(comun);
  if (errorComun) return { error: errorComun };

  const ejes = ["numeros_operaciones", "algebra_funciones", "geometria_medida", "estadistica_probabilidad"] as const;
  const distribucion: ConfigAutomatica["distribucion"] = [];
  let total = 0;
  for (const eje of ejes) {
    const cantidad = Number(formData.get(`cantidad_${eje}`) ?? 0);
    if (cantidad > 0) {
      distribucion.push({ eje, cantidad });
      total += cantidad;
    }
  }

  if (total === 0) {
    return { error: "Indicá al menos una pregunta en algún eje para la selección automática." };
  }

  const supabase = await crearClienteServidor();
  const { data: evaluacion, error } = await supabase
    .from("evaluaciones")
    .insert({
      ...comun,
      tipo: "automatica",
      cantidad_preguntas: total,
      config_automatica: { distribucion },
      estado: "borrador",
      creado_por: perfil.id,
    })
    .select()
    .single();

  if (error || !evaluacion) {
    return { error: `No se pudo crear la evaluación: ${error?.message}` };
  }

  await autoAsignarCursoDeOrigen(supabase, evaluacion.id, comun.curso_id);

  revalidatePath("/docente/evaluaciones");
  redirect(`/docente/evaluaciones/${evaluacion.id}`);
}

export async function cambiarEstadoEvaluacion(id: string, estado: EstadoEvaluacion) {
  await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("evaluaciones").update({ estado }).eq("id", id);
  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  revalidatePath("/docente/evaluaciones");
  revalidatePath(`/docente/evaluaciones/${id}`);
}

export async function asignarCurso(evaluacionId: string, cursoId: string) {
  await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("asignaciones")
    .insert({ evaluacion_id: evaluacionId, curso_id: cursoId });
  if (error) throw new Error(`No se pudo asignar el curso: ${error.message}`);
  revalidatePath(`/docente/evaluaciones/${evaluacionId}`);
}

export async function quitarAsignacion(evaluacionId: string, cursoId: string) {
  await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("asignaciones")
    .delete()
    .eq("evaluacion_id", evaluacionId)
    .eq("curso_id", cursoId);
  if (error) throw new Error(`No se pudo quitar la asignación: ${error.message}`);
  revalidatePath(`/docente/evaluaciones/${evaluacionId}`);
}
