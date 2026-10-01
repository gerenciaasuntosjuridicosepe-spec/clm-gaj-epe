#!/usr/bin/env node
/**
 * Crea automáticamente las hojas y columnas que necesita el módulo de
 * Alquileres en una planilla de Google Sheets en blanco (o completa las que
 * falten en una que ya tenga datos — no borra ni pisa hojas existentes).
 * Además crea las hojas de secuencia (SEQ_ACT, SEQ_INM, ...), una por cada
 * prefijo de `PREFIJOS_ID` (sección 4 del PRD v2.1: "cada prefijo tiene una
 * hoja de secuencia donde la app agrega una fila").
 *
 * Uso:
 *   npm run setup:sheet:alquileres -- <SPREADSHEET_ID>
 * o, si ya está GOOGLE_SHEETS_ALQUILERES_ID en .env.local:
 *   npm run setup:sheet:alquileres
 *
 * Requiere las credenciales de la cuenta de servicio ya cargadas en
 * .env.local (la MISMA cuenta que usa el CLM — D11; la planilla es otra,
 * GOOGLE_SHEETS_ALQUILERES_ID, nunca GOOGLE_SHEETS_SPREADSHEET_ID del CLM).
 * Ver INSTRUCTIVO_CONFIGURACION.md y docs/PENDIENTES-HUMANOS.md punto 4.
 *
 * Mismo patrón que corrigió F0-2 en `scripts/setup-sheet.mjs`: las columnas
 * se IMPORTAN desde `src/lib/alquileres/esquema.ts` (fuente única), nunca se
 * duplican a mano acá. La prueba de coherencia T21-equivalente vive en
 * `scripts/setup-sheet-alquileres.test.ts`.
 *
 * Este script NUNCA debe ejecutarse de verdad contra Google real durante el
 * desarrollo autónomo (no hay credenciales en este worktree de todos modos):
 * solo se verifica que arranca y falla con el mensaje esperado de "faltan
 * credenciales" cuando se corre sin configurar nada.
 */
import { config } from "dotenv";
import { JWT } from "google-auth-library";
import { pathToFileURL } from "node:url";
import { ESQUEMA_TABLAS, SEQ_SHEET_NAMES } from "../src/lib/alquileres/esquema.ts";

config({ path: ".env.local" });

/**
 * Hoja -> columnas de las tablas de datos, construido a partir del esquema
 * (nunca a mano). Se exporta para que la prueba de coherencia pueda
 * importarlo sin disparar `main()` (ver el guard de entry-point al final).
 */
export const HOJAS = Object.fromEntries(
  Object.values(ESQUEMA_TABLAS).map(({ sheet, columns }) => [sheet, columns.map((c) => c.header)])
);

/** Hojas de secuencia (sin columnas de datos reales, una sola columna de marca de tiempo). */
export const HOJAS_SECUENCIA = Object.fromEntries(Object.values(SEQ_SHEET_NAMES).map((nombre) => [nombre, ["marca_tiempo"]]));

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function main() {
  const spreadsheetId = process.argv[2] ?? process.env.GOOGLE_SHEETS_ALQUILERES_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!spreadsheetId || !email || !privateKey) {
    console.error(
      "Faltan datos. Necesito GOOGLE_SHEETS_ALQUILERES_ID (o pasarlo como argumento), " +
        "GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY en .env.local.\n" +
        "Ver INSTRUCTIVO_CONFIGURACION.md y docs/PENDIENTES-HUMANOS.md punto 4."
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

  const todasLasHojas = { ...HOJAS, ...HOJAS_SECUENCIA };

  console.log(`Conectando a la planilla de Alquileres ${spreadsheetId}...`);
  const metaRes = await fetch(`${API_BASE}/${spreadsheetId}`, { headers });
  if (!metaRes.ok) throw new Error(`No se pudo leer la planilla: ${metaRes.status} ${await metaRes.text()}`);
  const meta = await metaRes.json();
  const existentes = new Set(meta.sheets.map((s) => s.properties.title));

  const faltantes = Object.keys(todasLasHojas).filter((nombre) => !existentes.has(nombre));

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

  for (const [nombre, columnas] of Object.entries(todasLasHojas)) {
    console.log(`Escribiendo encabezados en "${nombre}"...`);
    const res = await fetch(
      `${API_BASE}/${spreadsheetId}/values/${encodeURIComponent(`${nombre}!A1`)}?valueInputOption=RAW`,
      { method: "PUT", headers, body: JSON.stringify({ values: [columnas] }) }
    );
    if (!res.ok) throw new Error(`No se pudo escribir el encabezado de "${nombre}": ${res.status} ${await res.text()}`);
  }

  console.log("\nListo. La planilla de Alquileres ya tiene la estructura que espera el módulo.");
  console.log("Revisá que GOOGLE_SHEETS_ALQUILERES_ID en .env.local sea:", spreadsheetId);
}

// Solo corre main() si este archivo se ejecutó directamente (`node
// scripts/setup-sheet-alquileres.mjs`), no cuando una prueba lo importa para
// leer HOJAS/HOJAS_SECUENCIA (T21, ver setup-sheet-alquileres.test.ts) — así
// la prueba de coherencia no intenta conectarse a Google.
const esEntryPoint = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esEntryPoint) {
  main().catch((err) => {
    console.error("Error al configurar la planilla de Alquileres:", err.message);
    process.exit(1);
  });
}
