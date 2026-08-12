import Link from "next/link";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function PanelDocente() {
  const perfil = await exigirPerfil(["docente", "admin"]);
  const supabase = await crearClienteServidor();

  const { count: cantidadCursos } = await supabase.from("cursos").select("id", { count: "exact", head: true });
  const { count: evaluacionesActivas } = await supabase
    .from("evaluaciones")
    .select("id", { count: "exact", head: true })
    .eq("estado", "publicada");
  const { count: preguntasActivas } = await supabase
    .from("preguntas")
    .select("id", { count: "exact", head: true })
    .eq("autor_id", perfil.id);
  const { data: intentosRecientes } = await supabase
    .from("intentos")
    .select("id, estado, porcentaje_obtenido, evaluaciones(nombre), perfiles!intentos_estudiante_id_fkey(nombre, apellido)")
    .in("estado", ["entregado", "expirado"])
    .order("fecha_entrega", { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-violeta-800">Hola, {perfil.nombre}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <TarjetaEnlace href="/docente/cursos" etiqueta="Cursos" valor={String(cantidadCursos ?? 0)} />
        <TarjetaEnlace href="/docente/evaluaciones" etiqueta="Evaluaciones publicadas" valor={String(evaluacionesActivas ?? 0)} />
        <TarjetaEnlace href="/docente/preguntas" etiqueta="Preguntas propias" valor={String(preguntasActivas ?? 0)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-violeta-800">Últimos intentos entregados</h2>
          <Link href="/docente/reportes" className="text-sm font-medium text-violeta-600 hover:underline">
            Ver reportes completos →
          </Link>
        </div>
        {!intentosRecientes || intentosRecientes.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay intentos entregados.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {intentosRecientes.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {(i.perfiles as unknown as { nombre: string; apellido: string } | null)?.nombre}{" "}
                  {(i.perfiles as unknown as { nombre: string; apellido: string } | null)?.apellido} —{" "}
                  <span className="text-slate-500">{(i.evaluaciones as unknown as { nombre: string } | null)?.nombre}</span>
                </span>
                <span className="font-semibold text-violeta-800">{i.porcentaje_obtenido}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TarjetaEnlace({ href, etiqueta, valor }: { href: string; etiqueta: string; valor: string }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-violeta-600 hover:shadow-sm">
      <p className="text-xs text-slate-400">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold text-violeta-800">{valor}</p>
    </Link>
  );
}
