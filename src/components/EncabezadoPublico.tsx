import Link from "next/link";
import { Logo } from "@/components/Logo";

export function EncabezadoPublico() {
  return (
    <header className="border-b border-borde bg-blanco">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo tamano="sm" />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-violeta-800">Simulador de Matemática</span>
            <span className="text-xs text-texto-secundario">Práctica para las Pruebas Aprender – 6.º año</span>
          </span>
        </Link>
        <Link href="/login" className="btn-primario">
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}
