"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { exigirPerfil } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import type {
  CapacidadEvaluada,
  EjeMatematico,
  EstadoPregunta,
  NivelDificultad,
  OpcionLetra,
} from "@/lib/types";

export interface EstadoFormularioPregunta {
  error: string | null;
  ok: boolean;
}

const PREFIJOS_EJE: Record<EjeMatematico, string> = {
  numeros_operaciones: "NUM",
  algebra_funciones: "ALG",
  geometria_medida: "GEO",
  estadistica_probabilidad: "EST",
};

function leerCamposPregunta(formData: FormData) {
  return {
    enunciado: String(formData.get("enunciado") ?? "").trim(),
    recurso_url: String(formData.get("recurso_url") ?? "").trim() || null,
    recurso_alt: String(formData.get("recurso_alt") ?? "").trim() || null,
    opcion_a: String(formData.get("opcion_a") ?? "").trim(),
    opcion_b: String(formData.get("opcion_b") ?? "").trim(),
    opcion_c: String(formData.get("opcion_c") ?? "").trim(),
    opcion_d: String(formData.get("opcion_d") ?? "").trim(),
    respuesta_correcta: String(formData.get("respuesta_correcta") ?? "") as OpcionLetra,
    explicacion: String(formData.get("explicacion") ?? "").trim(),
    eje: String(formData.get("eje") ?? "") as EjeMatematico,
    contenido: String(formData.get("contenido") ?? "").trim(),
    capacidad: String(formData.get("capacidad") ?? "") as CapacidadEvaluada,
    dificultad: String(formData.get("dificultad") ?? "") as NivelDificultad,
    estado: String(formData.get("estado") ?? "borrador") as EstadoPregunta,
  };
}

function validarCampos(campos: ReturnType<typeof leerCamposPregunta>): string | null {
  if (!campos.enunciado) return "El enunciado es obligatorio.";
  if (!campos.opcion_a || !campos.opcion_b || !campos.opcion_c || !campos.opcion_d) {
    return "Las cuatro opciones (A, B, C y D) son obligatorias.";
  }
  if (!["A", "B", "C", "D"].includes(campos.respuesta_correcta)) {
    return "Indicá cuál es la opción correcta.";
  }
  if (!campos.explicacion) return "La explicación de la resolución es obligatoria.";
  if (!campos.eje) return "Seleccioná el eje matemático.";
  if (!campos.contenido) return "Indicá el contenido específico.";
  if (!campos.capacidad) return "Seleccioná la capacidad evaluada.";
  if (!campos.dificultad) return "Seleccioná el nivel de dificultad.";
  return null;
}

async function generarCodigo(eje: EjeMatematico): Promise<string> {
  const supabase = await crearClienteServidor();
  const prefijo = PREFIJOS_EJE[eje];
  const { count } = await supabase
    .from("preguntas")
    .select("id", { count: "exact", head: true })
    .like("codigo", `${prefijo}-%`);
  const siguiente = (count ?? 0) + 1;
  return `${prefijo}-${String(siguiente).padStart(3, "0")}`;
}

export async function crearPregunta(
  _estadoPrevio: EstadoFormularioPregunta,
  formData: FormData
): Promise<EstadoFormularioPregunta> {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const campos = leerCamposPregunta(formData);
  const error = validarCampos(campos);
  if (error) return { error, ok: false };

  const supabase = await crearClienteServidor();
  const codigo = await generarCodigo(campos.eje);

  const { error: errorInsert } = await supabase.from("preguntas").insert({
    ...campos,
    codigo,
    autor_id: perfil.id,
  });

  if (errorInsert) {
    return { error: `No se pudo guardar la pregunta: ${errorInsert.message}`, ok: false };
  }

  revalidatePath("/docente/preguntas");
  revalidatePath("/admin/preguntas");
  return { error: null, ok: true };
}

export async function actualizarPregunta(
  id: string,
  _estadoPrevio: EstadoFormularioPregunta,
  formData: FormData
): Promise<EstadoFormularioPregunta> {
  await exigirPerfil(["docente", "admin"]);
  const campos = leerCamposPregunta(formData);
  const error = validarCampos(campos);
  if (error) return { error, ok: false };

  const supabase = await crearClienteServidor();
  const { error: errorUpdate } = await supabase
    .from("preguntas")
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (errorUpdate) {
    return { error: `No se pudo actualizar la pregunta: ${errorUpdate.message}`, ok: false };
  }

  revalidatePath("/docente/preguntas");
  revalidatePath("/admin/preguntas");
  return { error: null, ok: true };
}

export async function duplicarPregunta(id: string) {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();

  const { data: original, error: errorLectura } = await supabase
    .from("preguntas")
    .select("*")
    .eq("id", id)
    .single();
  if (errorLectura || !original) throw new Error("No se encontró la pregunta a duplicar.");

  const codigo = await generarCodigo(original.eje);
  const { error } = await supabase.from("preguntas").insert({
    codigo,
    enunciado: original.enunciado,
    recurso_url: original.recurso_url,
    recurso_alt: original.recurso_alt,
    opcion_a: original.opcion_a,
    opcion_b: original.opcion_b,
    opcion_c: original.opcion_c,
    opcion_d: original.opcion_d,
    respuesta_correcta: original.respuesta_correcta,
    explicacion: original.explicacion,
    eje: original.eje,
    contenido: original.contenido,
    capacidad: original.capacidad,
    dificultad: original.dificultad,
    curso_id: original.curso_id,
    autor_id: perfil.id,
    estado: "borrador",
  });
  if (error) throw new Error(`No se pudo duplicar: ${error.message}`);

  revalidatePath("/docente/preguntas");
  revalidatePath("/admin/preguntas");
}

export async function cambiarEstadoPregunta(id: string, estado: EstadoPregunta) {
  await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("preguntas").update({ estado }).eq("id", id);
  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);

  revalidatePath("/docente/preguntas");
  revalidatePath("/admin/preguntas");
}

export interface ResultadoAccionPregunta {
  ok: boolean;
  mensaje: string;
}

export interface ResumenEliminacionPregunta {
  codigo: string;
  enunciadoResumido: string;
  evaluacionesQueLaUsan: number;
  intentosQueLaUsan: number;
  respuestasVinculadas: number;
  tieneUsoHistorico: boolean;
}

/** Solo administradores: la eliminación permanente de preguntas nunca queda en manos de docentes. */
export async function obtenerResumenEliminacionPregunta(id: string): Promise<ResumenEliminacionPregunta> {
  await exigirPerfil(["admin"]);
  const admin = crearClienteAdmin();

  const { data: pregunta, error } = await admin
    .from("preguntas")
    .select("codigo,enunciado")
    .eq("id", id)
    .single();
  if (error || !pregunta) throw new Error("No se encontró la pregunta.");

  const { count: evaluacionesQueLaUsan } = await admin
    .from("evaluacion_preguntas")
    .select("id", { count: "exact", head: true })
    .eq("pregunta_id", id);
  const { count: intentosQueLaUsan } = await admin
    .from("intento_preguntas")
    .select("id", { count: "exact", head: true })
    .eq("pregunta_id", id);
  const { count: respuestasVinculadas } = await admin
    .from("respuestas_estudiante")
    .select("id", { count: "exact", head: true })
    .eq("pregunta_id", id);

  return {
    codigo: pregunta.codigo,
    enunciadoResumido: pregunta.enunciado.length > 140 ? `${pregunta.enunciado.slice(0, 140)}…` : pregunta.enunciado,
    evaluacionesQueLaUsan: evaluacionesQueLaUsan ?? 0,
    intentosQueLaUsan: intentosQueLaUsan ?? 0,
    respuestasVinculadas: respuestasVinculadas ?? 0,
    tieneUsoHistorico: (intentosQueLaUsan ?? 0) > 0,
  };
}

/**
 * Solo administradores. Requiere escribir "ELIMINAR PREGUNTA". Si la pregunta
 * ya fue usada en intentos rendidos, borrarla arrastra (por ON DELETE CASCADE)
 * los snapshots de intento_preguntas y las respuestas_estudiante asociadas: el
 * llamador debe haber mostrado ese impacto antes de invocar esta acción.
 */
export async function eliminarPregunta(id: string, confirmacionTexto: string): Promise<ResultadoAccionPregunta> {
  const quienAdmin = await exigirPerfil(["admin"]);
  if (confirmacionTexto !== "ELIMINAR PREGUNTA") {
    return { ok: false, mensaje: 'Debés escribir exactamente "ELIMINAR PREGUNTA" para confirmar.' };
  }

  const admin = crearClienteAdmin();
  const resumen = await obtenerResumenEliminacionPregunta(id);

  const { error } = await admin.from("preguntas").delete().eq("id", id);
  if (error) return { ok: false, mensaje: `No se pudo eliminar: ${error.message}` };

  await registrarAuditoria({
    admin: quienAdmin,
    accion: "eliminar_pregunta_definitivo",
    tablaAfectada: "preguntas",
    registroId: id,
    cantidadRegistros:
      1 + resumen.evaluacionesQueLaUsan + resumen.intentosQueLaUsan + resumen.respuestasVinculadas,
    detalle: { ...resumen },
  });

  revalidatePath("/docente/preguntas");
  revalidatePath("/admin/preguntas");
  return { ok: true, mensaje: `La pregunta ${resumen.codigo} fue eliminada definitivamente.` };
}

export interface FilaImportacion {
  enunciado: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: string;
  explicacion: string;
  eje: string;
  contenido: string;
  capacidad: string;
  dificultad: string;
}

export interface ResultadoImportacion {
  insertadas: number;
  errores: { fila: number; motivo: string }[];
}

const EJES_VALIDOS: EjeMatematico[] = [
  "numeros_operaciones",
  "algebra_funciones",
  "geometria_medida",
  "estadistica_probabilidad",
];
const CAPACIDADES_VALIDAS: CapacidadEvaluada[] = [
  "reconocimiento_conceptos",
  "interpretacion_informacion",
  "resolucion_problemas",
  "comunicacion_matematica",
  "modelizacion",
  "aplicacion_procedimientos",
  "analisis_graficos_tablas",
  "argumentacion",
];
const DIFICULTADES_VALIDAS: NivelDificultad[] = ["inicial", "medio", "avanzado"];

export async function importarPreguntas(filas: FilaImportacion[]): Promise<ResultadoImportacion> {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();

  const resultado: ResultadoImportacion = { insertadas: 0, errores: [] };
  const validas: Array<Record<string, unknown>> = [];

  filas.forEach((fila, indice) => {
    const numeroFila = indice + 2; // +2: encabezado + índice 1-based
    const eje = fila.eje?.trim() as EjeMatematico;
    const capacidad = fila.capacidad?.trim() as CapacidadEvaluada;
    const dificultad = fila.dificultad?.trim() as NivelDificultad;
    const correcta = fila.respuesta_correcta?.trim().toUpperCase();

    if (!fila.enunciado?.trim()) {
      resultado.errores.push({ fila: numeroFila, motivo: "Falta el enunciado." });
      return;
    }
    if (!fila.opcion_a?.trim() || !fila.opcion_b?.trim() || !fila.opcion_c?.trim() || !fila.opcion_d?.trim()) {
      resultado.errores.push({ fila: numeroFila, motivo: "Faltan una o más opciones (A-D)." });
      return;
    }
    if (!["A", "B", "C", "D"].includes(correcta)) {
      resultado.errores.push({ fila: numeroFila, motivo: `Respuesta correcta inválida: "${fila.respuesta_correcta}".` });
      return;
    }
    if (!fila.explicacion?.trim()) {
      resultado.errores.push({ fila: numeroFila, motivo: "Falta la explicación." });
      return;
    }
    if (!EJES_VALIDOS.includes(eje)) {
      resultado.errores.push({ fila: numeroFila, motivo: `Eje inválido: "${fila.eje}".` });
      return;
    }
    if (!fila.contenido?.trim()) {
      resultado.errores.push({ fila: numeroFila, motivo: "Falta el contenido." });
      return;
    }
    if (!CAPACIDADES_VALIDAS.includes(capacidad)) {
      resultado.errores.push({ fila: numeroFila, motivo: `Capacidad inválida: "${fila.capacidad}".` });
      return;
    }
    if (!DIFICULTADES_VALIDAS.includes(dificultad)) {
      resultado.errores.push({ fila: numeroFila, motivo: `Dificultad inválida: "${fila.dificultad}".` });
      return;
    }

    validas.push({
      enunciado: fila.enunciado.trim(),
      opcion_a: fila.opcion_a.trim(),
      opcion_b: fila.opcion_b.trim(),
      opcion_c: fila.opcion_c.trim(),
      opcion_d: fila.opcion_d.trim(),
      respuesta_correcta: correcta,
      explicacion: fila.explicacion.trim(),
      eje,
      contenido: fila.contenido.trim(),
      capacidad,
      dificultad,
      estado: "borrador",
      autor_id: perfil.id,
    });
  });

  for (const [indice, fila] of validas.entries()) {
    const codigo = await generarCodigo(fila.eje as EjeMatematico);
    const { error } = await supabase.from("preguntas").insert({ ...fila, codigo });
    if (error) {
      resultado.errores.push({ fila: indice + 2, motivo: error.message });
    } else {
      resultado.insertadas += 1;
    }
  }

  revalidatePath("/docente/preguntas");
  revalidatePath("/admin/preguntas");
  return resultado;
}
