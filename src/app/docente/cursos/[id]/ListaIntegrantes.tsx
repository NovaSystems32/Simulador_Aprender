"use client";

import { useTransition } from "react";
import { quitarIntegrante } from "../actions";

export interface IntegranteFila {
  perfil_id: string;
  rol_en_curso: string;
  perfiles: { nombre: string; apellido: string; email: string } | null;
}

export function ListaIntegrantes({ cursoId, estudiantes }: { cursoId: string; estudiantes: IntegranteFila[] }) {
  const [pendiente, iniciarTransicion] = useTransition();

  if (estudiantes.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay estudiantes en este curso.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {estudiantes.map((e) => (
        <li key={e.perfil_id} className="flex items-center justify-between py-2 text-sm">
          <span>
            {e.perfiles?.nombre} {e.perfiles?.apellido}{" "}
            <span className="text-slate-400">({e.perfiles?.email})</span>
          </span>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (confirm(`¿Quitar a ${e.perfiles?.nombre} del curso?`)) {
                iniciarTransicion(() => quitarIntegrante(cursoId, e.perfil_id));
              }
            }}
            className="text-xs font-medium text-error hover:underline disabled:opacity-50"
          >
            Quitar
          </button>
        </li>
      ))}
    </ul>
  );
}
