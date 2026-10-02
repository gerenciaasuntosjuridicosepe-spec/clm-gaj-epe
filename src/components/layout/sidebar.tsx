"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Inbox,
  BellRing,
  CalendarDays,
  FileText,
  PlusCircle,
  LayoutGrid,
  ListChecks,
  Tags,
  ShieldCheck,
  Users,
  History,
  Building2,
  Folder,
  FileSignature,
  UserRound,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { NAV_GROUPS, NavItem } from "@/lib/navegacion";
import { NAV_GROUPS_ALQUILERES, NavItemAlquileres } from "@/lib/alquileres/navegacion";
import { cn } from "@/lib/utils";

const ICONS: Record<NavItem["icon"], React.ComponentType<{ size?: number }>> = {
  bandeja: Inbox,
  alertas: BellRing,
  calendario: CalendarDays,
  contratos: FileText,
  nueva: PlusCircle,
  sectores: LayoutGrid,
  tipos: ListChecks,
  tiposAnotacion: Tags,
  tiposGarantia: ShieldCheck,
  usuarios: Users,
  auditoria: History,
};

const ICONS_ALQUILERES: Record<NavItemAlquileres["icon"], React.ComponentType<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  inmuebles: Building2,
  expedientes: Folder,
  actuaciones: FileSignature,
  personas: UserRound,
  calendario: CalendarDays,
  alertas: BellRing,
  reportes: BarChart3,
};

function EnlaceNav({
  href,
  label,
  activo,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  activo: boolean;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-r-md border-l-[3px] border-transparent px-3 py-2 text-[var(--text-base)] text-white/85 transition-colors duration-[var(--duration-fast)]",
        "hover:bg-[var(--overlay-white-07)]",
        activo && "border-brand-orange-500 bg-[var(--overlay-white-11)] font-semibold text-white"
      )}
    >
      <Icon size={15} />
      {label}
      {badge ? (
        <span className="ml-auto rounded-full bg-brand-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-[#1A2940]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Sidebar — sección 3.6 del design system: ancho fijo 248px, indicador
 * naranja de activo. RF-41 (D5): el grupo "Alquileres" es propio y
 * separado de los grupos del CLM — se muestra solo si la sesión tiene
 * `rolAlquileres` (y los grupos del CLM, solo si tiene `rolId`), así un
 * usuario con un solo rol no ve el menú del módulo al que no tiene acceso
 * (complementa, del lado de la UI, la guardia real del servidor en
 * `authorized()`/`src/auth.ts` — esto es solo cosmético, no la barrera).
 */
export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rolId = session?.user?.rolId;
  const rolAlquileres = session?.user?.rolAlquileres;

  return (
    <aside className="flex w-[var(--sidebar-w)] flex-shrink-0 flex-col bg-brand-blue-700 text-white">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
        <Image src="/logo-gaj.png" alt="EPE" width={32} height={32} className="rounded-md bg-white p-0.5" />
        <div className="font-[var(--font-display)] text-[12px] font-bold leading-tight">
          CLM
          <small className="block font-[var(--font-ui)] text-[9px] font-medium uppercase tracking-wide text-white/65">
            Asuntos Jurídicos · EPE
          </small>
        </div>
      </div>

      {rolId &&
        NAV_GROUPS.map((group) => (
          <div key={group.label} className="px-2.5 pt-3.5 pb-1">
            <div className="px-2.5 pb-1.5 text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-white/40">
              {group.label}
            </div>
            {group.items.map((item) => (
              <EnlaceNav
                key={item.href}
                href={item.href}
                label={item.label}
                activo={pathname === item.href}
                icon={ICONS[item.icon]}
                badge={item.badge}
              />
            ))}
          </div>
        ))}

      {rolAlquileres &&
        NAV_GROUPS_ALQUILERES.map((group) => (
          <div key={group.label} className="px-2.5 pt-3.5 pb-1">
            <div className="px-2.5 pb-1.5 text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-white/40">
              {group.label}
            </div>
            {group.items
              .filter((item) => !item.filtro || item.filtro(rolAlquileres))
              .map((item) => (
                <EnlaceNav
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  activo={pathname === item.href}
                  icon={ICONS_ALQUILERES[item.icon]}
                />
              ))}
          </div>
        ))}
    </aside>
  );
}
