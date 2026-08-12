import { exigirPerfil } from "@/lib/auth";
import { PanelLayout, type EnlaceNav } from "@/components/layout/PanelLayout";

const ENLACES: EnlaceNav[] = [
  { href: "/admin", label: "Panel", icono: "dashboard" },
  { href: "/admin/usuarios", label: "Usuarios", icono: "usuarios" },
  { href: "/admin/cursos", label: "Cursos", icono: "cursos" },
  { href: "/admin/preguntas", label: "Banco de preguntas", icono: "preguntas" },
  { href: "/admin/configuracion", label: "Configuración", icono: "configuracion" },
];

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPerfil(["admin"]);

  return (
    <PanelLayout enlaces={ENLACES} perfil={perfil} marcaAgua="Arte Nuevo — Simulador educativo independiente">
      {children}
    </PanelLayout>
  );
}
