"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { NAV_GROUPS, NavItem } from "@/lib/navegacion";
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

/** Sidebar — sección 3.6 del design system: ancho fijo 248px, 3 grupos, indicador naranja de activo. */
export function Sidebar() {
  const pathname = usePathname();

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

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="px-2.5 pt-3.5 pb-1">
          <div className="px-2.5 pb-1.5 text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-white/40">
            {group.label}
          </div>
          {group.items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-r-md border-l-[3px] border-transparent px-3 py-2 text-[var(--text-base)] text-white/85 transition-colors duration-[var(--duration-fast)]",
                  "hover:bg-[var(--overlay-white-07)]",
                  active && "border-brand-orange-500 bg-[var(--overlay-white-11)] font-semibold text-white"
                )}
              >
                <Icon size={15} />
                {item.label}
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-brand-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-[#1A2940]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
