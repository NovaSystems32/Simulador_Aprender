"use client";

import { useTransition } from "react";
import type { Perfil, RolUsuario } from "@/lib/types";
import { alternarActivo, cambiarRol } from "./actions";

export function FilaUsuario({ perfil }: { perfil: Perfil }) {
  const [pendiente, iniciarTransicion] = useTransition();

  return (
    <tr className="border-b border-borde last:border-0">
      <td className="px-4 py-3 text-texto">
        {perfil.nombre} {perfil.apellido}
      </td>
      <td className="px-4 py-3 text-texto-secundario">{perfil.email}</td>
      <td className="px-4 py-3">
        <select
          defaultValue={perfil.rol}
          disabled={pendiente}
          onChange={(e) => iniciarTransicion(() => cambiarRol(perfil.id, e.target.value as RolUsuario))}
          className="campo-select w-auto"
        >
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="admin">Administrador</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${perfil.activo ? "bg-exito-50 text-exito" : "bg-violeta-100 text-texto-secundario"}`}>
          {perfil.activo ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => iniciarTransicion(() => alternarActivo(perfil.id, !perfil.activo))}
          className="text-xs font-medium text-violeta-600 hover:underline disabled:opacity-50"
        >
          {perfil.activo ? "Desactivar" : "Activar"}
        </button>
      </td>
    </tr>
  );
}

export function TarjetaUsuario({ perfil }: { perfil: Perfil }) {
  const [pendiente, iniciarTransicion] = useTransition();

  return (
    <div className="tarjeta">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-texto">
            {perfil.nombre} {perfil.apellido}
          </p>
          <p className="text-xs text-texto-secundario">{perfil.email}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${perfil.activo ? "bg-exito-50 text-exito" : "bg-violeta-100 text-texto-secundario"}`}>
          {perfil.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-3">
        <select
          defaultValue={perfil.rol}
          disabled={pendiente}
          onChange={(e) => iniciarTransicion(() => cambiarRol(perfil.id, e.target.value as RolUsuario))}
          className="campo-select w-auto"
        >
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="admin">Administrador</option>
        </select>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => iniciarTransicion(() => alternarActivo(perfil.id, !perfil.activo))}
          className="text-xs font-medium text-violeta-600 hover:underline disabled:opacity-50"
        >
          {perfil.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}
