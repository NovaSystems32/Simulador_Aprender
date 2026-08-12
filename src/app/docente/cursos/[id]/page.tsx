import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioIncorporarEstudiante } from "./FormularioIncorporarEstudiante";
import { ListaIntegrantes, type IntegranteFila } from "./ListaIntegrantes";

export default async function PaginaDetalleCurso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirPerfil(["docente", "admin"]);
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: curso } = await supabase.from("cursos").select("*").eq("id", id).single();
  if (!curso) notFound();

  const { data: integrantes } = await supabase
    .from("curso_integrantes")
    .select("perfil_id, rol_en_curso, perfiles(nombre, apellido, email)")
    .eq("curso_id", id)
    .order("rol_en_curso");

  const estudiantes = (integrantes ?? []).filter((i) => i.rol_en_curso === "estudiante");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-violeta-800">
          {curso.nombre} &quot;{curso.division}&quot;
        </h1>
        <p className="text-slate-500">Ciclo lectivo {curso.anio_lectivo}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-violeta-800">Estudiantes ({estudiantes.length})</h2>
        <ListaIntegrantes cursoId={id} estudiantes={estudiantes as unknown as IntegranteFila[]} />
      </div>

      <FormularioIncorporarEstudiante cursoId={id} />
    </div>
  );
}
