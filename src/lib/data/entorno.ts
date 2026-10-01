/**
 * F0-4 (hallazgo del PRD v2.1, sección 3): el proveedor mock (datos de
 * ejemplo en memoria, incluido `MOCK_USUARIOS` con una cuenta real embebida
 * para poder probar el login de punta a punta en desarrollo — ver
 * INSTRUCTIVO_CONFIGURACION.md) nunca debe poder servir datos en
 * producción. La barrera principal es `src/instrumentation.ts` (no deja
 * arrancar el server en producción sin Sheets configurado); esta función es
 * la segunda barrera, en el propio punto donde cada provider decide caer al
 * mock — si por lo que sea `instrumentation.ts` no llegó a correr, ningún
 * provider sirve mock en producción de todos modos.
 */
export function exigirMockPermitido(contexto: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Intento de usar datos mock (${contexto}) en producción sin Google Sheets configurado. ` +
        "La app no debe operar en este estado (F0-4): cargar GOOGLE_SHEETS_SPREADSHEET_ID, " +
        "GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY como variables de entorno."
    );
  }
}
