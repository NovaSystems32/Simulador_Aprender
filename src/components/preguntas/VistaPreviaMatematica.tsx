"use client";

import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

/**
 * Muestra texto con fórmulas en LaTeX delimitadas por $...$. El resto del
 * texto se muestra tal cual. Si una fórmula no es válida, se muestra el
 * texto original en lugar de romper la vista.
 */
export function TextoConFormulas({ texto, className }: { texto: string; className?: string }) {
  if (!texto) return null;
  const partes = texto.split(/(\$[^$]+\$)/g);

  return (
    <span className={className}>
      {partes.map((parte, indice) => {
        if (parte.startsWith("$") && parte.endsWith("$") && parte.length > 2) {
          const formula = parte.slice(1, -1);
          try {
            return <InlineMath key={indice} math={formula} />;
          } catch {
            return <span key={indice}>{parte}</span>;
          }
        }
        return <span key={indice}>{parte}</span>;
      })}
    </span>
  );
}
