export { auth as proxy } from "@/auth";

/**
 * Protege las páginas (redirige a /login si no hay sesión). Las rutas de
 * API quedan afuera del matcher a propósito: cada una valida su propia
 * sesión con `requerirSesion()`/`requerirAccesoEscritura()` (src/lib/auth-guard.ts)
 * y devuelve 401/403 en JSON — si dejáramos que el proxy también las
 * interceptara, un cliente que no sea el navegador de la app (un script,
 * un `curl`) recibiría un redirect HTML en vez de un error entendible.
 * La decisión de redirigir según haya o no sesión vive en el callback
 * `authorized` de src/auth.ts (compartido con el resto de la config).
 *
 * (Next.js 16 renombró el file convention "middleware" a "proxy" — mismo
 * mecanismo, nuevo nombre de archivo y de export.)
 */
export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico|logo-gaj.png).*)"],
};
