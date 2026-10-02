/**
 * RF-41 — Menú propio del módulo de Alquileres: grupo "Alquileres" en el
 * sidebar, independiente del `NAV_GROUPS` del CLM (`src/lib/navegacion.ts`
 * — D5/D2: cada módulo tiene su propio modelo, no se reutiliza/extiende el
 * del otro, ni siquiera para algo tan simple como la navegación).
 *
 * El PRD v2.1 (sección 7, RF-41) pide Dashboard, Inmuebles, Expedientes,
 * Actuaciones, Personas, Calendario, Alertas, Reportes y Administración.
 * Esta Fase 1 solo construyó las páginas de Inmuebles/Expedientes/
 * Actuaciones/Personas — el resto se agrega acá mismo (una línea cada vez)
 * a medida que se construyan en las fases siguientes, no antes, para no
 * dejar enlaces rotos en el menú.
 */
export interface NavItemAlquileres {
  href: string;
  label: string;
  icon: "inmuebles" | "expedientes" | "actuaciones" | "personas";
  /** Si se informa, el ítem solo se muestra si `filtro(rol)` da true (ej. Personas oculto para LECTOR). */
  filtro?: (rol: import("./tipos").RolAlquileresId) => boolean;
}

export interface NavGroupAlquileres {
  label: string;
  items: NavItemAlquileres[];
}

export const NAV_GROUPS_ALQUILERES: NavGroupAlquileres[] = [
  {
    label: "Alquileres",
    items: [
      { href: "/alquileres/inmuebles", label: "Inmuebles", icon: "inmuebles" },
      { href: "/alquileres/expedientes", label: "Expedientes", icon: "expedientes" },
      { href: "/alquileres/actuaciones", label: "Actuaciones", icon: "actuaciones" },
      // Personas: LECTOR no tiene ni "leer" en MATRIZ_PERSONAS (dato personal) — se oculta el ítem para ese rol.
      { href: "/alquileres/personas", label: "Personas", icon: "personas", filtro: (rol) => rol !== "LECTOR" },
    ],
  },
];
