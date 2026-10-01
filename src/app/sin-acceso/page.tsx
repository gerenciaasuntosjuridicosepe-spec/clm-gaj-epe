import Image from "next/image";
import { auth, signOut } from "@/auth";

/**
 * Pantalla de "acceso no autorizado a este módulo" (T19, PRD v2.1): a
 * diferencia de /login (cuenta de Google no dada de alta en absoluto), acá
 * llega una cuenta que SÍ pudo iniciar sesión (tiene rol en al menos un
 * módulo, D12) pero intentó entrar a una página de un módulo al que no
 * tiene acceso — ej. un usuario solo de Alquileres entrando a /contratos, o
 * viceversa. El redirect lo hace `authorized()` en src/auth.ts.
 */
export default async function SinAccesoPage() {
  const session = await auth();

  return (
    <div className="flex min-h-full items-center justify-center bg-brand-blue-900 px-4">
      <div className="w-full max-w-[400px] rounded-[var(--radius-lg)] bg-white p-7 text-center shadow-[var(--shadow-lg)]">
        <Image src="/logo-gaj.png" alt="EPE" width={48} height={48} className="mx-auto rounded-md" />
        <div className="mt-3 font-[var(--font-display)] text-[var(--text-xl)] font-bold text-brand-blue-900">
          Acceso no autorizado a este módulo
        </div>
        <p className="mt-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          Tu cuenta ({session?.user?.email ?? "sin email"}) no tiene un rol asignado para la sección que intentaste
          abrir. Pedí a Administración que revise tu rol en Usuarios.
        </p>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-blue-500)] focus-visible:ring-offset-1"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
