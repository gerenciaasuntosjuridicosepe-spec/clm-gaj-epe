import { crearRepositorio } from "../repositorio";
import { PERSONAS_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Persona } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Persona> | null = null;

/** Repositorio de PERSONAS — único punto que el resto del código debe usar para leer/escribir personas (locadores). */
export function getRepositorioPersonas(): RepositorioTabla<Persona> {
  if (!instancia) {
    instancia = crearRepositorio<Persona>({
      hojaDatos: SHEET_NAMES.personas,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.persona],
      prefijo: PREFIJOS_ID.persona,
      campoId: "personaId",
      columnas: PERSONAS_COLUMNS,
      nombreTabla: "PERSONAS",
    });
  }
  return instancia;
}
