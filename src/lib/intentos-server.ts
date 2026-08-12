import type { SupabaseClient } from "@supabase/supabase-js";
import { barajarOpciones, ordenarPreguntasIntento, seleccionarPreguntasAutomaticas } from "./randomization";
import { corregirIntento, type PreguntaParaCorregir, type RespuestaParaCorregir } from "./scoring";
import type { Evaluacion, OpcionLetra, Pregunta, PreguntaIntentoPublica } from "./types";

/** Arma el snapshot inmutable de preguntas (con opciones ya barajadas) para un nuevo intento. */
export async function armarSnapshotPreguntas(
  supabaseAdmin: SupabaseClient,
  evaluacion: Evaluacion
): Promise<
  {
    pregunta_id: string;
    orden: number;
    enunciado: string;
    recurso_url: string | null;
    recurso_alt: string | null;
    opciones: { letra: OpcionLetra; texto: string }[];
    respuesta_correcta: OpcionLetra;
    explicacion: string;
    eje: Pregunta["eje"];
    contenido: string;
    capacidad: Pregunta["capacidad"];
    dificultad: Pregunta["dificultad"];
  }[]
> {
  let preguntasBase: Pregunta[] = [];

  if (evaluacion.tipo === "automatica") {
    if (!evaluacion.config_automatica) {
      throw new Error("La evaluación automática no tiene configurada la distribución de preguntas.");
    }
    const { data: banco, error } = await supabaseAdmin
      .from("preguntas")
      .select("*")
      .eq("estado", "activa");
    if (error) throw new Error(`No se pudo leer el banco de preguntas: ${error.message}`);

    const { preguntas, errores } = seleccionarPreguntasAutomaticas(
      (banco ?? []) as Pregunta[],
      evaluacion.config_automatica
    );
    if (errores.length > 0) {
      throw new Error(
        `No hay suficientes preguntas activas para armar la evaluación: ${errores
          .map((e) => `${e.eje} (pide ${e.solicitadas}, hay ${e.disponibles})`)
          .join(", ")}`
      );
    }
    preguntasBase = preguntas;
  } else {
    const { data: filas, error } = await supabaseAdmin
      .from("evaluacion_preguntas")
      .select("orden, preguntas(*)")
      .eq("evaluacion_id", evaluacion.id)
      .order("orden");
    if (error) throw new Error(`No se pudieron leer las preguntas de la evaluación: ${error.message}`);
    preguntasBase = (filas ?? []).map((f) => f.preguntas as unknown as Pregunta);
  }

  const ordenadas = ordenarPreguntasIntento(preguntasBase, evaluacion.orden_aleatorio_preguntas);

  return ordenadas.map((pregunta, indice) => {
    const opcionesBarajadas = barajarOpciones(pregunta, evaluacion.orden_aleatorio_opciones);
    const nuevaLetraCorrecta = opcionesBarajadas.find(
      (o) => o.letraOriginal === pregunta.respuesta_correcta
    )!.letra;

    return {
      pregunta_id: pregunta.id,
      orden: indice + 1,
      enunciado: pregunta.enunciado,
      recurso_url: pregunta.recurso_url,
      recurso_alt: pregunta.recurso_alt,
      opciones: opcionesBarajadas.map((o) => ({ letra: o.letra, texto: o.texto })),
      respuesta_correcta: nuevaLetraCorrecta,
      explicacion: pregunta.explicacion,
      eje: pregunta.eje,
      contenido: pregunta.contenido,
      capacidad: pregunta.capacidad,
      dificultad: pregunta.dificultad,
    };
  });
}

/** Convierte las filas de intento_preguntas (con la respuesta correcta) a la versión pública que ve el estudiante. */
export function aPreguntasPublicas(
  filas: {
    pregunta_id: string;
    orden: number;
    enunciado: string;
    recurso_url: string | null;
    recurso_alt: string | null;
    opciones: { letra: OpcionLetra; texto: string }[];
    eje: Pregunta["eje"];
  }[]
): PreguntaIntentoPublica[] {
  return filas
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((f) => ({
      pregunta_id: f.pregunta_id,
      orden: f.orden,
      enunciado: f.enunciado,
      recurso_url: f.recurso_url,
      recurso_alt: f.recurso_alt,
      opciones: f.opciones,
      eje: f.eje,
    }));
}

/**
 * Corrige un intento en curso (o vencido) y persiste el resultado. Es
 * idempotente: si ya estaba entregado, no lo vuelve a corregir.
 */
export async function finalizarIntento(supabaseAdmin: SupabaseClient, intentoId: string) {
  const { data: intento, error: errorIntento } = await supabaseAdmin
    .from("intentos")
    .select("*")
    .eq("id", intentoId)
    .single();
  if (errorIntento || !intento) throw new Error("Intento no encontrado.");
  if (intento.estado === "entregado" || intento.estado === "expirado") return intento;

  const { data: evaluacion, error: errorEvaluacion } = await supabaseAdmin
    .from("evaluaciones")
    .select("*")
    .eq("id", intento.evaluacion_id)
    .single();
  if (errorEvaluacion || !evaluacion) throw new Error("Evaluación no encontrada.");

  const { data: preguntasIntento } = await supabaseAdmin
    .from("intento_preguntas")
    .select("pregunta_id, respuesta_correcta, eje, contenido, capacidad, dificultad")
    .eq("intento_id", intentoId);

  const { data: respuestas } = await supabaseAdmin
    .from("respuestas_estudiante")
    .select("pregunta_id, opcion_seleccionada")
    .eq("intento_id", intentoId);

  const resultado = corregirIntento(
    (preguntasIntento ?? []) as PreguntaParaCorregir[],
    (respuestas ?? []) as RespuestaParaCorregir[],
    {
      puntajeAprobacion: evaluacion.puntaje_aprobacion,
      descuentoPorIncorrecta: evaluacion.descuento_por_incorrecta,
    }
  );

  const ahora = new Date();
  const inicio = new Date(intento.fecha_inicio ?? ahora);
  const tiempoUtilizado = Math.min(
    Math.round((ahora.getTime() - inicio.getTime()) / 1000),
    intento.tiempo_limite_segundos
  );

  const seVencio = ahora.getTime() - inicio.getTime() > intento.tiempo_limite_segundos * 1000 + 5000;

  const { data: intentoActualizado, error: errorUpdate } = await supabaseAdmin
    .from("intentos")
    .update({
      estado: seVencio ? "expirado" : "entregado",
      fecha_entrega: ahora.toISOString(),
      tiempo_utilizado_segundos: tiempoUtilizado,
      puntaje_obtenido: resultado.puntaje_obtenido,
      porcentaje_obtenido: resultado.porcentaje_obtenido,
      correctas: resultado.correctas,
      incorrectas: resultado.incorrectas,
      sin_responder: resultado.sin_responder,
      aprobado: resultado.aprobado,
    })
    .eq("id", intentoId)
    .select()
    .single();
  if (errorUpdate) throw new Error(`No se pudo guardar el resultado: ${errorUpdate.message}`);

  await supabaseAdmin.from("resultado_desglose").delete().eq("intento_id", intentoId);
  if (resultado.desglose.length > 0) {
    await supabaseAdmin
      .from("resultado_desglose")
      .insert(resultado.desglose.map((d) => ({ intento_id: intentoId, ...d })));
  }

  return intentoActualizado;
}
