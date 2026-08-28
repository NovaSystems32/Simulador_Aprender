import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CAPACIDADES, DIFICULTADES, EJES } from "@/lib/types";
import { GraficoDesempeno } from "@/components/resultados/GraficoDesempeno";
import { FiltrosReportes } from "./FiltrosReportes";
import { BotonesExportar } from "./BotonesExportar";

const ETIQUETA_EJE = Object.fromEntries(EJES.map((e) => [e.value, e.label]));
const ETIQUETA_CAPACIDAD = Object.fromEntries(CAPACIDADES.map((c) => [c.value, c.label]));
const ETIQUETA_DIFICULTAD = Object.fromEntries(DIFICULTADES.map((d) => [d.value, d.label]));

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string; evaluacion?: string }>;
}) {
  await exigirPerfil(["docente", "admin"]);
  const { curso: cursoIdFiltro, evaluacion: evaluacionIdFiltro } = await searchParams;
  const supabase = await crearClienteServidor();

  const { data: cursos } = await supabase.from("cursos").select("*").order("nombre");
  const { data: evaluaciones } = await supabase
    .from("evaluaciones")
    .select("*")
    .order("created_at", { ascending: false });

  const evaluacionesFiltradas = cursoIdFiltro
    ? (evaluaciones ?? []).filter((e) => e.curso_id === cursoIdFiltro)
    : evaluaciones ?? [];

  let consultaIntentos = supabase
    .from("intentos")
    .select("*, evaluaciones!inner(id, nombre, curso_id, puntaje_aprobacion)")
    .in("estado", ["entregado", "expirado"]);

  if (evaluacionIdFiltro) consultaIntentos = consultaIntentos.eq("evaluacion_id", evaluacionIdFiltro);
  else if (cursoIdFiltro) consultaIntentos = consultaIntentos.eq("evaluaciones.curso_id", cursoIdFiltro);

  const { data: intentos } = await consultaIntentos;
  const listaIntentos = intentos ?? [];

  const totalIntentos = listaIntentos.length;
  const promedio = totalIntentos
    ? Math.round((listaIntentos.reduce((s, i) => s + (i.porcentaje_obtenido ?? 0), 0) / totalIntentos) * 100) / 100
    : 0;
  const aprobados = listaIntentos.filter((i) => i.aprobado).length;
  const porcentajeAprobacion = totalIntentos ? Math.round((aprobados / totalIntentos) * 10000) / 100 : 0;
  const mejor = totalIntentos ? Math.max(...listaIntentos.map((i) => i.porcentaje_obtenido ?? 0)) : 0;
  const peor = totalIntentos ? Math.min(...listaIntentos.map((i) => i.porcentaje_obtenido ?? 0)) : 0;
  const tiempoPromedioMin = totalIntentos
    ? Math.round(listaIntentos.reduce((s, i) => s + (i.tiempo_utilizado_segundos ?? 0), 0) / totalIntentos / 60)
    : 0;

  const idsIntentos = listaIntentos.map((i) => i.id);
  let desglose: { tipo_agrupacion: string; clave: string; correctas: number; total: number }[] = [];
  if (idsIntentos.length > 0) {
    const { data } = await supabase
      .from("resultado_desglose")
      .select("tipo_agrupacion, clave, correctas, total")
      .in("intento_id", idsIntentos);
    desglose = data ?? [];
  }

  function agregarPorTipo(tipo: string, etiquetas: Record<string, string>) {
    const acumulado = new Map<string, { correctas: number; total: number }>();
    for (const fila of desglose.filter((d) => d.tipo_agrupacion === tipo)) {
      const actual = acumulado.get(fila.clave) ?? { correctas: 0, total: 0 };
      actual.correctas += fila.correctas;
      actual.total += fila.total;
      acumulado.set(fila.clave, actual);
    }
    return Array.from(acumulado.entries()).map(([clave, v]) => ({
      etiqueta: etiquetas[clave] ?? clave,
      porcentaje: v.total === 0 ? 0 : Math.round((v.correctas / v.total) * 10000) / 100,
    }));
  }

  const porEje = agregarPorTipo("eje", ETIQUETA_EJE);
  const porCapacidad = agregarPorTipo("capacidad", ETIQUETA_CAPACIDAD);
  const porDificultad = agregarPorTipo("dificultad", ETIQUETA_DIFICULTAD);

  // Preguntas con mayor porcentaje de error
  let preguntasError: { pregunta_id: string; enunciado: string; codigo: string; incorrectas: number; total: number }[] = [];
  if (idsIntentos.length > 0) {
    const { data: preguntasIntento } = await supabase
      .from("intento_preguntas")
      .select("pregunta_id, intento_id, respuesta_correcta")
      .in("intento_id", idsIntentos);
    const { data: respuestasTodas } = await supabase
      .from("respuestas_estudiante")
      .select("pregunta_id, intento_id, opcion_seleccionada")
      .in("intento_id", idsIntentos);
    const { data: preguntasInfo } = await supabase.from("preguntas").select("id, codigo, enunciado");

    const infoPorId = new Map((preguntasInfo ?? []).map((p) => [p.id, p]));
    const respuestaClave = (intentoId: string, preguntaId: string) => `${intentoId}::${preguntaId}`;
    const respuestasPorClave = new Map(
      (respuestasTodas ?? []).map((r) => [respuestaClave(r.intento_id, r.pregunta_id), r.opcion_seleccionada])
    );

    const conteo = new Map<string, { incorrectas: number; total: number }>();
    for (const pi of preguntasIntento ?? []) {
      const seleccionada = respuestasPorClave.get(respuestaClave(pi.intento_id, pi.pregunta_id));
      const actual = conteo.get(pi.pregunta_id) ?? { incorrectas: 0, total: 0 };
      actual.total += 1;
      if (seleccionada !== pi.respuesta_correcta) actual.incorrectas += 1;
      conteo.set(pi.pregunta_id, actual);
    }

    preguntasError = Array.from(conteo.entries())
      .map(([preguntaId, v]) => ({
        pregunta_id: preguntaId,
        codigo: infoPorId.get(preguntaId)?.codigo ?? "—",
        enunciado: infoPorId.get(preguntaId)?.enunciado ?? "",
        incorrectas: v.incorrectas,
        total: v.total,
      }))
      .sort((a, b) => b.incorrectas / b.total - a.incorrectas / a.total)
      .slice(0, 10);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-azul-800">Reportes</h1>
        <BotonesExportar curso={cursoIdFiltro} evaluacion={evaluacionIdFiltro} />
      </div>

      <FiltrosReportes cursos={cursos ?? []} evaluaciones={evaluacionesFiltradas} />

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Dato etiqueta="Intentos" valor={String(totalIntentos)} />
        <Dato etiqueta="Promedio" valor={`${promedio}%`} />
        <Dato etiqueta="Aprobación" valor={`${porcentajeAprobacion}%`} />
        <Dato etiqueta="Mejor resultado" valor={`${mejor}%`} />
        <Dato etiqueta="Resultado más bajo" valor={`${peor}%`} />
        <Dato etiqueta="Tiempo promedio" valor={`${tiempoPromedioMin} min`} />
      </div>

      {totalIntentos === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No hay intentos entregados para los filtros seleccionados.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-azul-800">Rendimiento por eje matemático</h2>
            <GraficoDesempeno datos={porEje} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TablaSimple titulo="Rendimiento por capacidad evaluada" filas={porCapacidad} />
            <TablaSimple titulo="Rendimiento por dificultad" filas={porDificultad} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-azul-800">Preguntas con mayor porcentaje de error</h2>
            {preguntasError.length === 0 ? (
              <p className="text-sm text-slate-500">Sin datos suficientes.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {preguntasError.map((p) => (
                  <li key={p.pregunta_id} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <span>
                      <span className="font-mono text-xs text-slate-400">{p.codigo}</span> {p.enunciado.slice(0, 80)}
                      {p.enunciado.length > 80 && "…"}
                    </span>
                    <span className="shrink-0 font-semibold text-error">
                      {Math.round((p.incorrectas / p.total) * 100)}% de error
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{etiqueta}</p>
      <p className="text-lg font-semibold text-slate-800">{valor}</p>
    </div>
  );
}

function TablaSimple({ titulo, filas }: { titulo: string; filas: { etiqueta: string; porcentaje: number }[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold text-azul-800">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="text-sm text-slate-500">Sin datos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filas.map((f) => (
            <li key={f.etiqueta} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{f.etiqueta}</span>
              <span className="font-medium text-slate-600">{f.porcentaje}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
