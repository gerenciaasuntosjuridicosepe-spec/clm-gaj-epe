import type { ColumnaDef } from "../esquema";
import { exigirMockPermitido } from "./entorno";
import { RepositorioMock } from "./repositorio-mock";
import { RepositorioSheets } from "./repositorio-sheets";
import type { RepositorioTabla } from "./tipos-repositorio";
import { googleSheetsAlquileresConfigurado } from "./transporte-sheets-http";
import { TransporteSheetsHttp } from "./transporte-sheets-http";

export interface OpcionesTabla<T extends { version: number; activo: boolean }> {
  /** Nombre de la hoja de datos (ej. SHEET_NAMES.inmuebles). */
  hojaDatos: string;
  /** Nombre de la hoja de secuencia del prefijo (ej. SEQ_SHEET_NAMES.INM). */
  hojaSecuencia: string;
  /** Prefijo del ID visible (ej. PREFIJOS_ID.inmueble). */
  prefijo: string;
  /** Campo que guarda el ID de esta tabla (ej. "inmuebleId"). Por convención, siempre la primera columna de `columnas` (ver `tipos.ts`). */
  campoId: keyof T & string;
  columnas: ColumnaDef<T>[];
  /** Nombre legible de la tabla, para mensajes de error (ej. "INMUEBLES"). */
  nombreTabla: string;
}

/**
 * Caché de instancias en `globalThis`, NO en una variable de módulo (`let`).
 *
 * Por qué: Next.js (con Turbopack, en `next dev`) compila las rutas de API
 * y los Server Components en grafos de módulos separados ("layers") —
 * importar el mismo archivo desde un Route Handler y desde una página
 * puede darle a cada uno SU PROPIA instancia del módulo, con sus propias
 * variables de nivel de módulo. Se confirmó esto empíricamente en esta
 * sesión: un alta por `POST /api/alquileres/inmuebles` no aparecía al leer
 * `GET /alquileres/inmuebles` (la página) un instante después, aunque sí
 * aparecía en `GET /api/alquileres/inmuebles` (misma "layer" que el POST).
 * La misma prueba contra el CLM existente (`POST /api/contratos` seguido
 * de `GET /contratos`) reproduce exactamente el mismo comportamiento — es
 * una característica ya presente en `src/lib/data/provider.ts` del CLM,
 * no algo nuevo de este módulo (no se toca ese archivo, está fuera de
 * alcance de esta fase). Para Alquileres sí se corrige acá: `globalThis`
 * es el objeto global real del proceso de Node y SÍ se comparte entre
 * distintos grafos de módulos de Turbopack dentro del mismo proceso
 * (mismo truco que usan los clientes de Prisma para sobrevivir al hot
 * reload de `next dev`). En producción con Sheets configurado esto es
 * irrelevante: el almacenamiento real es la planilla, no memoria del
 * proceso.
 */
interface CacheGlobalRepositorios {
  __alquileresRepos?: Map<string, RepositorioTabla<never>>;
  __alquileresTransporteHttp?: TransporteSheetsHttp;
}
const cacheGlobal = globalThis as typeof globalThis & CacheGlobalRepositorios;

function getCacheRepos(): Map<string, RepositorioTabla<never>> {
  if (!cacheGlobal.__alquileresRepos) cacheGlobal.__alquileresRepos = new Map();
  return cacheGlobal.__alquileresRepos;
}

/**
 * Fábrica única del repositorio de cualquier tabla del módulo de
 * Alquileres: elige Sheets real o el mock en memoria según
 * `googleSheetsAlquileresConfigurado()` (mismo patrón que
 * `getContratosProvider()` del CLM, generalizado). En producción sin
 * Sheets configurado, no cae al mock en silencio (F0-4) — ver
 * `src/instrumentation.ts`, que ya impide que la app arranque en ese
 * estado; esto es la segunda barrera, acá también.
 *
 * Una sola instancia por `nombreTabla` para todo el proceso (ver el
 * comentario de arriba sobre `globalThis`) — llamar dos veces con el mismo
 * `nombreTabla` devuelve siempre el mismo repositorio.
 */
export function crearRepositorio<T extends { version: number; activo: boolean }>(
  opciones: OpcionesTabla<T>
): RepositorioTabla<T> {
  const cache = getCacheRepos();
  const existente = cache.get(opciones.nombreTabla);
  if (existente) return existente as RepositorioTabla<T>;

  let repo: RepositorioTabla<T>;
  if (googleSheetsAlquileresConfigurado()) {
    if (!cacheGlobal.__alquileresTransporteHttp) cacheGlobal.__alquileresTransporteHttp = new TransporteSheetsHttp();
    repo = new RepositorioSheets<T>({ transporte: cacheGlobal.__alquileresTransporteHttp, ...opciones });
  } else {
    exigirMockPermitido(opciones.nombreTabla);
    repo = new RepositorioMock<T>({
      prefijo: opciones.prefijo,
      campoId: opciones.campoId,
      nombreTabla: opciones.nombreTabla,
    });
  }
  cache.set(opciones.nombreTabla, repo as RepositorioTabla<never>);
  return repo;
}

export * from "./tipos-repositorio";
export * from "./transporte-sheets-http";
