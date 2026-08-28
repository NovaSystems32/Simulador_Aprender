import Link from "next/link";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Evaluacion } from "@/lib/types";

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  archivada: "Archivada",
};

const ESTILO_ESTADO: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-700",
  publicada: "bg-exito-50 text-exito",
  archivada: "bg-advertencia-50 text-advertencia",
};

export default async function PaginaEvaluaciones() {
  await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("evaluaciones")
    .select("*, cursos(nombre, division)")
    .order("created_at", { ascending: false });

  const evaluaciones = (data ?? []) as (Evaluacion & { cursos: { nombre: string; division: string } | null })[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-azul-800">Evaluaciones</h1>
        <Link
          href="/docente/evaluaciones/nueva"
          className="rounded-lg bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-800"
        >
          Nueva evaluación
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-error-50 px-3 py-2 text-sm text-error">
          No se pudieron cargar las evaluaciones: {error.message}
        </p>
      )}

      {evaluaciones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Todavía no creaste ninguna evaluación.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evaluaciones.map((evaluacion) => (
            <Link
              key={evaluacion.id}
              href={`/docente/evaluaciones/${evaluacion.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-azul-600 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-azul-800">{evaluacion.nombre}</h2>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ESTILO_ESTADO[evaluacion.estado]}`}>
                  {ETIQUETA_ESTADO[evaluacion.estado]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {evaluacion.cursos ? `${evaluacion.cursos.nombre} "${evaluacion.cursos.division}"` : "Sin curso"}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <dt className="text-slate-400">Tipo</dt>
                  <dd>{evaluacion.tipo === "manual" ? "Manual" : "Automática"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Preguntas</dt>
                  <dd>{evaluacion.cantidad_preguntas}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Duración</dt>
                  <dd>{evaluacion.duracion_minutos} min</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Aprobación</dt>
                  <dd>{evaluacion.puntaje_aprobacion}%</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
