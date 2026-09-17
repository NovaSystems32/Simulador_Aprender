"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { Sigma, X } from "lucide-react";

const AJUSTES_SEGUROS = { trust: false, strict: "warn" as const, throwOnError: false };

interface Simbolo {
  etiqueta: string;
  /** Texto TeX a insertar en la posición del cursor. */
  insertar: string;
  /** Desplazamiento del cursor respecto al INICIO de lo insertado (por defecto, al final). Útil para plantillas como \frac{}{} donde conviene dejar el cursor dentro de la primera llave. */
  cursorEn?: number;
  /** Texto accesible más descriptivo que la sola etiqueta visual (para lectores de pantalla). */
  descripcion?: string;
}

const OPERADORES: Simbolo[] = [
  { etiqueta: "+", insertar: "+" },
  { etiqueta: "−", insertar: "-" },
  { etiqueta: "×", insertar: "\\times " },
  { etiqueta: "÷", insertar: "\\div " },
  { etiqueta: "=", insertar: "=" },
  { etiqueta: "≠", insertar: "\\neq " },
  { etiqueta: ">", insertar: ">" },
  { etiqueta: "<", insertar: "<" },
  { etiqueta: "≥", insertar: "\\geq " },
  { etiqueta: "≤", insertar: "\\leq " },
  { etiqueta: "≈", insertar: "\\approx " },
  { etiqueta: "∞", insertar: "\\infty " },
  { etiqueta: "%", insertar: "\\%" },
  { etiqueta: "( )", insertar: "()", cursorEn: 1, descripcion: "Paréntesis" },
  { etiqueta: "[ ]", insertar: "[]", cursorEn: 1, descripcion: "Corchetes" },
  { etiqueta: "{ }", insertar: "\\{\\}", cursorEn: 2, descripcion: "Llaves" },
];

const FLECHAS: Simbolo[] = [
  { etiqueta: "←", insertar: "\\leftarrow ", descripcion: "Flecha izquierda" },
  { etiqueta: "→", insertar: "\\rightarrow ", descripcion: "Flecha derecha" },
  { etiqueta: "↑", insertar: "\\uparrow ", descripcion: "Flecha arriba" },
  { etiqueta: "↓", insertar: "\\downarrow ", descripcion: "Flecha abajo" },
  { etiqueta: "⇐", insertar: "\\Leftarrow ", descripcion: "Flecha doble izquierda" },
  { etiqueta: "⇒", insertar: "\\Rightarrow ", descripcion: "Flecha doble derecha" },
  { etiqueta: "↔", insertar: "\\leftrightarrow ", descripcion: "Flecha doble sentido" },
  { etiqueta: "⇔", insertar: "\\Leftrightarrow ", descripcion: "Flecha doble equivalencia" },
  { etiqueta: "↖", insertar: "\\nwarrow ", descripcion: "Flecha diagonal arriba-izquierda" },
  { etiqueta: "↗", insertar: "\\nearrow ", descripcion: "Flecha diagonal arriba-derecha" },
  { etiqueta: "↙", insertar: "\\swarrow ", descripcion: "Flecha diagonal abajo-izquierda" },
  { etiqueta: "↘", insertar: "\\searrow ", descripcion: "Flecha diagonal abajo-derecha" },
  { etiqueta: "v⃗", insertar: "\\vec{v}", cursorEn: 4, descripcion: "Vector v" },
  { etiqueta: "AB⃗", insertar: "\\vec{AB}", cursorEn: 4, descripcion: "Vector AB" },
];

const GRIEGOS: Simbolo[] = [
  { etiqueta: "α", insertar: "\\alpha " },
  { etiqueta: "β", insertar: "\\beta " },
  { etiqueta: "γ", insertar: "\\gamma " },
  { etiqueta: "δ", insertar: "\\delta " },
  { etiqueta: "ε", insertar: "\\varepsilon " },
  { etiqueta: "θ", insertar: "\\theta " },
  { etiqueta: "λ", insertar: "\\lambda " },
  { etiqueta: "μ", insertar: "\\mu " },
  { etiqueta: "π", insertar: "\\pi " },
  { etiqueta: "ρ", insertar: "\\rho " },
  { etiqueta: "σ", insertar: "\\sigma " },
  { etiqueta: "τ", insertar: "\\tau " },
  { etiqueta: "φ", insertar: "\\varphi " },
  { etiqueta: "χ", insertar: "\\chi " },
  { etiqueta: "ψ", insertar: "\\psi " },
  { etiqueta: "ω", insertar: "\\omega " },
  { etiqueta: "Γ", insertar: "\\Gamma " },
  { etiqueta: "Δ", insertar: "\\Delta " },
  { etiqueta: "Θ", insertar: "\\Theta " },
  { etiqueta: "Λ", insertar: "\\Lambda " },
  { etiqueta: "Π", insertar: "\\Pi " },
  { etiqueta: "Σ", insertar: "\\Sigma " },
  { etiqueta: "Φ", insertar: "\\Phi " },
  { etiqueta: "Ψ", insertar: "\\Psi " },
  { etiqueta: "Ω", insertar: "\\Omega " },
];

const AVANZADO: Simbolo[] = [
  { etiqueta: "a/b", insertar: "\\frac{}{}", cursorEn: 6, descripcion: "Fracción" },
  { etiqueta: "xⁿ", insertar: "^{}", cursorEn: 2, descripcion: "Potencia" },
  { etiqueta: "xₙ", insertar: "_{}", cursorEn: 2, descripcion: "Subíndice" },
  { etiqueta: "√x", insertar: "\\sqrt{}", cursorEn: 6, descripcion: "Raíz cuadrada" },
  { etiqueta: "ⁿ√x", insertar: "\\sqrt[]{}", cursorEn: 7, descripcion: "Raíz de índice n" },
  { etiqueta: "Σ", insertar: "\\sum_{i=1}^{n} ", cursorEn: 14, descripcion: "Sumatoria" },
  { etiqueta: "Π", insertar: "\\prod_{i=1}^{n} ", cursorEn: 15, descripcion: "Producto" },
  { etiqueta: "∫", insertar: "\\int_{a}^{b} \\, dx", cursorEn: 18, descripcion: "Integral definida" },
  { etiqueta: "lim", insertar: "\\lim_{x \\to a} ", cursorEn: 14, descripcion: "Límite" },
  { etiqueta: "|x|", insertar: "|x|", cursorEn: 1, descripcion: "Valor absoluto" },
  { etiqueta: "v⃗", insertar: "\\vec{}", cursorEn: 5, descripcion: "Vector" },
  {
    etiqueta: "matriz",
    insertar: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
    descripcion: "Matriz 2×2",
  },
  {
    etiqueta: "sistema",
    insertar: "\\begin{cases} a_1x+b_1y=c_1 \\\\ a_2x+b_2y=c_2 \\end{cases}",
    descripcion: "Sistema de ecuaciones",
  },
  {
    etiqueta: "por partes",
    insertar: "f(x) = \\begin{cases} x^2 & x \\geq 0 \\\\ -x & x < 0 \\end{cases}",
    descripcion: "Función por partes",
  },
];

const PESTANIAS = [
  { id: "operadores", etiqueta: "Operadores", simbolos: OPERADORES },
  { id: "flechas", etiqueta: "Flechas", simbolos: FLECHAS },
  { id: "griegos", etiqueta: "Símbolos griegos", simbolos: GRIEGOS },
  { id: "avanzado", etiqueta: "Avanzado", simbolos: AVANZADO },
] as const;

type IdPestania = (typeof PESTANIAS)[number]["id"];

function insertarEnTexto(valorActual: string, inicio: number, fin: number, textoAInsertar: string): string {
  return valorActual.slice(0, inicio) + textoAInsertar + valorActual.slice(fin);
}

export interface ResultadoEcuacion {
  /** El texto completo con delimitadores ($...$ o $$...$$), listo para insertar en el campo de la pregunta. */
  textoConDelimitadores: string;
}

/**
 * El padre monta este componente solo cuando el diálogo debe estar abierto
 * ({condición} && <EditorEcuaciones .../>), así que cada apertura es un
 * montaje nuevo: los useState ya arrancan con texInicial/modoInicial sin
 * necesitar un efecto que los reasigne.
 */
export function EditorEcuaciones({
  texInicial = "",
  modoInicial = "linea",
  onInsertar,
  onCancelar,
}: {
  texInicial?: string;
  modoInicial?: "linea" | "bloque";
  onInsertar: (resultado: ResultadoEcuacion) => void;
  onCancelar: () => void;
}) {
  const idTitulo = useId();
  const [tex, setTex] = useState(texInicial);
  const [modo, setModo] = useState<"linea" | "bloque">(modoInicial);
  const [pestania, setPestania] = useState<IdPestania>("operadores");
  const refTextarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Foco inicial en el campo de TeX para poder escribir de entrada.
    refTextarea.current?.focus();
  }, []);

  const error = useMemo(() => {
    if (!tex.trim()) return null;
    try {
      katex.renderToString(tex, { ...AJUSTES_SEGUROS, throwOnError: true });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Expresión inválida.";
    }
  }, [tex]);

  function insertarSimbolo(simbolo: Simbolo) {
    const campo = refTextarea.current;
    const inicio = campo?.selectionStart ?? tex.length;
    const fin = campo?.selectionEnd ?? tex.length;
    setTex(insertarEnTexto(tex, inicio, fin, simbolo.insertar));
    const posicionCursor = inicio + (simbolo.cursorEn ?? simbolo.insertar.length);
    window.setTimeout(() => {
      campo?.focus();
      campo?.setSelectionRange(posicionCursor, posicionCursor);
    }, 0);
  }

  function confirmar() {
    if (!tex.trim() || error) return;
    const textoConDelimitadores = modo === "bloque" ? `$$${tex}$$` : `$${tex}$`;
    onInsertar({ textoConDelimitadores });
  }

  function alCerrarConTecla(e: React.KeyboardEvent) {
    if (e.key === "Escape") onCancelar();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      onKeyDown={alCerrarConTecla}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-borde bg-blanco shadow-lg">
        <div className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 id={idTitulo} className="text-lg font-bold text-azul-800">
            Editor de ecuaciones
          </h2>
          <button
            type="button"
            onClick={onCancelar}
            aria-label="Cerrar editor de ecuaciones"
            className="rounded-md p-1.5 text-texto-secundario hover:bg-azul-50"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div role="tablist" aria-label="Categorías de símbolos" className="flex flex-wrap gap-1 border-b border-borde pb-2">
            {PESTANIAS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={pestania === p.id}
                onClick={() => setPestania(p.id)}
                className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
                  pestania === p.id ? "bg-azul-100 text-azul-800" : "text-texto-secundario hover:bg-azul-50"
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          {PESTANIAS.map(
            (p) =>
              pestania === p.id && (
                <div
                  key={p.id}
                  role="tabpanel"
                  className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6"
                >
                  {p.simbolos.map((s, indice) => (
                    <button
                      key={indice}
                      type="button"
                      onClick={() => insertarSimbolo(s)}
                      title={s.descripcion ?? s.etiqueta}
                      aria-label={s.descripcion ?? s.etiqueta}
                      className="flex min-h-11 items-center justify-center rounded-lg border border-borde bg-blanco text-base font-medium text-texto hover:border-azul-600 hover:bg-azul-50 hover:text-azul-800"
                    >
                      {s.etiqueta}
                    </button>
                  ))}
                </div>
              )
          )}

          <div className="mt-5 flex flex-col gap-1">
            <label htmlFor={`${idTitulo}-tex`} className="text-sm font-medium text-texto">
              Editar ecuación usando TeX
            </label>
            <textarea
              id={`${idTitulo}-tex`}
              ref={refTextarea}
              value={tex}
              onChange={(e) => setTex(e.target.value)}
              rows={2}
              spellCheck={false}
              className="campo-texto font-mono text-sm"
              placeholder="Ej: f(x)=3x^2+5"
            />
            {error && (
              <p role="alert" className="alerta-error mt-1">
                Expresión inválida: {error}
              </p>
            )}
          </div>

          <fieldset className="mt-4 flex items-center gap-4">
            <legend className="mb-1 text-sm font-medium text-texto">Presentación</legend>
            <label className="flex items-center gap-1.5 text-sm text-texto">
              <input
                type="radio"
                name="modo-ecuacion"
                checked={modo === "linea"}
                onChange={() => setModo("linea")}
              />
              En línea
            </label>
            <label className="flex items-center gap-1.5 text-sm text-texto">
              <input
                type="radio"
                name="modo-ecuacion"
                checked={modo === "bloque"}
                onChange={() => setModo("bloque")}
              />
              Centrada (bloque aparte)
            </label>
          </fieldset>

          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-texto">Vista previa</p>
            <div className="min-h-16 rounded-lg border border-borde bg-azul-50 p-3">
              {tex.trim() ? (
                error ? (
                  <p className="text-sm text-texto-secundario">No se puede previsualizar hasta corregir la expresión.</p>
                ) : modo === "bloque" ? (
                  <BlockMath math={tex} />
                ) : (
                  <InlineMath math={tex} />
                )
              ) : (
                <p className="text-sm text-texto-secundario">Escribí una expresión o elegí un símbolo para ver la vista previa.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-borde px-5 py-4">
          <button type="button" onClick={onCancelar} className="btn-neutro">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!tex.trim() || !!error}
            onClick={confirmar}
            className="btn-primario disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insertar ecuación
          </button>
        </div>
      </div>
    </div>
  );
}

/** Botón de barra de herramientas para abrir el editor de ecuaciones. */
export function BotonInsertarEcuacion({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md border border-borde bg-blanco px-2 py-1 text-xs font-medium text-azul-700 hover:border-azul-600 hover:bg-azul-50"
      title="Insertar ecuación"
      aria-label="Insertar ecuación"
    >
      <Sigma size={14} aria-hidden />
      Insertar ecuación
    </button>
  );
}
