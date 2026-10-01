import { crearRepositorio } from "../repositorio";
import { ACTUACIONES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Actuacion } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Actuacion> | null = null;

/** Repositorio de ACTUACIONES — único punto que el resto del código debe usar para leer/escribir actuaciones. */
export function getRepositorioActuaciones(): RepositorioTabla<Actuacion> {
  if (!instancia) {
    instancia = crearRepositorio<Actuacion>({
      hojaDatos: SHEET_NAMES.actuaciones,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.actuacion],
      prefijo: PREFIJOS_ID.actuacion,
      campoId: "actuacionId",
      columnas: ACTUACIONES_COLUMNS,
      nombreTabla: "ACTUACIONES",
    });
  }
  return instancia;
}
