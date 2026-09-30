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
 */
import { config } from "dotenv";
import { JWT } from "google-auth-library";

config({ path: ".env.local" });

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

// Esquema — debe reflejar exactamente src/lib/data/sheets-schema.ts.
const HOJAS = {
  Contratos: [
    "id",
    "numero_expediente_vinculado",
    "area_solicitante",
    "documento",
    "tipo_contrato",
    "objeto",
    "contraparte_razon_social",
    "contraparte_identificacion",
    "adenda_de_id",
    "estado_aprobacion_solicitud",
    "fecha_limite_plazo_prudencial",
    "respaldo_en_expediente",
    "link_seguimiento_modelo",
    "link_texto_final",
    "link_pdf",
    "abogado_a_cargo",
    "fecha_dictamen_legal",
    "responsable_analisis_financiero",
    "fecha_analisis_financiero",
    "numero_resolucion",
    "sector_emisor",
    "fecha_firma",
    "link_instrumento_word",
    "link_contrato_firmado_escaneado",
    "fecha_inicio_vigencia",
    "fecha_fin_vigencia",
    "monto_total",
    "moneda",
    "responsable_seguimiento",
    "estado_contrato",
    "clausula_prorroga",
    "clausula_rescision",
    "plazo_rescision_dias",
    "clausula_penalidad",
    "etapa_actual",
    "gerencia_responsable",
  ],
  Historial: ["contrato_id", "fecha", "usuario", "rol", "descripcion"],
  Hitos: ["contrato_id", "tipo", "fecha", "descripcion", "monto"],
  Anotaciones: ["contrato_id", "fecha", "tipo", "observaciones", "usuario"],
  Garantias: ["contrato_id", "id", "tipo", "descripcion", "fecha_presentacion"],
  Sectores: ["id", "nombre"],
  TiposContrato: ["nombre", "sector_asignado_id"],
  TiposAnotacion: ["nombre"],
  TiposGarantia: ["nombre"],
  Usuarios: ["id", "nombre", "rol_id", "area", "email"],
};

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function main() {
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

main().catch((err) => {
  console.error("Error al configurar la planilla:", err.message);
  process.exit(1);
});
