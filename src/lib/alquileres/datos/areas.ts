import { crearRepositorio } from "../repositorio";
import { AREAS_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Area } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Area> | null = null;

/** Repositorio de AREAS — único punto que el resto del código debe usar para leer/escribir áreas. */
export function getRepositorioAreas(): RepositorioTabla<Area> {
  if (!instancia) {
    instancia = crearRepositorio<Area>({
      hojaDatos: SHEET_NAMES.areas,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.area],
      prefijo: PREFIJOS_ID.area,
      campoId: "areaId",
      columnas: AREAS_COLUMNS,
      nombreTabla: "AREAS",
    });
  }
  return instancia;
}
