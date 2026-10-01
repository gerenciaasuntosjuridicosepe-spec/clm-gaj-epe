import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { listarRutasApi, importarHandlers } from "@/lib/test-utils/recorrer-rutas-api";

/**
 * F0-1 (hallazgo crítico): ninguna ruta de `/api/*` del CLM puede responder
 * datos a una petición anónima. Esta prueba recorre TODOS los `route.ts` de
 * `src/app/api/**` (salvo el propio handler de NextAuth, que es
 * intencionalmente público — es el mecanismo de login) e invoca cada método
 * HTTP exportado simulando que no hay sesión (`auth()` resuelve `null`).
 * Si algún handler no empieza por `requerirSesion()`/`requerirAdmin()`, va a
 * devolver 200 (o cualquier otra cosa que no sea 401/403) con datos, y la
 * prueba falla — así es como el equivalente de RF-42/T18 para el CLM
 * existente queda automatizado, no solo documentado.
 *
 * Antes de este commit, esta prueba fallaba en 2 rutas:
 *   - GET /api/contratos
 *   - GET /api/contratos/[id]
 * (ninguna de las dos llamaba a requerirSesion()).
 */
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const RUTAS_PUBLICAS_A_PROPOSITO = ["/api/auth/[...nextauth]"];

function fakeRequest(metodo: string): NextRequest {
  return new NextRequest("http://localhost/api/prueba-guardia", {
    method: metodo,
    ...(metodo === "GET" || metodo === "DELETE" ? {} : { body: JSON.stringify({}) }),
  });
}

const paramsFake = () =>
  Promise.resolve({ id: "id-inexistente", garantiaId: "garantia-inexistente" });

describe("Guardia de sesión en rutas de API (F0-1, RF-42, T18)", () => {
  const rutas = listarRutasApi().filter((r) => !RUTAS_PUBLICAS_A_PROPOSITO.includes(r.rutaUrl));

  it("encuentra al menos las rutas conocidas del CLM", () => {
    expect(rutas.length).toBeGreaterThanOrEqual(8);
  });

  for (const ruta of rutas) {
    it(`${ruta.rutaUrl}: cada método responde 401/403 sin sesión`, async () => {
      const handlers = await importarHandlers(ruta.archivo);
      const metodos = Object.keys(handlers);
      expect(metodos.length, `Esperaba al menos un handler exportado en ${ruta.archivo}`).toBeGreaterThan(0);

      for (const metodo of metodos) {
        const handler = handlers[metodo as keyof typeof handlers] as (
          req: NextRequest,
          ctx: { params: Promise<Record<string, string>> }
        ) => Promise<Response>;

        const respuesta = await handler(fakeRequest(metodo), { params: paramsFake() });
        expect(
          [401, 403].includes(respuesta.status),
          `${ruta.rutaUrl} [${metodo}] respondió ${respuesta.status} sin sesión — falta requerirSesion()/requerirAdmin().`
        ).toBe(true);
      }
    });
  }
});
