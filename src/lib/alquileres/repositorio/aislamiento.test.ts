import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * T26 — "El repositorio de Alquileres intenta leer o escribir en la
 * planilla del CLM, y viceversa. La prueba automática falla: cada
 * repositorio solo opera sobre su planilla." Esta prueba cubre la mitad de
 * Alquileres: análisis estático de todo el código de
 * `src/lib/alquileres/repositorio/` para confirmar que:
 *   (a) ningún archivo importa nada de `src/lib/data/*` (el código del
 *       repositorio del CLM) — aislamiento de código, no solo de datos;
 *   (b) ningún archivo menciona `GOOGLE_SHEETS_SPREADSHEET_ID` (la variable
 *       de entorno de la planilla del CLM) — solo puede usar
 *       `GOOGLE_SHEETS_ALQUILERES_ID`.
 *
 * La mitad complementaria (que el repositorio del CLM no lea la planilla
 * de Alquileres) ya está satisfecha por construcción: `google-sheets-client.ts`
 * del CLM solo conoce `GOOGLE_SHEETS_SPREADSHEET_ID` y no importa nada de
 * `src/lib/alquileres/*` — un grep rápido lo confirma también acá, para que
 * quede como regresión automática y no solo como hecho observado una vez.
 */
const RAIZ = path.resolve(__dirname); // src/lib/alquileres/repositorio

function archivosTs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".test.ts"))
    .map((e) => path.join(dir, e.name));
}

describe("Aislamiento de planillas CLM / Alquileres (T26)", () => {
  const archivos = archivosTs(RAIZ);

  it("encuentra archivos de implementación para analizar", () => {
    expect(archivos.length).toBeGreaterThan(0);
  });

  it.each(archivos.map((a) => [path.basename(a), a] as const))(
    "%s no importa nada de src/lib/data/* (código del CLM)",
    (_nombre, archivo) => {
      const contenido = fs.readFileSync(archivo, "utf8");
      const importaDelClm = /from\s+["']@\/lib\/data\//.test(contenido) || /from\s+["'](\.\.\/)+lib\/data\//.test(contenido);
      expect(importaDelClm, `${archivo} no debería importar nada de src/lib/data/* (T26)`).toBe(false);
    }
  );

  it.each(archivos.map((a) => [path.basename(a), a] as const))(
    "%s no LEE process.env.GOOGLE_SHEETS_SPREADSHEET_ID (variable de la planilla del CLM)",
    (_nombre, archivo) => {
      // Chequea el acceso real en tiempo de ejecución (`process.env.X` / `getEnv("X")`),
      // no una mención textual cualquiera — un comentario que explique "nunca uses
      // la variable del CLM" (como este mismo archivo) no debe hacer fallar la prueba.
      const contenido = fs.readFileSync(archivo, "utf8");
      const leeVariableDelClm = /(?:process\.env\.|getEnv\(\s*["'])GOOGLE_SHEETS_SPREADSHEET_ID/.test(contenido);
      expect(leeVariableDelClm, `${archivo} no debería leer GOOGLE_SHEETS_SPREADSHEET_ID (T26)`).toBe(false);
    }
  );

  it("el cliente de Sheets del CLM no importa nada de src/lib/alquileres/* ni lee GOOGLE_SHEETS_ALQUILERES_ID", () => {
    const archivoClm = path.resolve(RAIZ, "../../data/google-sheets-client.ts");
    const contenido = fs.readFileSync(archivoClm, "utf8");
    expect(/from\s+["']@\/lib\/alquileres\//.test(contenido)).toBe(false);
    expect(/(?:process\.env\.|getEnv\(\s*["'])GOOGLE_SHEETS_ALQUILERES_ID/.test(contenido)).toBe(false);
  });
});
