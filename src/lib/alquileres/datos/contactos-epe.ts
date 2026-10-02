import { crearRepositorio } from "../repositorio";
import { CONTACTOS_EPE_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type ContactoEpe } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<ContactoEpe> | null = null;

/** Repositorio de CONTACTOS_EPE — único punto que el resto del código debe usar para leer/escribir contactos. */
export function getRepositorioContactosEpe(): RepositorioTabla<ContactoEpe> {
  if (!instancia) {
    instancia = crearRepositorio<ContactoEpe>({
      hojaDatos: SHEET_NAMES.contactosEpe,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.contactoEpe],
      prefijo: PREFIJOS_ID.contactoEpe,
      campoId: "contactoId",
      columnas: CONTACTOS_EPE_COLUMNS,
      nombreTabla: "CONTACTOS_EPE",
    });
  }
  return instancia;
}
