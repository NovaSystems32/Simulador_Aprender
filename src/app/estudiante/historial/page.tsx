import Link from "next/link";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

const ETIQUETA_ESTADO: Record<string, string> = {
  entregado: "Entregado",
  expirado: "Tiempo agotado",
  en_curso: "En curso",
};

export default async function PaginaHistorial() {
  const perfil = await exigirPerfil(["estudiante"]);
  const supabase = await crearClienteServidor();

  const { data: intentos } = await supabase
    .from("intentos")
    .select("*, evaluaciones(nombre)")
    .eq("estudiante_id", perfil.id)
    .neq("estado", "no_iniciado")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-azul-800">Mi historial de intentos</h1>

      {!intentos || intentos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borde p-8 text-center text-texto-secundario">
          Todavía no rendiste ninguna evaluación.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-borde bg-blanco sm:block">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-borde bg-azul-50 text-xs uppercase text-texto-secundario">
                <tr>
                  <th className="px-4 py-3">Evaluación</th>
                  <th className="px-4 py-3">Intento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {intentos.map((intento) => (
                  <tr key={intento.id} className="border-b border-borde last:border-0">
                    <td className="px-4 py-3 font-medium text-texto">
                      {(intento.evaluaciones as { nombre: string } | null)?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario">#{intento.numero_intento}</td>
                    <td className="px-4 py-3 text-texto-secundario">{ETIQUETA_ESTADO[intento.estado] ?? intento.estado}</td>
                    <td className="px-4 py-3 text-texto-secundario">
                      {intento.porcentaje_obtenido !== null ? `${intento.porcentaje_obtenido}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {intento.estado !== "en_curso" && (
                        <Link href={`/estudiante/resultados/${intento.id}`} className="font-medium text-azul-600 hover:underline">
                          Ver resultado
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:hidden">
            {intentos.map((intento) => (
              <div key={intento.id} className="tarjeta">
                <p className="font-medium text-texto">
                  {(intento.evaluaciones as { nombre: string } | null)?.nombre ?? "—"}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-texto-secundario">
                  <div>
                    <dt className="text-texto-secundario/70">Intento</dt>
                    <dd>#{intento.numero_intento}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-secundario/70">Estado</dt>
                    <dd>{ETIQUETA_ESTADO[intento.estado] ?? intento.estado}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-secundario/70">Resultado</dt>
                    <dd>{intento.porcentaje_obtenido !== null ? `${intento.porcentaje_obtenido}%` : "—"}</dd>
                  </div>
                </dl>
                {intento.estado !== "en_curso" && (
                  <Link
                    href={`/estudiante/resultados/${intento.id}`}
                    className="mt-3 inline-block text-sm font-medium text-azul-600 hover:underline"
                  >
                    Ver resultado →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
