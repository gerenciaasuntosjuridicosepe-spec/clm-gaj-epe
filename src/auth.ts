import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios-provider";
import { RolId } from "@/lib/types";
import type { RolAlquileresId } from "@/lib/alquileres/tipos";
import { comoRolAlquileres, puedeIniciarSesion, tieneAccesoARuta } from "@/lib/acceso-modulo";

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
  providers: [Google],
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
