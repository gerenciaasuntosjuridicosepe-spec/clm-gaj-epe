import { defineConfig } from "vitest/config";
import path from "node:path";

const __dirname = import.meta.dirname;

/**
 * Config de Vitest (F0-6: el CLM no tenía ningún framework de pruebas).
 * Pruebas puras de Node, sin DOM — las reglas de negocio de Alquileres
 * (src/lib/alquileres/**) son funciones puras y no necesitan jsdom. Si más
 * adelante se agregan pruebas de componentes React, se suma `environment:
 * "jsdom"` por archivo con un comentario `// @vitest-environment jsdom`,
 * no se cambia el default acá (mantiene las pruebas de reglas rápidas).
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
