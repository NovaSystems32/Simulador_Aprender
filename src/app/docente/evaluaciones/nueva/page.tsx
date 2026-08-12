import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Curso, Pregunta } from "@/lib/types";
import { FormularioNuevaEvaluacion } from "./FormularioNuevaEvaluacion";

export default async function PaginaNuevaEvaluacion() {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();

  const [{ data: cursos }, { data: preguntas }] = await Promise.all([
    supabase.from("cursos").select("*").order("nombre"),
    supabase.from("preguntas").select("*").eq("estado", "activa").order("codigo"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-violeta-800">Nueva evaluación</h1>
      <FormularioNuevaEvaluacion
        cursos={(cursos ?? []) as Curso[]}
        preguntas={(preguntas ?? []) as Pregunta[]}
        docenteNombre={`${perfil.nombre} ${perfil.apellido}`}
      />
    </div>
  );
}
