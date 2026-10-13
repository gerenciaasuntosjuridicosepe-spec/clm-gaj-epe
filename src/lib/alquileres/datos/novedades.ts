import { crearRepositorio } from "../repositorio";
import { NOVEDADES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Novedad } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Novedad> | null = null;

/** Repositorio de NOVEDADES — único punto que el resto del código debe usar para leer/escribir novedades. */
export function getRepositorioNovedades(): RepositorioTabla<Novedad> {
  if (!instancia) {
    instancia = crearRepositorio<Novedad>({
      hojaDatos: SHEET_NAMES.novedades,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.novedad],
      prefijo: PREFIJOS_ID.novedad,
      campoId: "novedadId",
      columnas: NOVEDADES_COLUMNS,
      nombreTabla: "NOVEDADES",
    });
  }
  return instancia;
}
