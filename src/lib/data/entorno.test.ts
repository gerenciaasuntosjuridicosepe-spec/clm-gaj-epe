import { afterEach, describe, expect, it, vi } from "vitest";
import { exigirMockPermitido } from "./entorno";

/**
 * F0-4: ningún provider puede servir datos mock (incluida la cuenta real
 * embebida en MOCK_USUARIOS) si la app corre en producción sin Google
 * Sheets configurado.
 */
describe("exigirMockPermitido (F0-4)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no lanza fuera de producción", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => exigirMockPermitido("prueba")).not.toThrow();

    vi.stubEnv("NODE_ENV", "test");
    expect(() => exigirMockPermitido("prueba")).not.toThrow();
  });

  it("lanza en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => exigirMockPermitido("usuarios")).toThrow(/producción/i);
  });
});
