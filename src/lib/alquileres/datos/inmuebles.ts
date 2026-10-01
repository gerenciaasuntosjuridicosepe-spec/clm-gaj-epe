import { crearRepositorio } from "../repositorio";
import { INMUEBLES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Inmueble } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Inmueble> | null = null;

/** Repositorio de INMUEBLES — único punto que el resto del código debe usar para leer/escribir inmuebles. */
export function getRepositorioInmuebles(): RepositorioTabla<Inmueble> {
  if (!instancia) {
    instancia = crearRepositorio<Inmueble>({
      hojaDatos: SHEET_NAMES.inmuebles,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.inmueble],
      prefijo: PREFIJOS_ID.inmueble,
      campoId: "inmuebleId",
      columnas: INMUEBLES_COLUMNS,
      nombreTabla: "INMUEBLES",
    });
  }
  return instancia;
}
