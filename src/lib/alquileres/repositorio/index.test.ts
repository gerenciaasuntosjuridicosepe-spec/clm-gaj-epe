import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColumnaDef } from "../esquema";

interface Cosa {
  cosaId: string;
  nombre: string;
  activo: boolean;
  creadoEn: string;
  creadoPor: string;
  modificadoEn: string;
  modificadoPor: string;
  version: number;
}

const COLUMNAS: ColumnaDef<Cosa>[] = [
  { key: "cosaId", header: "cosa_id", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "activo", header: "activo", tipo: "boolean" },
  { key: "creadoEn", header: "creado_en", tipo: "string" },
  { key: "creadoPor", header: "creado_por", tipo: "string" },
  { key: "modificadoEn", header: "modificado_en", tipo: "string" },
  { key: "modificadoPor", header: "modificado_por", tipo: "string" },
  { key: "version", header: "version", tipo: "number" },
];

describe("crearRepositorio (F0-4)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    // crearRepositorio() cachea instancias en globalThis a propósito (ver el
    // comentario en index.ts: Turbopack puede darle a cada "layer" su propio
    // módulo, pero globalThis es el mismo proceso real) — `vi.resetModules()`
    // limpia el registro de módulos, pero NO globalThis, así que hay que
    // borrar la caché a mano entre pruebas para no filtrar un repositorio ya
    // creado (con otro NODE_ENV) de una prueba a la siguiente.
    const g = globalThis as typeof globalThis & { __alquileresRepos?: unknown; __alquileresTransporteHttp?: unknown };
    delete g.__alquileresRepos;
    delete g.__alquileresTransporteHttp;
  });

  it("sin GOOGLE_SHEETS_ALQUILERES_ID configurado, devuelve el repositorio mock", async () => {
    vi.stubEnv("GOOGLE_SHEETS_ALQUILERES_ID", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { crearRepositorio } = await import("./index");
    const { RepositorioMock } = await import("./repositorio-mock");

    const repo = crearRepositorio<Cosa>({
      hojaDatos: "COSAS",
      hojaSecuencia: "SEQ_COS",
      prefijo: "COS",
      campoId: "cosaId",
      columnas: COLUMNAS,
      nombreTabla: "COSAS",
    });

    expect(repo).toBeInstanceOf(RepositorioMock);
  });

  it("en producción sin Sheets configurado, lanza en vez de devolver el mock (F0-4)", async () => {
    vi.stubEnv("GOOGLE_SHEETS_ALQUILERES_ID", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { crearRepositorio } = await import("./index");

    expect(() =>
      crearRepositorio<Cosa>({
        hojaDatos: "COSAS",
        hojaSecuencia: "SEQ_COS",
        prefijo: "COS",
        campoId: "cosaId",
        columnas: COLUMNAS,
        nombreTabla: "COSAS",
      })
    ).toThrow(/producción/i);
  });
});
