/**
 * Transporte de bajo nivel hacia "una hoja de una planilla de Sheets" —
 * abstrae la API REST de Google Sheets detrás de 4 operaciones. Dos
 * implementaciones:
 *  - `transporte-sheets-http.ts`: la real, HTTP contra Sheets (como
 *    `google-sheets-client.ts` del CLM, pero devolviendo el número de fila
 *    real que asigna la API al agregar — necesario para R1).
 *  - `transporte-sheets-fake.ts`: un doble completo en memoria, para poder
 *    probar `repositorio-sheets.ts` (secuencia de IDs, control de versión,
 *    atomicidad de escrituras multi-fila) sin pegarle a Google real.
 *
 * `repositorio-sheets.ts` depende únicamente de esta interfaz — nunca de
 * `fetch` ni de `google-auth-library` directamente — así el mismo código de
 * reglas de repositorio corre igual contra cualquiera de las dos.
 */

export interface CambioFila {
  hoja: string;
  /** 1-based, cuenta desde la primera fila de DATOS (es decir, sin contar el encabezado). */
  filaNumero: number;
  valores: (string | number | boolean)[];
}

export interface TransporteSheets {
  /** Todas las filas de datos de una hoja (sin el encabezado), en el mismo orden que están en la planilla. */
  leer(hoja: string): Promise<string[][]>;

  /**
   * Agrega una fila al final de la hoja. Devuelve el número de fila de
   * DATOS (1-based) que le tocó — es la base de R1: "el número del ID es
   * la fila asignada por la propia API al agregar".
   */
  agregarFila(hoja: string, valores: (string | number | boolean)[]): Promise<{ filaNumero: number }>;

  /** Sobreescribe una fila de datos existente (1-based). */
  actualizarFila(hoja: string, filaNumero: number, valores: (string | number | boolean)[]): Promise<void>;

  /**
   * Aplica varios cambios de fila en una sola operación atómica (análogo a
   * `spreadsheets.batchUpdate`): o se aplican todos, o ninguno queda
   * aplicado (prueba técnica (d) del PRD v2.1, T20/R3a).
   */
  actualizarMultiple(cambios: CambioFila[]): Promise<void>;
}
