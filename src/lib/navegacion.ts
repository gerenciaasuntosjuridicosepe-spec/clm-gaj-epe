/** Mapa de navegación — sección 10.2 del design system, basado en el patrón de sidebar de la referencia. */
export interface NavItem {
  href: string;
  label: string;
  icon: "bandeja" | "alertas" | "calendario" | "contratos" | "nueva" | "sectores" | "tipos" | "tiposAnotacion" | "tiposGarantia" | "usuarios" | "auditoria";
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Bandeja de tareas", icon: "bandeja" },
      { href: "/alertas", label: "Alertas de vencimiento", icon: "alertas" },
      { href: "/calendario", label: "Calendario", icon: "calendario" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/contratos", label: "Contratos", icon: "contratos" },
      { href: "/nueva-solicitud", label: "Nueva solicitud", icon: "nueva" },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/admin/sectores", label: "Biblioteca de sectores", icon: "sectores" },
      { href: "/admin/tipos-contrato", label: "Tipos de contrato", icon: "tipos" },
      { href: "/admin/tipos-anotacion", label: "Tipos de anotación", icon: "tiposAnotacion" },
      { href: "/admin/tipos-garantia", label: "Tipos de garantía", icon: "tiposGarantia" },
      { href: "/admin/usuarios", label: "Usuarios y roles", icon: "usuarios" },
      { href: "/admin/auditoria", label: "Auditoría", icon: "auditoria" },
    ],
  },
];
