#!/usr/bin/env node
/**
 * Crea automáticamente las hojas y columnas que necesita el CLM en una
 * planilla de Google Sheets en blanco (o completa las que falten en una
 * que ya tenga datos — no borra ni pisa hojas existentes).
 *
 * Uso:
 *   npm run setup:sheet -- <SPREADSHEET_ID>
 * o, si ya está GOOGLE_SHEETS_SPREADSHEET_ID en .env.local:
 *   npm run setup:sheet
 *
 * Requiere las credenciales de la cuenta de servicio ya cargadas en
 * .env.local (ver INSTRUCTIVO_CONFIGURACION.md, paso 2).
 *
 * F0-2 (hallazgo del PRD v2.1, sección 3): antes este archivo tenía un
 * objeto HOJAS con las columnas escritas a mano, duplicando (y
 * desincronizándose de) src/lib/data/sheets-schema.ts — llegó a tener
 * "link_texto_final" y "link_pdf", dos columnas que ya no existen en el
 * esquema real. Ahora el array de columnas de cada hoja se IMPORTA desde
 * sheets-schema.ts (fuente única): este script ya no puede divergir del
 * esquema que lee/escribe la app, porque toma los mismos datos. La prueba
 * de coherencia T21-equivalente vive en scripts/setup-sheet.test.ts.
 */
import { config } from "dotenv";
import { JWT } from "google-auth-library";
import { pathToFileURL } from "node:url";
import {
  SHEET_NAMES,
  CONTRATOS_COLUMNS,
  HISTORIAL_COLUMNS,
  HITOS_COLUMNS,
  ANOTACIONES_COLUMNS,
  GARANTIAS_COLUMNS,
  SECTORES_COLUMNS,
  TIPOS_CONTRATO_COLUMNS,
  TIPOS_ANOTACION_COLUMNS,
  TIPOS_GARANTIA_COLUMNS,
  USUARIOS_COLUMNS,
} from "../src/lib/data/sheets-schema.ts";

config({ path: ".env.local" });

/**
 * Hoja -> columnas, construido a partir del esquema (nunca a mano). Se
 * exporta para que la prueba de coherencia pueda importarlo sin disparar
 * `main()` (ver el guard de entry-point al final del archivo).
 */
export const HOJAS = {
  [SHEET_NAMES.contratos]: CONTRATOS_COLUMNS.map((c) => c.header),
  [SHEET_NAMES.historial]: [...HISTORIAL_COLUMNS],
  [SHEET_NAMES.hitos]: [...HITOS_COLUMNS],
  [SHEET_NAMES.anotaciones]: [...ANOTACIONES_COLUMNS],
  [SHEET_NAMES.garantias]: [...GARANTIAS_COLUMNS],
  [SHEET_NAMES.sectores]: [...SECTORES_COLUMNS],
  [SHEET_NAMES.tiposContrato]: [...TIPOS_CONTRATO_COLUMNS],
  [SHEET_NAMES.tiposAnotacion]: [...TIPOS_ANOTACION_COLUMNS],
  [SHEET_NAMES.tiposGarantia]: [...TIPOS_GARANTIA_COLUMNS],
  [SHEET_NAMES.usuarios]: [...USUARIOS_COLUMNS],
};

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function main() {
  const spreadsheetId = process.argv[2] ?? process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!spreadsheetId || !email || !privateKey) {
    console.error(
      "Faltan datos. Necesito GOOGLE_SHEETS_SPREADSHEET_ID (o pasarlo como argumento), " +
        "GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY en .env.local.\n" +
        "Ver INSTRUCTIVO_CONFIGURACION.md."
    );
    process.exit(1);
  }

  const auth = new JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await auth.getAccessToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  console.log(`Conectando a la planilla ${spreadsheetId}...`);
  const metaRes = await fetch(`${API_BASE}/${spreadsheetId}`, { headers });
  if (!metaRes.ok) throw new Error(`No se pudo leer la planilla: ${metaRes.status} ${await metaRes.text()}`);
  const meta = await metaRes.json();
  const existentes = new Set(meta.sheets.map((s) => s.properties.title));

  const faltantes = Object.keys(HOJAS).filter((nombre) => !existentes.has(nombre));

  if (faltantes.length > 0) {
    console.log(`Creando hojas: ${faltantes.join(", ")}`);
    const res = await fetch(`${API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        requests: faltantes.map((nombre) => ({ addSheet: { properties: { title: nombre } } })),
      }),
    });
    if (!res.ok) throw new Error(`No se pudieron crear las hojas: ${res.status} ${await res.text()}`);
  } else {
    console.log("Todas las hojas ya existen — no se crea ninguna.");
  }

  for (const [nombre, columnas] of Object.entries(HOJAS)) {
    console.log(`Escribiendo encabezados en "${nombre}"...`);
    const res = await fetch(
      `${API_BASE}/${spreadsheetId}/values/${encodeURIComponent(`${nombre}!A1`)}?valueInputOption=RAW`,
      { method: "PUT", headers, body: JSON.stringify({ values: [columnas] }) }
    );
    if (!res.ok) throw new Error(`No se pudo escribir el encabezado de "${nombre}": ${res.status} ${await res.text()}`);
  }

  console.log("\nListo. La planilla ya tiene la estructura que espera el CLM.");
  console.log("Revisá que GOOGLE_SHEETS_SPREADSHEET_ID en .env.local sea:", spreadsheetId);
}

// Solo corre main() si este archivo se ejecutó directamente (`node
// scripts/setup-sheet.mjs`), no cuando una prueba lo importa para leer
// `HOJAS` (T21-equivalente, ver scripts/setup-sheet.test.ts) — así la
// prueba de coherencia no intenta conectarse a Google.
const esEntryPoint = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esEntryPoint) {
  main().catch((err) => {
    console.error("Error al configurar la planilla:", err.message);
    process.exit(1);
  });
}
