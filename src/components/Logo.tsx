import Image from "next/image";

const TAMANIOS = {
  sm: 32,
  md: 44,
  lg: 72,
} as const;

/**
 * Logo institucional de Arte Nuevo. Cuando `sobreColor` es true (se va a mostrar sobre un fondo
 * violeta/amarillo), se envuelve en un contenedor blanco para asegurar buena visualización, tal
 * como pide la identidad institucional. El archivo original no se recorta ni se deforma.
 */
export function Logo({
  tamano = "md",
  sobreColor = false,
  className = "",
}: {
  tamano?: "sm" | "md" | "lg";
  sobreColor?: boolean;
  className?: string;
}) {
  const px = TAMANIOS[tamano];

  const imagen = (
    <Image
      src="/images/logo-arte-nuevo.png"
      alt="Logo de Arte Nuevo"
      width={px}
      height={px}
      priority
      className="h-full w-full object-contain"
    />
  );

  if (!sobreColor) {
    return (
      <span className={`inline-flex shrink-0 ${className}`} style={{ width: px, height: px }}>
        {imagen}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-sm ${className}`}
      style={{ width: px + 12, height: px + 12 }}
    >
      {imagen}
    </span>
  );
}
