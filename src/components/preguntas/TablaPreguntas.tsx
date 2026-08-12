"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CAPACIDADES, DIFICULTADES, EJES, type Pregunta } from "@/lib/types";
import { cambiarEstadoPregunta, duplicarPregunta, eliminarPregunta } from "@/app/docente/preguntas/actions";

const ETIQUETA_EJE = Object.fromEntries(EJES.map((e) => [e.value, e.label]));
const ETIQUETA_CAPACIDAD = Object.fromEntries(CAPACIDADES.map((c) => [c.value, c.label]));
const ETIQUETA_DIFICULTAD = Object.fromEntries(DIFICULTADES.map((d) => [d.value, d.label]));

const ESTILO_ESTADO: Record<string, string> = {
  borrador: "bg-violeta-100 text-violeta-700",
  activa: "bg-exito-50 text-exito",
  archivada: "bg-advertencia-50 text-advertencia",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  activa: "Activa",
  archivada: "Archivada",
};

function Acciones({ pregunta, basePath, pendiente, iniciarTransicion }: {
  pregunta: Pregunta;
  basePath: string;
  pendiente: boolean;
  iniciarTransicion: (fn: () => void | Promise<void>) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <Link href={`${basePath}/${pregunta.id}/editar`} className="font-medium text-violeta-600 hover:underline">
        Editar
      </Link>
      <button
        type="button"
        disabled={pendiente}
        onClick={() => iniciarTransicion(() => duplicarPregunta(pregunta.id))}
        className="font-medium text-violeta-600 hover:underline disabled:opacity-50"
      >
        Duplicar
      </button>
      {pregunta.estado !== "archivada" ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => iniciarTransicion(() => cambiarEstadoPregunta(pregunta.id, "archivada"))}
          className="font-medium text-advertencia hover:underline disabled:opacity-50"
        >
          Archivar
        </button>
      ) : (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => iniciarTransicion(() => cambiarEstadoPregunta(pregunta.id, "borrador"))}
          className="font-medium text-violeta-600 hover:underline disabled:opacity-50"
        >
          Restaurar
        </button>
      )}
      <button
        type="button"
        disabled={pendiente}
        onClick={() => {
          if (confirm(`¿Eliminar definitivamente la pregunta ${pregunta.codigo}? Esta acción no se puede deshacer.`)) {
            iniciarTransicion(() => eliminarPregunta(pregunta.id));
          }
        }}
        className="font-medium text-error hover:underline disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}

export function TablaPreguntas({ preguntas, basePath }: { preguntas: Pregunta[]; basePath: string }) {
  const [pendiente, iniciarTransicion] = useTransition();

  if (preguntas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-borde p-8 text-center text-texto-secundario">
        No hay preguntas que coincidan con los filtros aplicados.
      </p>
    );
  }

  return (
    <>
      {/* Tabla: desde sm en adelante */}
      <div className="hidden overflow-x-auto rounded-xl border border-borde bg-blanco sm:block">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-borde bg-violeta-50 text-xs uppercase tracking-wide text-texto-secundario">
            <tr>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3">Enunciado</th>
              <th scope="col" className="px-4 py-3">Eje / Contenido</th>
              <th scope="col" className="px-4 py-3">Capacidad</th>
              <th scope="col" className="px-4 py-3">Dificultad</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {preguntas.map((pregunta) => (
              <tr key={pregunta.id} className="border-b border-borde last:border-0 hover:bg-violeta-50/60">
                <td className="px-4 py-3 font-mono text-xs text-texto-secundario">{pregunta.codigo}</td>
                <td className="max-w-xs px-4 py-3">
                  <p className="line-clamp-2 text-texto">{pregunta.enunciado}</p>
                </td>
                <td className="px-4 py-3 text-texto-secundario">
                  <p>{ETIQUETA_EJE[pregunta.eje]}</p>
                  <p className="text-xs text-texto-secundario/70">{pregunta.contenido}</p>
                </td>
                <td className="px-4 py-3 text-texto-secundario">{ETIQUETA_CAPACIDAD[pregunta.capacidad]}</td>
                <td className="px-4 py-3 text-texto-secundario">{ETIQUETA_DIFICULTAD[pregunta.dificultad]}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTILO_ESTADO[pregunta.estado]}`}>
                    {ETIQUETA_ESTADO[pregunta.estado]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Acciones pregunta={pregunta} basePath={basePath} pendiente={pendiente} iniciarTransicion={iniciarTransicion} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tarjetas: solo mobile */}
      <div className="flex flex-col gap-3 sm:hidden">
        {preguntas.map((pregunta) => (
          <div key={pregunta.id} className="tarjeta">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs text-texto-secundario">{pregunta.codigo}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ESTILO_ESTADO[pregunta.estado]}`}>
                {ETIQUETA_ESTADO[pregunta.estado]}
              </span>
            </div>
            <p className="mt-2 text-sm text-texto">{pregunta.enunciado}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-texto-secundario">
              <div>
                <dt className="text-texto-secundario/70">Eje</dt>
                <dd>{ETIQUETA_EJE[pregunta.eje]}</dd>
              </div>
              <div>
                <dt className="text-texto-secundario/70">Capacidad</dt>
                <dd>{ETIQUETA_CAPACIDAD[pregunta.capacidad]}</dd>
              </div>
              <div>
                <dt className="text-texto-secundario/70">Contenido</dt>
                <dd>{pregunta.contenido}</dd>
              </div>
              <div>
                <dt className="text-texto-secundario/70">Dificultad</dt>
                <dd>{ETIQUETA_DIFICULTAD[pregunta.dificultad]}</dd>
              </div>
            </dl>
            <div className="mt-3 border-t border-borde pt-3">
              <Acciones pregunta={pregunta} basePath={basePath} pendiente={pendiente} iniciarTransicion={iniciarTransicion} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
