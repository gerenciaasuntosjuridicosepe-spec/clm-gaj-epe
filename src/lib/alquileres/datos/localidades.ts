import { crearRepositorio } from "../repositorio";
import { LOCALIDADES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Localidad } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Localidad> | null = null;

/** Repositorio de LOCALIDADES — único punto que el resto del código debe usar para leer/escribir localidades. */
export function getRepositorioLocalidades(): RepositorioTabla<Localidad> {
  if (!instancia) {
    instancia = crearRepositorio<Localidad>({
      hojaDatos: SHEET_NAMES.localidades,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.localidad],
      prefijo: PREFIJOS_ID.localidad,
      campoId: "localidadId",
      columnas: LOCALIDADES_COLUMNS,
      nombreTabla: "LOCALIDADES",
    });
  }
  return instancia;
}
