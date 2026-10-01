import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Utilidad compartida por las pruebas de cobertura de guardia de sesión:
 *  - F0-1 (hallazgo crítico del CLM existente: GET /api/contratos y
 *    GET /api/contratos/[id] no llamaban a requerirSesion()).
 *  - RF-42 / T18 del PRD v2.1 (el módulo de Alquileres exige lo mismo para
 *    cada ruta bajo app/api/alquileres/**).
 *
 * Encuentra todos los `route.ts` bajo `src/app/api` (recursivo) y permite
 * importarlos dinámicamente para invocar cada handler exportado (GET, POST,
 * PATCH, PUT, DELETE) con una sesión nula simulada.
 */

const METODOS_HTTP = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type MetodoHttp = (typeof METODOS_HTTP)[number];

export interface RutaApi {
  /** Ruta absoluta en disco al archivo route.ts */
  archivo: string;
  /** Ruta de la URL que representa, ej. "/api/contratos/[id]" */
  rutaUrl: string;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const p = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return walk(p);
    if (entrada.name === "route.ts") return [p];
    return [];
  });
}

/**
 * Lista todas las rutas de API del proyecto bajo `src/app/api`.
 * @param subcarpeta opcional, ej. "alquileres" para limitar a app/api/alquileres/**
 */
export function listarRutasApi(subcarpeta?: string): RutaApi[] {
  const raizApi = path.resolve(process.cwd(), "src/app/api");
  const base = subcarpeta ? path.join(raizApi, subcarpeta) : raizApi;
  if (!fs.existsSync(base)) return [];
  return walk(base).map((archivo) => {
    const rel = path.relative(raizApi, path.dirname(archivo)).split(path.sep).join("/");
    return { archivo, rutaUrl: `/api/${rel}` };
  });
}

/** Importa dinámicamente un módulo route.ts y devuelve sus handlers HTTP exportados. */
export async function importarHandlers(archivo: string): Promise<Partial<Record<MetodoHttp, unknown>>> {
  const mod = (await import(pathToFileURL(archivo).href)) as Record<string, unknown>;
  const handlers: Partial<Record<MetodoHttp, unknown>> = {};
  for (const metodo of METODOS_HTTP) {
    if (typeof mod[metodo] === "function") handlers[metodo] = mod[metodo];
  }
  return handlers;
}

export { METODOS_HTTP };
