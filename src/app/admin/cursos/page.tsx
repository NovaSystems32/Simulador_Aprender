import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioNuevoCursoAdmin } from "./FormularioNuevoCursoAdmin";

export default async function PaginaCursosAdmin() {
  await exigirPerfil(["admin"]);
  const supabase = await crearClienteServidor();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("*, perfiles!cursos_docente_titular_id_fkey(nombre, apellido)")
    .order("nombre");
  const { data: docentes } = await supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "docente");

  const filas = (cursos ?? []).map((c) => ({
    id: c.id as string,
    nombre: c.nombre as string,
    division: c.division as string,
    anio_lectivo: c.anio_lectivo as number,
    docente: c.perfiles as unknown as { nombre: string; apellido: string } | null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-azul-800">Cursos</h1>

      <FormularioNuevoCursoAdmin docentes={docentes ?? []} />

      <div className="hidden overflow-x-auto rounded-xl border border-borde bg-blanco sm:block">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-borde bg-azul-50 text-xs uppercase text-texto-secundario">
            <tr>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Ciclo lectivo</th>
              <th className="px-4 py-3">Docente titular</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((c) => (
              <tr key={c.id} className="border-b border-borde last:border-0">
                <td className="px-4 py-3 font-medium text-texto">
                  {c.nombre} &quot;{c.division}&quot;
                </td>
                <td className="px-4 py-3 text-texto-secundario">{c.anio_lectivo}</td>
                <td className="px-4 py-3 text-texto-secundario">
                  {c.docente ? `${c.docente.nombre} ${c.docente.apellido}` : "Sin asignar"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {filas.map((c) => (
          <div key={c.id} className="tarjeta">
            <p className="font-medium text-texto">
              {c.nombre} &quot;{c.division}&quot;
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-texto-secundario">
              <div>
                <dt className="text-texto-secundario/70">Ciclo lectivo</dt>
                <dd>{c.anio_lectivo}</dd>
              </div>
              <div>
                <dt className="text-texto-secundario/70">Docente titular</dt>
                <dd>{c.docente ? `${c.docente.nombre} ${c.docente.apellido}` : "Sin asignar"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
