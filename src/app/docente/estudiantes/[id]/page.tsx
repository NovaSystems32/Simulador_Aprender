import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

const ETIQUETA_ESTADO_INTENTO: Record<string, string> = {
  no_iniciado: "No iniciado",
  en_curso: "En curso",
  entregado: "Entregado",
  expirado: "Expirado",
};

/**
 * Ficha de solo lectura de un estudiante, para docentes y administradores.
 * Un docente solo puede ver estudiantes que comparten al menos un curso con
 * él/ella (chequeado acá, no solo ocultando el enlace en la UI); un admin
 * puede ver cualquiera.
 */
export default async function PaginaEstudianteDocente({ params }: { params: Promise<{ id: string }> }) {
  const perfilActual = await exigirPerfil(["docente", "admin"]);
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: estudiante } = await supabase.from("perfiles").select("*").eq("id", id).single<Perfil>();
  if (!estudiante || estudiante.rol !== "estudiante") notFound();

  const { data: cursosEstudiante } = await supabase
    .from("curso_integrantes")
    .select("curso_id, cursos(nombre, division, anio_lectivo)")
    .eq("perfil_id", id)
    .eq("rol_en_curso", "estudiante");

  if (perfilActual.rol !== "admin") {
    const { data: misCursos } = await supabase
      .from("cursos")
      .select("id")
      .or(`docente_titular_id.eq.${perfilActual.id}`);
    const { data: misCursosIntegrante } = await supabase
      .from("curso_integrantes")
      .select("curso_id")
      .eq("perfil_id", perfilActual.id)
      .eq("rol_en_curso", "docente");
    const misCursoIds = new Set([
      ...(misCursos ?? []).map((c) => c.id),
      ...(misCursosIntegrante ?? []).map((c) => c.curso_id),
    ]);
    const comparteCurso = (cursosEstudiante ?? []).some((c) => misCursoIds.has(c.curso_id));
    if (!comparteCurso) redirect("/no-autorizado");
  }

  const { data: intentos } = await supabase
    .from("intentos")
    .select("id,estado,porcentaje_obtenido,aprobado,created_at,evaluaciones(nombre)")
    .eq("estudiante_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-azul-800">
          {estudiante.nombre} {estudiante.apellido}
        </h1>
        <Link href="/docente/cursos" className="btn-neutro">
          Volver a mis cursos
        </Link>
      </div>

      <div className="tarjeta grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-texto-secundario">Correo</p>
          <p className="text-texto">{estudiante.email}</p>
        </div>
        <div>
          <p className="text-xs text-texto-secundario">Estado</p>
          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${estudiante.activo ? "bg-exito-50 text-exito" : "bg-azul-100 text-texto-secundario"}`}>
            {estudiante.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="tarjeta">
        <h2 className="text-lg font-bold text-azul-800">Cursos</h2>
        {cursosEstudiante && cursosEstudiante.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {cursosEstudiante.map((c, i) => {
              const curso = c.cursos as unknown as { nombre: string; division: string; anio_lectivo: number } | null;
              return (
                <li key={i} className="text-sm text-texto">
                  {curso?.nombre} / {curso?.division} <span className="text-texto-secundario">({curso?.anio_lectivo})</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-texto-secundario">No está inscripto/a en ningún curso.</p>
        )}
      </div>

      <div className="tarjeta">
        <h2 className="text-lg font-bold text-azul-800">Evaluaciones y resultados</h2>
        {intentos && intentos.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-borde text-xs uppercase text-texto-secundario">
                <tr>
                  <th className="py-2 pr-4">Evaluación</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Puntaje</th>
                  <th className="py-2 pr-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {intentos.map((i) => (
                  <tr key={i.id} className="border-b border-borde last:border-0">
                    <td className="py-2 pr-4">{(i.evaluaciones as unknown as { nombre: string } | null)?.nombre ?? "—"}</td>
                    <td className="py-2 pr-4">{ETIQUETA_ESTADO_INTENTO[i.estado] ?? i.estado}</td>
                    <td className="py-2 pr-4">
                      {i.porcentaje_obtenido != null ? `${Math.round(i.porcentaje_obtenido)}%` : "—"}
                    </td>
                    <td className="py-2 pr-4 text-texto-secundario">
                      {new Date(i.created_at).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-texto-secundario">Todavía no rindió ninguna evaluación.</p>
        )}
      </div>
    </div>
  );
}
