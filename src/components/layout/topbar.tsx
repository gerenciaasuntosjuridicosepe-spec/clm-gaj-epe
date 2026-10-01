"use client";
import { BellRing, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ROLES } from "@/lib/permisos";
import { ETIQUETAS_ROL_ALQUILERES } from "@/lib/alquileres/permisos";

/**
 * Topbar — sección 3.6 del design system. Compartido por el CLM y por
 * Alquileres (D5: cada módulo tiene su grupo de menú propio, pero el shell
 * visual —sidebar/topbar— se reutiliza, sección 2 del PRD v2.1: "Qué se
 * reutiliza").
 *
 * Antes leía el rol con `useRol()` (CLM, `src/lib/session.tsx`), que
 * lanza si `rolId` no está resuelto — rompía esta pantalla para una sesión
 * que solo tiene rol en Alquileres (D12: un usuario puede no tener rolId
 * del CLM en absoluto). Ahora lee la sesión directo y elige la etiqueta de
 * rol/módulo según la ruta activa, sin asumir que siempre hay un rolId del
 * CLM. El comportamiento para una sesión CON rolId (todo el CLM existente)
 * no cambia: mismo texto, mismo cálculo de iniciales.
 */
export function Topbar({ titulo }: { titulo: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const enAlquileres = pathname?.startsWith("/alquileres") ?? false;

  const nombre = session?.user?.name ?? "Usuario";
  const rolId = session?.user?.rolId;
  const rolAlquileres = session?.user?.rolAlquileres;
  const etiquetaRol = enAlquileres
    ? (rolAlquileres ? ETIQUETAS_ROL_ALQUILERES[rolAlquileres] : "Sin rol en Alquileres")
    : (rolId ? ROLES[rolId].nombre : "Sin rol en el CLM");
  const etiquetaModulo = enAlquileres ? "GAJ · Alquileres" : "GAJ · CLM v1";

  const iniciales = nombre
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-[var(--topbar-h)] flex-shrink-0 items-center gap-3.5 bg-brand-blue-900 px-5 text-white">
      <span className="font-[var(--font-display)] text-[var(--text-lg)] font-bold">{titulo}</span>
      <span className="rounded-[var(--radius-pill)] border border-brand-orange-300/35 bg-[var(--overlay-brand-12)] px-2.5 py-1 text-[var(--text-xs)] font-bold uppercase tracking-wide text-brand-orange-300">
        {etiquetaModulo}
      </span>
      <div className="flex-1" />

      <button className="relative flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--overlay-white-07)]" title="Alertas">
        <BellRing size={16} />
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full border-[1.5px] border-brand-blue-900 bg-brand-orange-500" />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-500 text-[11px] font-bold text-[#1A2940]">
          {iniciales}
        </div>
        <div className="leading-tight">
          <div className="text-[var(--text-sm)] font-semibold">{nombre}</div>
          <div className="text-[var(--text-2xs)] text-white/65">{etiquetaRol}</div>
        </div>
      </div>

      <button
        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--overlay-white-07)]"
        title="Salir"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}
