import Link from "next/link";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function PanelAdmin() {
  const perfil = await exigirPerfil(["admin"]);
  const supabase = await crearClienteServidor();

  const [
    { count: usuarios },
    { count: cursos },
    { count: evaluaciones },
    { count: preguntas },
    { count: intentosEntregados },
  ] = await Promise.all([
    supabase.from("perfiles").select("id", { count: "exact", head: true }),
    supabase.from("cursos").select("id", { count: "exact", head: true }),
    supabase.from("evaluaciones").select("id", { count: "exact", head: true }),
    supabase.from("preguntas").select("id", { count: "exact", head: true }),
    supabase.from("intentos").select("id", { count: "exact", head: true }).in("estado", ["entregado", "expirado"]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-azul-800">Hola, {perfil.nombre}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <TarjetaEnlace href="/admin/usuarios" etiqueta="Usuarios" valor={String(usuarios ?? 0)} />
        <TarjetaEnlace href="/admin/cursos" etiqueta="Cursos" valor={String(cursos ?? 0)} />
        <TarjetaEnlace href="/docente/evaluaciones" etiqueta="Evaluaciones" valor={String(evaluaciones ?? 0)} />
        <TarjetaEnlace href="/admin/preguntas" etiqueta="Preguntas" valor={String(preguntas ?? 0)} />
        <TarjetaEnlace href="/docente/reportes" etiqueta="Intentos entregados" valor={String(intentosEntregados ?? 0)} />
      </div>
      <p className="text-sm text-slate-500">
        Desde el menú superior podés administrar usuarios, cursos, el banco completo de preguntas y la
        configuración general de la institución. Los reportes detallados están disponibles en{" "}
        <Link href="/docente/reportes" className="text-azul-600 hover:underline">
          Reportes
        </Link>
        .
      </p>
    </div>
  );
}

function TarjetaEnlace({ href, etiqueta, valor }: { href: string; etiqueta: string; valor: string }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-azul-600 hover:shadow-sm">
      <p className="text-xs text-slate-400">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold text-azul-800">{valor}</p>
    </Link>
  );
}
