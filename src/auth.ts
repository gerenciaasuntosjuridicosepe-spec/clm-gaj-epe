import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios-provider";
import { RolId } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      rolId: RolId;
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
type TokenConRol = { rolId?: RolId; usuarioId?: string; name?: string | null };

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
      return Boolean(usuario);
    },
    async jwt({ token, user }) {
      const t = token as TokenConRol;
      if (user?.email) {
        const usuario = await buscarUsuarioPorEmail(user.email);
        if (usuario) {
          t.rolId = usuario.rolId as RolId;
          t.usuarioId = usuario.id;
          t.name = usuario.nombre;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as TokenConRol;
      if (t.rolId) session.user.rolId = t.rolId;
      if (t.usuarioId) session.user.usuarioId = t.usuarioId;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const logueado = Boolean(auth?.user);
      const enLogin = nextUrl.pathname.startsWith("/login");
      if (enLogin) return logueado ? Response.redirect(new URL("/", nextUrl)) : true;
      return logueado;
    },
  },
});
