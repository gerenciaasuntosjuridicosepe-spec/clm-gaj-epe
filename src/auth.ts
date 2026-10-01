import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios-provider";
import { RolId } from "@/lib/types";
import type { RolAlquileresId } from "@/lib/alquileres/tipos";
import { comoRolAlquileres, puedeIniciarSesion, tieneAccesoARuta } from "@/lib/acceso-modulo";

/**
 * Bypass de login SOLO para desarrollo local (sección 6.2 del encargo: "una
 * sesión de prueba exclusiva para NODE_ENV=development ... claramente
 * deshabilitada/imposible en producción"). Sin credenciales de Google
 * OAuth en este worktree (no hay `.env.local`), el botón "Continuar con
 * Google" de /login no puede completarse — este proveedor permite elegir
 * cualquier email ya cargado en Usuarios (mock) y entrar como esa persona,
 * para poder probar el módulo de punta a punta en `npm run dev`.
 *
 * Por qué es imposible que esto se cuele a producción, con dos barreras
 * independientes (no solo una, por si una falla):
 *  1. El array `providers` ni siquiera INCLUYE este proveedor cuando
 *     `NODE_ENV === "production"` — no es una cuestión de esconder el
 *     botón en la UI, el endpoint de NextAuth para este proveedor
 *     (`/api/auth/callback/dev-bypass`) no existe en absoluto en ese build.
 *  2. Aunque alguien lo reactivara a mano en producción, `authorize()`
 *     vuelve a chequear `NODE_ENV` y devuelve `null` (login rechazado) —
 *     defensa en profundidad, igual patrón que `exigirMockPermitido`
 *     (F0-4, `src/lib/data/entorno.ts`).
 * No depende de ninguna variable de entorno adicional que alguien pudiera
 * dejar cargada por error en Vercel: usa el mismo `NODE_ENV` que ya fija
 * Next.js automáticamente según el comando (`next dev` vs. `next build`).
 */
function proveedorDevBypass(): Provider | null {
  if (process.env.NODE_ENV === "production") return null;
  return Credentials({
    id: "dev-bypass",
    name: "Email de prueba (solo desarrollo)",
    credentials: { email: { label: "Email", type: "email" } },
    async authorize(credentials) {
      if (process.env.NODE_ENV === "production") return null; // barrera 2 (ver comentario de arriba)
      const email = typeof credentials?.email === "string" ? credentials.email : undefined;
      if (!email) return null;
      const usuario = await buscarUsuarioPorEmail(email);
      if (!usuario || !puedeIniciarSesion(usuario)) return null;
      return { id: usuario.id, email: usuario.email, name: usuario.nombre };
    },
  });
}

const devBypass = proveedorDevBypass();
const providers = devBypass ? [Google, devBypass] : [Google];

declare module "next-auth" {
  interface Session {
    user: {
      /**
       * Rol del CLM. Puede ser `undefined`: D12/D3 (PRD v2.1 sección 4)
       * permite un usuario que solo tiene rol en el módulo de Alquileres,
       * sin rol del CLM — ese usuario inicia sesión igual (D12: "Acceso a
       * la app = existir en Usuarios y tener rol en al menos un módulo"),
       * pero no puede acceder a páginas del CLM (ver src/auth.ts,
       * callback `authorized`, y src/app/sin-acceso/page.tsx).
       */
      rolId?: RolId;
      /** NUEVO (D3): rol en el módulo de Alquileres, independiente del rol del CLM. `undefined` = sin acceso al módulo. */
      rolAlquileres?: RolAlquileresId;
      usuarioId: string;
    } & import("next-auth").DefaultSession["user"];
  }
}

/**
 * Nota: no se amplía el tipo `JWT` de `next-auth/jwt` (el subpath da
 * "module cannot be found" bajo moduleResolution "bundler" en esta versión
 * beta) — se guardan `rolId`/`usuarioId` en el token igual, solo sin tipado
 * fuerte ahí, y se recupera el tipo correcto recién en `session.user`
 * (que sí está augmentado arriba).
 */
type TokenConRol = { rolId?: RolId; rolAlquileres?: RolAlquileresId; usuarioId?: string; name?: string | null };

/**
 * Login con Google (Auth.js) — resuelve identidad, no rol. El rol siempre
 * sale de la tabla de Usuarios (`buscarUsuarioPorEmail`, mock o Sheets según
 * esté configurado): si el email autenticado por Google no está en esa
 * tabla, se rechaza el acceso en `signIn` aunque el login de Google haya
 * sido válido (es el mecanismo de autorización mientras no haya SSO
 * corporativo — cuentas Gmail sueltas, sin restricción de dominio).
 *
 * Sesión con estrategia `jwt` (no hay base de datos propia: el storage es
 * Sheets/mock) — esto además permite validar la sesión en `middleware.ts`
 * sin tocar Sheets desde el edge.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const usuario = await buscarUsuarioPorEmail(user.email);
      return puedeIniciarSesion(usuario);
    },
    async jwt({ token, user }) {
      const t = token as TokenConRol;
      if (user?.email) {
        const usuario = await buscarUsuarioPorEmail(user.email);
        if (usuario) {
          // rolId ahora puede faltar (usuario solo de Alquileres, D12) — no
          // se asigna si viene vacío, para no inventar un RolId inválido.
          t.rolId = usuario.rolId ? (usuario.rolId as RolId) : undefined;
          t.rolAlquileres = comoRolAlquileres(usuario.rolAlquileres);
          t.usuarioId = usuario.id;
          t.name = usuario.nombre;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as TokenConRol;
      if (t.rolId) session.user.rolId = t.rolId;
      if (t.rolAlquileres) session.user.rolAlquileres = t.rolAlquileres;
      if (t.usuarioId) session.user.usuarioId = t.usuarioId;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const logueado = Boolean(auth?.user);
      const enLogin = nextUrl.pathname.startsWith("/login");
      if (enLogin) return logueado ? Response.redirect(new URL("/", nextUrl)) : true;
      if (!logueado) return false;

      // T19 (PRD v2.1): un usuario sin rol del módulo que corresponde a la
      // ruta no debe poder ver esa página — en vez de dejar que cada
      // página del CLM (que hoy no hace este chequeo, ver nota de
      // docs/DECISIONES.md) reciba un rolId/rolAlquileres undefined y
      // falle de forma menos prolija, se corta acá, antes de renderizar
      // nada, con un redirect a una pantalla explicativa.
      const enSinAcceso = nextUrl.pathname.startsWith("/sin-acceso");
      if (enSinAcceso) return true; // evita loop de redirects

      if (!tieneAccesoARuta(nextUrl.pathname, auth?.user)) {
        return Response.redirect(new URL("/sin-acceso", nextUrl));
      }

      return true;
    },
  },
});
