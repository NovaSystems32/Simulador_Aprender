import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioNuevoUsuario } from "./FormularioNuevoUsuario";
import { FilaUsuario, TarjetaUsuario } from "./FilaUsuario";

export default async function PaginaUsuarios() {
  await exigirPerfil(["admin"]);
  const supabase = await crearClienteServidor();

  const { data: perfiles } = await supabase.from("perfiles").select("*").order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-violeta-800">Usuarios</h1>

      <FormularioNuevoUsuario />

      <div className="hidden overflow-x-auto rounded-xl border border-borde bg-blanco sm:block">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-borde bg-violeta-50 text-xs uppercase text-texto-secundario">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(perfiles ?? []).map((p) => (
              <FilaUsuario key={p.id} perfil={p} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {(perfiles ?? []).map((p) => (
          <TarjetaUsuario key={p.id} perfil={p} />
        ))}
      </div>
    </div>
  );
}
