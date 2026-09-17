"use client";

import { useRef, useState } from "react";
import { TextoConFormulas } from "./VistaPreviaMatematica";
import { BotonInsertarEcuacion, EditorEcuaciones, type ResultadoEcuacion } from "./EditorEcuaciones";

/** Si la selección actual es exactamente una ecuación completa ($...$ o $$...$$), la devuelve para editarla; si no, null. */
function detectarEcuacionSeleccionada(seleccion: string): { tex: string; modo: "linea" | "bloque" } | null {
  if (/^\$\$[^$]+\$\$$/.test(seleccion)) return { tex: seleccion.slice(2, -2), modo: "bloque" };
  if (/^\$[^$]+\$$/.test(seleccion)) return { tex: seleccion.slice(1, -1), modo: "linea" };
  return null;
}

export function CampoTextoConEcuaciones({
  id,
  name,
  label,
  value,
  onChange,
  required,
  rows = 3,
  ayuda,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  rows?: number;
  ayuda?: string;
  placeholder?: string;
}) {
  const refCampo = useRef<HTMLTextAreaElement>(null);
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [rangoAEditar, setRangoAEditar] = useState<{ inicio: number; fin: number } | null>(null);
  const [texInicial, setTexInicial] = useState("");
  const [modoInicial, setModoInicial] = useState<"linea" | "bloque">("linea");

  function abrirEditor() {
    const campo = refCampo.current;
    const inicio = campo?.selectionStart ?? value.length;
    const fin = campo?.selectionEnd ?? value.length;
    const seleccion = value.slice(inicio, fin);
    const ecuacionExistente = detectarEcuacionSeleccionada(seleccion);

    if (ecuacionExistente) {
      setRangoAEditar({ inicio, fin });
      setTexInicial(ecuacionExistente.tex);
      setModoInicial(ecuacionExistente.modo);
    } else {
      setRangoAEditar({ inicio, fin: inicio });
      setTexInicial("");
      setModoInicial("linea");
    }
    setEditorAbierto(true);
  }

  function alInsertar({ textoConDelimitadores }: ResultadoEcuacion) {
    const rango = rangoAEditar ?? { inicio: value.length, fin: value.length };
    const nuevoValor = value.slice(0, rango.inicio) + textoConDelimitadores + value.slice(rango.fin);
    onChange(nuevoValor);
    setEditorAbierto(false);
    const posicionCursor = rango.inicio + textoConDelimitadores.length;
    window.setTimeout(() => {
      refCampo.current?.focus();
      refCampo.current?.setSelectionRange(posicionCursor, posicionCursor);
    }, 0);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <BotonInsertarEcuacion onClick={abrirEditor} />
      </div>
      <textarea
        id={id}
        name={name}
        ref={refCampo}
        required={required}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="campo-texto"
      />
      {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
      {value && (
        <div className="rounded-lg bg-azul-50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-azul-700">Vista previa</p>
          <TextoConFormulas texto={value} />
        </div>
      )}

      {editorAbierto && (
        <EditorEcuaciones
          texInicial={texInicial}
          modoInicial={modoInicial}
          onInsertar={alInsertar}
          onCancelar={() => setEditorAbierto(false)}
        />
      )}
    </div>
  );
}
