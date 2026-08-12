import { exigirPerfil } from "@/lib/auth";
import type { EnlaceNav } from "@/components/layout/PanelLayout";
import { EstudianteChrome } from "./EstudianteChrome";

const ENLACES: EnlaceNav[] = [
  { href: "/estudiante", label: "Panel", icono: "dashboard" },
  { href: "/estudiante/historial", label: "Mi historial", icono: "historial" },
];

export default async function LayoutEstudiante({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPerfil(["estudiante"]);

  return (
    <EstudianteChrome enlaces={ENLACES} perfil={perfil} marcaAgua="Arte Nuevo — Simulador educativo independiente">
      {children}
    </EstudianteChrome>
  );
}
