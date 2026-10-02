import { crearRepositorio } from "../repositorio";
import { ACTOS_ADMIN_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type ActoAdmin } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<ActoAdmin> | null = null;

/** Repositorio de ACTOS_ADMIN — único punto que el resto del código debe usar para leer/escribir actos administrativos (RF-29). */
export function getRepositorioActosAdmin(): RepositorioTabla<ActoAdmin> {
  if (!instancia) {
    instancia = crearRepositorio<ActoAdmin>({
      hojaDatos: SHEET_NAMES.actosAdmin,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.actoAdmin],
      prefijo: PREFIJOS_ID.actoAdmin,
      campoId: "actoId",
      columnas: ACTOS_ADMIN_COLUMNS,
      nombreTabla: "ACTOS_ADMIN",
    });
  }
  return instancia;
}
