"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Curso, Evaluacion } from "@/lib/types";

export function FiltrosReportes({ cursos, evaluaciones }: { cursos: Curso[]; evaluaciones: Evaluacion[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function actualizar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    if (clave === "curso") params.delete("evaluacion");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label htmlFor="curso" className="text-xs font-medium text-slate-600">
          Curso
        </label>
        <select
          id="curso"
          value={searchParams.get("curso") ?? ""}
          onChange={(e) => actualizar("curso", e.target.value)}
          className="campo-select mt-1"
        >
          <option value="">Todos los cursos</option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} &quot;{c.division}&quot;
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="evaluacion" className="text-xs font-medium text-slate-600">
          Evaluación
        </label>
        <select
          id="evaluacion"
          value={searchParams.get("evaluacion") ?? ""}
          onChange={(e) => actualizar("evaluacion", e.target.value)}
          className="campo-select mt-1"
        >
          <option value="">Todas las evaluaciones</option>
          {evaluaciones.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
