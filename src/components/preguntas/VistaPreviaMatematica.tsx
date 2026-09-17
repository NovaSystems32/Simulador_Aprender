"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

// react-katex (InlineMath/BlockMath) no expone un prop para pasarle opciones
// de KaTeX como trust/strict: solo reenvía { displayMode, errorColor,
// throwOnError } a katex.renderToString. No hace falta configurarlo a mano:
// katex ya trae trust:false y strict:"warn" como default de fábrica, que es
// exactamente el modo seguro (sin \href/\includegraphics con URLs externas).

function ErrorFormula({ texto }: { texto: string }) {
  return (
    <span className="rounded bg-error-50 px-1 py-0.5 font-mono text-xs text-error" title="Expresión matemática inválida">
      {texto}
    </span>
  );
}

/**
 * Un $...$ solo se trata como fórmula si el contenido no arranca ni termina
 * con espacio. Es la misma convención que usan Pandoc y remark-math, y acá
 * además evita un choque real: preguntas del banco que citan dos precios en
 * pesos en el mismo campo (ej. "cuestan $9000; ... cuestan $9500") tienen dos
 * signos $ sueltos que, sin esta guarda, el regex empareja como si fueran los
 * delimitadores de una sola fórmula y KaTeX los renderiza como un galimatías.
 * Un "$x^2$" nunca tiene espacio pegado a los delimitadores, así que la
 * fórmula real no se ve afectada.
 */
function esFormulaValida(contenido: string): boolean {
  return contenido.length > 0 && !/^\s|\s$/.test(contenido);
}

/**
 * Muestra texto con fórmulas en LaTeX delimitadas por $$...$$ (ecuación
 * centrada/bloque) o $...$ (en línea). El resto del texto se muestra tal
 * cual. Una fórmula inválida se muestra resaltada en vez de romper la
 * pantalla completa (nunca debería tirar abajo la pregunta, la evaluación
 * o los resultados por un typo de TeX).
 */
export function TextoConFormulas({ texto, className }: { texto: string; className?: string }) {
  if (!texto) return null;
  // Primero $$...$$ (bloque), y sobre lo que queda, $...$ (en línea). El
  // orden importa: si se buscara $...$ primero, "$$x$$" se partiría mal.
  const bloques = texto.split(/(\$\$[^$]+\$\$)/g);

  return (
    <span className={className}>
      {bloques.map((bloque, indiceBloque) => {
        if (bloque.startsWith("$$") && bloque.endsWith("$$") && bloque.length > 4) {
          const formula = bloque.slice(2, -2);
          if (esFormulaValida(formula)) {
            return (
              <BlockMath key={indiceBloque} math={formula} renderError={() => <ErrorFormula texto={bloque} />} />
            );
          }
        }
        const partesEnLinea = bloque.split(/(\$[^$]+\$)/g);
        return (
          <span key={indiceBloque}>
            {partesEnLinea.map((parte, indice) => {
              if (parte.startsWith("$") && parte.endsWith("$") && parte.length > 2) {
                const formula = parte.slice(1, -1);
                if (esFormulaValida(formula)) {
                  return (
                    <InlineMath key={indice} math={formula} renderError={() => <ErrorFormula texto={parte} />} />
                  );
                }
              }
              return <span key={indice}>{parte}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}
