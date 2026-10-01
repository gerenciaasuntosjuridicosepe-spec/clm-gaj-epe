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

let transporteHttp: TransporteSheetsHttp | null = null;

/**
 * Fábrica única del repositorio de cualquier tabla del módulo de
 * Alquileres: elige Sheets real o el mock en memoria según
 * `googleSheetsAlquileresConfigurado()` (mismo patrón que
 * `getContratosProvider()` del CLM, generalizado). En producción sin
 * Sheets configurado, no cae al mock en silencio (F0-4) — ver
 * `src/instrumentation.ts`, que ya impide que la app arranque en ese
 * estado; esto es la segunda barrera, acá también.
 */
export function crearRepositorio<T extends { version: number; activo: boolean }>(
  opciones: OpcionesTabla<T>
): RepositorioTabla<T> {
  if (googleSheetsAlquileresConfigurado()) {
    if (!transporteHttp) transporteHttp = new TransporteSheetsHttp();
    return new RepositorioSheets<T>({ transporte: transporteHttp, ...opciones });
  }
  exigirMockPermitido(opciones.nombreTabla);
  return new RepositorioMock<T>({
    prefijo: opciones.prefijo,
    campoId: opciones.campoId,
    nombreTabla: opciones.nombreTabla,
  });
}

export * from "./tipos-repositorio";
export * from "./transporte-sheets-http";
