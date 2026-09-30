"use client";
import { BellRing, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRol } from "@/lib/session";

/**
 * Topbar — sección 3.6 del design system.
 * Ya no tiene selector de rol simulado: el rol viene de la sesión real
 * (Google + tabla de Usuarios, ver src/auth.ts). "Salir" cierra la sesión.
 */
export function Topbar({ titulo }: { titulo: string }) {
  const { rol } = useRol();
  const { data: session } = useSession();
  const nombre = session?.user?.name ?? rol.nombre;
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
        GAJ · CLM v1
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
          <div className="text-[var(--text-2xs)] text-white/65">{rol.nombre}</div>
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
