import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPerfil } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CAPACIDADES, DIFICULTADES, EJES, type Pregunta } from "@/lib/types";

const ETIQUETA_EJE = Object.fromEntries(EJES.map((e) => [e.value, e.label]));
const ETIQUETA_CAPACIDAD = Object.fromEntries(CAPACIDADES.map((c) => [c.value, c.label]));
const ETIQUETA_DIFICULTAD = Object.fromEntries(DIFICULTADES.map((d) => [d.value, d.label]));
const ETIQUETA_ESTADO: Record<string, string> = { borrador: "Borrador", activa: "Activa", archivada: "Archivada" };

export default async function PaginaVerPregunta({ params }: { params: Promise<{ id: string }> }) {
  await exigirPerfil(["admin"]);
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: pregunta } = await supabase.from("preguntas").select("*").eq("id", id).single<Pregunta>();
  if (!pregunta) notFound();

  const opciones = [
    { letra: "A", texto: pregunta.opcion_a },
    { letra: "B", texto: pregunta.opcion_b },
    { letra: "C", texto: pregunta.opcion_c },
    { letra: "D", texto: pregunta.opcion_d },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-violeta-800">Pregunta {pregunta.codigo}</h1>
        <div className="flex gap-3">
          <Link href={`/admin/preguntas/${pregunta.id}/editar`} className="btn-neutro">
            Editar
          </Link>
          <Link href="/admin/preguntas" className="btn-neutro">
            Volver
          </Link>
        </div>
      </div>

      <div className="tarjeta flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pregunta.estado === "activa" ? "bg-exito-50 text-exito" : pregunta.estado === "archivada" ? "bg-advertencia-50 text-advertencia" : "bg-violeta-100 text-violeta-700"}`}>
            {ETIQUETA_ESTADO[pregunta.estado]}
          </span>
          <span className="insignia-violeta">{ETIQUETA_EJE[pregunta.eje]}</span>
          <span className="insignia-violeta">{pregunta.contenido}</span>
          <span className="insignia-amarillo">{ETIQUETA_CAPACIDAD[pregunta.capacidad]}</span>
          <span className="insignia-amarillo">{ETIQUETA_DIFICULTAD[pregunta.dificultad]}</span>
        </div>

        <p className="text-texto">{pregunta.enunciado}</p>

        {pregunta.recurso_url && (
          <Image
            src={pregunta.recurso_url}
            alt={pregunta.recurso_alt ?? ""}
            width={480}
            height={320}
            className="max-w-md rounded-lg border border-borde"
            unoptimized
          />
        )}

        <ul className="flex flex-col gap-2">
          {opciones.map((o) => (
            <li
              key={o.letra}
              className={`rounded-lg border px-3 py-2 text-sm ${o.letra === pregunta.respuesta_correcta ? "border-exito bg-exito-50 text-exito" : "border-borde text-texto"}`}
            >
              <strong>{o.letra}.</strong> {o.texto}
            </li>
          ))}
        </ul>

        <div>
          <p className="text-xs font-medium text-texto-secundario">Explicación</p>
          <p className="mt-1 text-sm text-texto">{pregunta.explicacion}</p>
        </div>

        <p className="text-xs text-texto-secundario">
          Creada el {new Date(pregunta.created_at).toLocaleDateString("es-AR")} — última edición el{" "}
          {new Date(pregunta.updated_at).toLocaleDateString("es-AR")}
        </p>
      </div>
    </div>
  );
}
