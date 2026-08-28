import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";
import { FormularioEditarUsuario } from "./FormularioEditarUsuario";

export default async function PaginaEditarUsuario({ params }: { params: Promise<{ id: string }> }) {
  await exigirPerfil(["admin"]);
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", id).single<Perfil>();
  if (!perfil) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-azul-800">
        Editar {perfil.nombre} {perfil.apellido}
      </h1>
      <div className="tarjeta max-w-lg">
        <FormularioEditarUsuario perfil={perfil} />
      </div>
    </div>
  );
}
