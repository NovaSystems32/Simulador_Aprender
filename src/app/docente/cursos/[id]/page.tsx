import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioIncorporarEstudiante } from "./FormularioIncorporarEstudiante";
import { GestionEstudiantesCurso, type EstudianteFila } from "./GestionEstudiantesCurso";

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

  const [{ data: integrantes }, { data: todosLosEstudiantes }] = await Promise.all([
    supabase
      .from("curso_integrantes")
      .select("perfil_id, rol_en_curso, perfiles(id, nombre, apellido, email)")
      .eq("curso_id", id)
      .order("rol_en_curso"),
    supabase.from("perfiles").select("id, nombre, apellido, email").eq("rol", "estudiante").order("nombre"),
  ]);

  const estudiantesCurso: EstudianteFila[] = (integrantes ?? [])
    .filter((i) => i.rol_en_curso === "estudiante" && i.perfiles)
    .map((i) => i.perfiles as unknown as EstudianteFila);

  const idsEnCurso = new Set(estudiantesCurso.map((e) => e.id));
  const estudiantesDisponibles: EstudianteFila[] = ((todosLosEstudiantes ?? []) as EstudianteFila[]).filter(
    (e) => !idsEnCurso.has(e.id)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-azul-800">
          {curso.nombre} &quot;{curso.division}&quot;
        </h1>
        <p className="text-texto-secundario">Ciclo lectivo {curso.anio_lectivo}</p>
      </div>

      <div className="tarjeta">
        <h2 className="mb-3 font-bold text-azul-800">Estudiantes del curso</h2>
        <GestionEstudiantesCurso
          cursoId={id}
          estudiantesCurso={estudiantesCurso}
          estudiantesDisponibles={estudiantesDisponibles}
        />
      </div>

      <FormularioIncorporarEstudiante cursoId={id} />
    </div>
  );
}
