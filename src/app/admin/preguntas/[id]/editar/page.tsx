import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Pregunta } from "@/lib/types";
import { FormularioEdicionAdmin } from "./FormularioEdicionAdmin";

export default async function PaginaEditarPreguntaAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirPerfil(["admin"]);
  const { id } = await params;

  const supabase = await crearClienteServidor();
  const { data: pregunta } = await supabase.from("preguntas").select("*").eq("id", id).single();

  if (!pregunta) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-azul-800">Editar pregunta {pregunta.codigo}</h1>
      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
        <FormularioEdicionAdmin pregunta={pregunta as Pregunta} />
      </div>
    </div>
  );
}
