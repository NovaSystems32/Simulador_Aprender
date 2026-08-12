import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  SeccionEliminarEvaluacion,
  SeccionLimpiarHistorialEstudiante,
  SeccionLimpiarHistorialEvaluacion,
  SeccionLimpiezaGeneral,
} from "./GestionDatosClient";

export default async function PaginaGestionDatos() {
  await exigirPerfil(["admin"]);
  const supabase = await crearClienteServidor();

  const { data: estudiantes } = await supabase
    .from("perfiles")
    .select("id,nombre,apellido,email")
    .eq("rol", "estudiante")
    .order("nombre");

  const { data: evaluaciones } = await supabase.from("evaluaciones").select("id,nombre").order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-violeta-800">Gestión de datos</h1>
        <p className="text-sm text-texto-secundario">
          Herramientas para limpiar historiales de evaluación y resultados. Todas las acciones quedan registradas en
          el registro de auditoría y requieren confirmación reforzada.
        </p>
      </div>

      <SeccionLimpiarHistorialEstudiante estudiantes={estudiantes ?? []} />
      <SeccionLimpiarHistorialEvaluacion evaluaciones={evaluaciones ?? []} />
      <SeccionEliminarEvaluacion evaluaciones={evaluaciones ?? []} />
      <SeccionLimpiezaGeneral />
    </div>
  );
}
