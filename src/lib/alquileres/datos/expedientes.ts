import { crearRepositorio } from "../repositorio";
import { EXPEDIENTES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Expediente } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Expediente> | null = null;

/** Repositorio de EXPEDIENTES — único punto que el resto del código debe usar para leer/escribir expedientes. */
export function getRepositorioExpedientes(): RepositorioTabla<Expediente> {
  if (!instancia) {
    instancia = crearRepositorio<Expediente>({
      hojaDatos: SHEET_NAMES.expedientes,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.expediente],
      prefijo: PREFIJOS_ID.expediente,
      campoId: "expedienteId",
      columnas: EXPEDIENTES_COLUMNS,
      nombreTabla: "EXPEDIENTES",
    });
  }
  return instancia;
}
