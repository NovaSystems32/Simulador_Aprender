import Link from "next/link";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FiltrosPreguntas } from "@/components/preguntas/FiltrosPreguntas";
import { TablaPreguntas } from "@/components/preguntas/TablaPreguntas";
import { ImportarExportarPreguntas } from "@/components/preguntas/ImportarExportarPreguntas";
import type { Pregunta } from "@/lib/types";

export default async function PaginaBancoPreguntasAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await exigirPerfil(["admin"]);
  const filtros = await searchParams;

  const supabase = await crearClienteServidor();
  let consulta = supabase.from("preguntas").select("*").order("created_at", { ascending: false });

  if (filtros.eje) consulta = consulta.eq("eje", filtros.eje);
  if (filtros.capacidad) consulta = consulta.eq("capacidad", filtros.capacidad);
  if (filtros.dificultad) consulta = consulta.eq("dificultad", filtros.dificultad);
  if (filtros.estado) consulta = consulta.eq("estado", filtros.estado);
  if (filtros.q) consulta = consulta.or(`enunciado.ilike.%${filtros.q}%,contenido.ilike.%${filtros.q}%,codigo.ilike.%${filtros.q}%`);

  const { data, error } = await consulta;
  const preguntas = (data ?? []) as Pregunta[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-violeta-800">Banco de preguntas (todas las instituciones)</h1>
          <p className="text-sm text-slate-600">Como administrador, ves el banco completo de todos los docentes.</p>
        </div>
        <Link
          href="/admin/preguntas/nueva"
          className="rounded-lg bg-violeta-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violeta-800"
        >
          Nueva pregunta
        </Link>
      </div>

      <FiltrosPreguntas />
      <ImportarExportarPreguntas preguntas={preguntas} />

      {error ? (
        <p className="rounded-md bg-error-50 px-3 py-2 text-sm text-error">
          No se pudo cargar el banco de preguntas: {error.message}
        </p>
      ) : (
        <TablaPreguntas preguntas={preguntas} basePath="/admin/preguntas" />
      )}

      <p className="text-xs text-slate-400">{preguntas.length} pregunta(s) en total</p>
    </div>
  );
}
