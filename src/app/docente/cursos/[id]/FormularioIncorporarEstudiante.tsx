"use client";

import { useActionState, useState } from "react";
import { incorporarEstudianteExistente, incorporarEstudianteNuevo, type EstadoFormulario } from "../actions";

const ESTADO_INICIAL: EstadoFormulario = { error: null };

export function FormularioIncorporarEstudiante({ cursoId }: { cursoId: string }) {
  const [modo, setModo] = useState<"nuevo" | "existente">("nuevo");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold text-violeta-800">Incorporar estudiante</h2>
      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setModo("nuevo")}
          className={`rounded-md px-3 py-1.5 ${modo === "nuevo" ? "bg-violeta-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Crear cuenta nueva
        </button>
        <button
          type="button"
          onClick={() => setModo("existente")}
          className={`rounded-md px-3 py-1.5 ${modo === "existente" ? "bg-violeta-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Agregar estudiante existente
        </button>
      </div>
      {modo === "nuevo" ? <FormularioNuevo cursoId={cursoId} /> : <FormularioExistente cursoId={cursoId} />}
    </div>
  );
}

function FormularioNuevo({ cursoId }: { cursoId: string }) {
  const accion = incorporarEstudianteNuevo.bind(null, cursoId);
  const [estado, formAction, enviando] = useActionState(accion, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="nombre" placeholder="Nombre" required className="campo-texto" />
        <input name="apellido" placeholder="Apellido" required className="campo-texto" />
        <input name="email" type="email" placeholder="Correo electrónico" required className="campo-texto" />
      </div>
      {estado.error && <p className="text-sm text-error">{estado.error}</p>}
      {estado.mensaje && <p className="rounded-md bg-exito-50 px-3 py-2 text-sm text-exito">{estado.mensaje}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-violeta-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violeta-800 disabled:opacity-60"
      >
        {enviando ? "Creando..." : "Crear e incorporar"}
      </button>
    </form>
  );
}

function FormularioExistente({ cursoId }: { cursoId: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    const resultado = await incorporarEstudianteExistente(cursoId, email);
    setEstado(resultado);
    setEnviando(false);
    if (!resultado.error) setEmail("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Correo del estudiante"
          className="campo-texto max-w-xs"
        />
        <button
          type="button"
          disabled={!email || enviando}
          onClick={enviar}
          className="rounded-lg bg-violeta-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violeta-800 disabled:opacity-60"
        >
          {enviando ? "Agregando..." : "Agregar al curso"}
        </button>
      </div>
      {estado.error && <p className="text-sm text-error">{estado.error}</p>}
      {estado.mensaje && <p className="text-sm text-exito">{estado.mensaje}</p>}
    </div>
  );
}
