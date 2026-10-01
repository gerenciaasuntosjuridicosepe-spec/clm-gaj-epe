import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * F0-4 (segunda barrera, defensa en profundidad): aunque `instrumentation.ts`
 * ya impide arrancar el server en producción sin Sheets configurado, el
 * provider de contratos también se niega a servir datos mock si de algún
 * modo se invoca en producción.
 */
describe("getContratosProvider — barrera de producción (F0-4)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("./google-sheets-client");
    vi.resetModules();
  });

  it("en producción sin Sheets configurado, lanza en vez de devolver el mock", async () => {
    vi.doMock("./google-sheets-client", () => ({
      googleSheetsConfigurado: () => false,
    }));
    vi.stubEnv("NODE_ENV", "production");

    vi.resetModules();
    const { getContratosProvider } = await import("./provider");
    expect(() => getContratosProvider()).toThrow(/producción/i);
  });

  it("fuera de producción sin Sheets configurado, devuelve el mock sin lanzar", async () => {
    vi.doMock("./google-sheets-client", () => ({
      googleSheetsConfigurado: () => false,
    }));
    vi.stubEnv("NODE_ENV", "development");

    vi.resetModules();
    const { getContratosProvider } = await import("./provider");
    expect(() => getContratosProvider()).not.toThrow();
  });
});
