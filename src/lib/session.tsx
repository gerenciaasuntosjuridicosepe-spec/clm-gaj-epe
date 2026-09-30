"use client";
import * as React from "react";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { RolId } from "./types";
import { ROLES } from "./permisos";

/**
 * El rol activo ya no se simula (PRD sección 3/7 hablaba de "no hay SSO
 * todavía"): ahora sale de la sesión real de Google + la tabla de Usuarios
 * (ver src/auth.ts). `useRol()` mantiene la misma forma que antes
 * (`{ rolId, rol }`) para no tener que tocar cada componente que la usa —
 * solo cambió de dónde sale el dato. Ya no existe `setRolId`: el rol no se
 * auto-asigna, lo resuelve el servidor.
 */
interface RolContextValue {
  rolId: RolId | null;
}

const RolContext = React.createContext<RolContextValue | null>(null);

function RolBridge({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const rolId = session?.user?.rolId ?? null;
  // /login se renderiza sin sesión (rolId null) — no llama a useRol(), así
  // que no hace falta ocultar `children` acá. Las páginas protegidas ya
  // llegan con sesión resuelta por el middleware + el `auth()` de layout.tsx.
  return <RolContext.Provider value={{ rolId }}>{children}</RolContext.Provider>;
}

export function RolProvider({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <RolBridge>{children}</RolBridge>
    </SessionProvider>
  );
}

export function useRol() {
  const ctx = React.useContext(RolContext);
  if (!ctx) throw new Error("useRol debe usarse dentro de <RolProvider>");
  if (!ctx.rolId) throw new Error("useRol: no hay sesión con rol resuelto (¿se llamó fuera de una página protegida?)");
  return { rolId: ctx.rolId, rol: ROLES[ctx.rolId] };
}
