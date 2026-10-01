import { JWT } from "google-auth-library";
import type { CambioFila, TransporteSheets } from "./transporte-sheets";

/**
 * Transporte real sobre la API REST v4 de Google Sheets — mismo patrón que
 * `src/lib/data/google-sheets-client.ts` del CLM (`google-auth-library` +
 * `fetch`, sin el paquete `googleapis` completo, por la misma razón: evitar
 * el costo de build de un meta-paquete que empaqueta todas las APIs de
 * Google), pero:
 *  - apunta a `GOOGLE_SHEETS_ALQUILERES_ID` (planilla separada, D1) — NUNCA
 *    a `GOOGLE_SHEETS_SPREADSHEET_ID` del CLM (T26: aislamiento total,
 *    verificado también por `aislamiento.test.ts`, que confirma que este
 *    archivo no importa nada de `src/lib/data/*`).
 *  - implementa `TransporteSheets`, no una interfaz propia de "contratos":
 *    sirve para cualquiera de las ~20 tablas del módulo.
 *  - devuelve el número de fila real que la API asignó al agregar
 *    (`agregarFila`), necesario para R1 (ID = fila de la secuencia).
 *  - agrega `actualizarMultiple`, con una sola llamada a
 *    `spreadsheets.batchUpdate` (`updateCells` por cada cambio, en el mismo
 *    request) — se aplica completa o no se aplica (prueba técnica (d)).
 *
 * Nunca se ejecuta contra Google real en este desarrollo (no hay
 * credenciales en este worktree) — se prueba contra `FakeSheetsApi`
 * (mismo contrato `TransporteSheets`) en `repositorio-sheets.test.ts`.
 */

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name} (ver docs/PENDIENTES-HUMANOS.md punto 4).`);
  return v;
}

/** true si están cargadas las variables necesarias para usar la planilla de Alquileres — independiente de `googleSheetsConfigurado()` del CLM (T26). */
export function googleSheetsAlquileresConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_ALQUILERES_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

export function getSpreadsheetIdAlquileres(): string {
  return getEnv("GOOGLE_SHEETS_ALQUILERES_ID");
}

let clienteAuth: JWT | null = null;

function getAuth(): JWT {
  if (!clienteAuth) {
    clienteAuth = new JWT({
      email: getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      key: getEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return clienteAuth;
}

async function getAccessToken(): Promise<string> {
  const { token } = await getAuth().getAccessToken();
  if (!token) throw new Error("No se pudo obtener un access token de Google (revisar credenciales).");
  return token;
}

async function llamarApi(path: string, init?: RequestInit): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${SHEETS_API_BASE}/${getSpreadsheetIdAlquileres()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Google Sheets API (Alquileres) respondió ${res.status}: ${texto}`);
  }
  return res.json();
}

/** Extrae el número de fila de DATOS (1-based) de un rango devuelto por `values.append` (ej. "Hoja!A5:Z5" con encabezado en la fila 1 -> fila de datos 4). */
export function filaDeDatosDesdeRango(range: string): number {
  const m = /![A-Z]+(\d+)/.exec(range);
  if (!m) throw new Error(`No se pudo interpretar el rango devuelto por Sheets: "${range}"`);
  return Number(m[1]) - 1; // -1 porque la fila 1 es el encabezado.
}

export class TransporteSheetsHttp implements TransporteSheets {
  async leer(hoja: string): Promise<string[][]> {
    const data = (await llamarApi(`/values/${encodeURIComponent(`${hoja}!A2:ZZ`)}`)) as { values?: string[][] };
    return data.values ?? [];
  }

  async agregarFila(hoja: string, valores: (string | number | boolean)[]): Promise<{ filaNumero: number }> {
    const data = (await llamarApi(
      `/values/${encodeURIComponent(`${hoja}!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: [valores] }) }
    )) as { updates?: { updatedRange?: string } };
    const range = data.updates?.updatedRange;
    if (!range) throw new Error("Google Sheets no devolvió el rango de la fila agregada.");
    return { filaNumero: filaDeDatosDesdeRango(range) };
  }

  async actualizarFila(hoja: string, filaNumero: number, valores: (string | number | boolean)[]): Promise<void> {
    const filaReal = filaNumero + 1; // +1 por el encabezado.
    await llamarApi(`/values/${encodeURIComponent(`${hoja}!A${filaReal}`)}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: [valores] }),
    });
  }

  async actualizarMultiple(cambios: CambioFila[]): Promise<void> {
    if (cambios.length === 0) return;
    // Una sola llamada HTTP a `spreadsheets.values.batchUpdate`, con un
    // rango por cambio: la API aplica todos los rangos del mismo request o
    // ninguno (si la llamada falla, no hay escrituras parciales — no hay
    // una segunda llamada de red de la que una pueda fallar sin la otra).
    // Prueba técnica (d) del PRD v2.1.
    await llamarApi(`/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: cambios.map((c) => ({
          range: `${c.hoja}!A${c.filaNumero + 1}`,
          values: [c.valores],
        })),
      }),
    });
  }
}
