import { JWT } from "google-auth-library";

/**
 * Cliente de Google Sheets — llama directo a la API REST v4 con `fetch` en
 * vez de usar el paquete `googleapis`. Se decidió así a propósito: el
 * paquete `googleapis` es un meta-paquete que empaqueta el cliente de
 * absolutamente todas las APIs de Google (Drive, Calendar, YouTube, etc.),
 * con un volumen de tipos tan grande que hacía que `next build` tardara
 * varios minutos (y en este entorno de desarrollo, directamente colgaba).
 * `google-auth-library` sola alcanza para autenticar, y el resto es una
 * llamada HTTP común — no hace falta el resto del paquete.
 *
 * Variables de entorno requeridas (ver INSTRUCTIVO_CONFIGURACION.md):
 *   GOOGLE_SHEETS_SPREADSHEET_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 */

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name} (ver INSTRUCTIVO_CONFIGURACION.md).`);
  return v;
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
  const auth = getAuth();
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("No se pudo obtener un access token de Google (revisar credenciales).");
  return token;
}

export function getSpreadsheetId(): string {
  return getEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
}

/** true si están cargadas las tres variables necesarias para usar Google Sheets. */
export function googleSheetsConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

async function llamarApi(path: string, init?: RequestInit): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${SHEETS_API_BASE}/${getSpreadsheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Google Sheets API respondió ${res.status}: ${texto}`);
  }
  return res.json();
}

/** Lee todas las filas de una hoja (sin la fila de encabezado). */
export async function leerFilas(hoja: string): Promise<string[][]> {
  const data = (await llamarApi(`/values/${encodeURIComponent(`${hoja}!A2:ZZ`)}`)) as { values?: string[][] };
  return data.values ?? [];
}

/** Agrega una fila al final de una hoja. */
export async function agregarFila(hoja: string, fila: (string | number | boolean)[]): Promise<void> {
  await llamarApi(`/values/${encodeURIComponent(`${hoja}!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [fila] }),
  });
}

/**
 * Sobreescribe la fila `numeroFila` (1-based, coincide con la fila real de la
 * hoja incluyendo el header — es decir, la primera fila de datos es la 2).
 */
export async function actualizarFila(hoja: string, numeroFila: number, fila: (string | number | boolean)[]): Promise<void> {
  await llamarApi(`/values/${encodeURIComponent(`${hoja}!A${numeroFila}`)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [fila] }),
  });
}
