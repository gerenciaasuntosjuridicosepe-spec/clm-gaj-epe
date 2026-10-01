/**
 * F0-4 (mismo mecanismo que `src/lib/data/entorno.ts` del CLM, DUPLICADO a
 * propósito acá en vez de importado desde ahí): el módulo de Alquileres no
 * debe importar nada de `src/lib/data/*` (T26 — aislamiento total entre los
 * dos módulos, verificado por `aislamiento.test.ts`). Es una función de 5
 * líneas; copiarla es más barato que acoplar los dos módulos para siempre
 * por una utilidad tan chica.
 */
export function exigirMockPermitido(contexto: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Alquileres: intento de usar datos mock (${contexto}) en producción sin Google Sheets configurado. ` +
        "La app no debe operar en este estado (F0-4): cargar GOOGLE_SHEETS_ALQUILERES_ID, " +
        "GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY como variables de entorno."
    );
  }
}
