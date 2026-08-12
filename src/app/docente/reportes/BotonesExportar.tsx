"use client";

function construirUrl(base: string, curso?: string, evaluacion?: string) {
  const params = new URLSearchParams();
  if (curso) params.set("curso", curso);
  if (evaluacion) params.set("evaluacion", evaluacion);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function BotonesExportar({ curso, evaluacion }: { curso?: string; evaluacion?: string }) {
  return (
    <div className="flex gap-2">
      <a
        href={construirUrl("/api/reportes/csv", curso, evaluacion)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Exportar CSV
      </a>
      <a
        href={construirUrl("/api/reportes/pdf", curso, evaluacion)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Exportar PDF
      </a>
    </div>
  );
}
