import { crearRepositorio } from "../repositorio";
import { DOCUMENTOS_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type DocumentoAlquiler } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<DocumentoAlquiler> | null = null;

/** Repositorio de DOCUMENTOS — único punto que el resto del código debe usar para leer/escribir documentos (RF-25/RF-28). */
export function getRepositorioDocumentos(): RepositorioTabla<DocumentoAlquiler> {
  if (!instancia) {
    instancia = crearRepositorio<DocumentoAlquiler>({
      hojaDatos: SHEET_NAMES.documentos,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.documento],
      prefijo: PREFIJOS_ID.documento,
      campoId: "documentoId",
      columnas: DOCUMENTOS_COLUMNS,
      nombreTabla: "DOCUMENTOS",
    });
  }
  return instancia;
}
