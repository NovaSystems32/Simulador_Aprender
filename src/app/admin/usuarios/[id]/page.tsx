import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  docente: "Docente",
  estudiante: "Estudiante",
};

const ETIQUETA_ESTADO_INTENTO: Record<string, string> = {
  no_iniciado: "No iniciado",
  en_curso: "En curso",
  entregado: "Entregado",
  expirado: "Expirado",
};

export default async function PaginaVerUsuario({ params }: { params: Promise<{ id: string }> }) {
  await exigirPerfil(["admin"]);
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", id).single<Perfil>();
  if (!perfil) notFound();

  const { data: cursos } = await supabase
    .from("curso_integrantes")
    .select("rol_en_curso,cursos(nombre,division,anio_lectivo)")
    .eq("perfil_id", id);

  const { data: intentos } = await supabase
    .from("intentos")
    .select("id,estado,puntaje_obtenido,porcentaje_obtenido,aprobado,created_at,evaluaciones(nombre)")
    .eq("estudiante_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-violeta-800">
          {perfil.nombre} {perfil.apellido}
        </h1>
        <div className="flex gap-3">
          <Link href={`/admin/usuarios/${perfil.id}/editar`} className="btn-neutro">
            Editar
          </Link>
          <Link href="/admin/usuarios" className="btn-neutro">
            Volver
          </Link>
        </div>
      </div>

      <div className="tarjeta grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-texto-secundario">Correo</p>
          <p className="text-texto">{perfil.email}</p>
        </div>
        <div>
          <p className="text-xs text-texto-secundario">Rol</p>
          <p className="text-texto">{ETIQUETA_ROL[perfil.rol] ?? perfil.rol}</p>
        </div>
        <div>
          <p className="text-xs text-texto-secundario">Estado</p>
          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${perfil.activo ? "bg-exito-50 text-exito" : "bg-violeta-100 text-texto-secundario"}`}>
            {perfil.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div>
          <p className="text-xs text-texto-secundario">Alta</p>
          <p className="text-texto">{new Date(perfil.created_at).toLocaleDateString("es-AR")}</p>
        </div>
      </div>

      <div className="tarjeta">
        <h2 className="text-lg font-bold text-violeta-800">Cursos</h2>
        {cursos && cursos.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {cursos.map((c, i) => (
              <li key={i} className="text-sm text-texto">
                {(c.cursos as unknown as { nombre: string; division: string; anio_lectivo: number } | null)?.nombre}{" "}
                / {(c.cursos as unknown as { nombre: string; division: string; anio_lectivo: number } | null)?.division}{" "}
                <span className="text-texto-secundario">
                  ({(c.cursos as unknown as { anio_lectivo: number } | null)?.anio_lectivo}) — {c.rol_en_curso}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-texto-secundario">No está inscripto/a en ningún curso.</p>
        )}
      </div>

      {perfil.rol === "estudiante" && (
        <div className="tarjeta">
          <h2 className="text-lg font-bold text-violeta-800">Historial de intentos</h2>
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
      )}
    </div>
  );
}
