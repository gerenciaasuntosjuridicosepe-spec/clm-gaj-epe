/**
 * F0-4 (hallazgo del PRD v2.1, sección 3): "Mock solo con NODE_ENV !==
 * 'production'; en producción, sin Sheets configurado, la app no arranca."
 *
 * `register()` corre una única vez cuando arranca una instancia del
 * servidor de Next.js, y debe terminar antes de que esa instancia atienda
 * ninguna petición (ver node_modules/next/dist/docs/.../instrumentation.md)
 * — es el lugar correcto para esta verificación: si en producción no hay
 * Google Sheets configurado, el proceso termina acá, antes de poder servir
 * una sola página con datos mock (que además incluye una cuenta real
 * embebida en MOCK_USUARIOS, ver docs/DECISIONES.md).
 *
 * Segunda barrera (por si esta nunca llegara a ejecutarse en algún entorno
 * de despliegue atípico): cada provider mock llama a
 * `exigirMockPermitido()` (src/lib/data/entorno.ts) antes de servir datos.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return; // la verificación solo aplica al runtime Node del server.

  const { googleSheetsConfigurado } = await import("@/lib/data/google-sheets-client");
  if (process.env.NODE_ENV === "production" && !googleSheetsConfigurado()) {
    throw new Error(
      "F0-4: producción sin Google Sheets configurado. La app no arranca con datos mock. " +
        "Cargá GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL y " +
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY como variables de entorno de producción " +
        "(ver INSTRUCTIVO_CONFIGURACION.md)."
    );
  }
}
