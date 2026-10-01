import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * F0-4: `register()` debe impedir que el servidor termine de arrancar en
 * producción sin Google Sheets configurado — es la barrera principal
 * (la segunda es `exigirMockPermitido`, ver entorno.test.ts).
 */
describe("instrumentation.register() (F0-4)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/data/google-sheets-client");
    vi.resetModules();
  });

  it("en producción sin Sheets configurado, lanza y no deja arrancar", async () => {
    vi.doMock("@/lib/data/google-sheets-client", () => ({
      googleSheetsConfigurado: () => false,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    vi.resetModules();
    const { register } = await import("./instrumentation");
    await expect(register()).rejects.toThrow(/F0-4/);
  });

  it("en producción con Sheets configurado, no lanza", async () => {
    vi.doMock("@/lib/data/google-sheets-client", () => ({
      googleSheetsConfigurado: () => true,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    vi.resetModules();
    const { register } = await import("./instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("fuera de producción no lanza aunque falte Sheets", async () => {
    vi.doMock("@/lib/data/google-sheets-client", () => ({
      googleSheetsConfigurado: () => false,
    }));
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    vi.resetModules();
    const { register } = await import("./instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("en runtime edge no evalúa nada (no aplica a ese runtime)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "edge");

    vi.resetModules();
    const { register } = await import("./instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });
});
