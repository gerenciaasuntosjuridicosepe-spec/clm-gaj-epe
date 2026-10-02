import { crearRepositorio } from "../repositorio";
import { ACTUACION_PARTES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type ActuacionParte } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<ActuacionParte> | null = null;

/** Repositorio de ACTUACION_PARTES (RF-10) — único punto que el resto del código debe usar para leer/escribir partes de actuaciones. */
export function getRepositorioActuacionPartes(): RepositorioTabla<ActuacionParte> {
  if (!instancia) {
    instancia = crearRepositorio<ActuacionParte>({
      hojaDatos: SHEET_NAMES.actuacionPartes,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.actuacionParte],
      prefijo: PREFIJOS_ID.actuacionParte,
      campoId: "parteId",
      columnas: ACTUACION_PARTES_COLUMNS,
      nombreTabla: "ACTUACION_PARTES",
    });
  }
  return instancia;
}
