import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioConfiguracion } from "./FormularioConfiguracion";

export default async function PaginaConfiguracion() {
  const perfil = await exigirPerfil(["admin"]);
  const supabase = await crearClienteServidor();

  const { data: miPerfil } = await supabase.from("perfiles").select("institucion_id").eq("id", perfil.id).single();
  const institucionId = miPerfil?.institucion_id;

  const { data: institucion } = institucionId
    ? await supabase.from("instituciones").select("*").eq("id", institucionId).single()
    : { data: null };

  const { data: configuracion } = institucionId
    ? await supabase
        .from("configuraciones")
        .select("*")
        .eq("institucion_id", institucionId)
        .eq("clave", "puntaje_aprobacion_default")
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold text-azul-800">Configuración general</h1>
      <FormularioConfiguracion
        nombreInstitucion={institucion?.nombre ?? ""}
        puntajeAprobacionDefault={(configuracion?.valor as { valor?: number } | null)?.valor ?? 60}
      />
    </div>
  );
}
