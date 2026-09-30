import type { Metadata } from "next";
import "./globals.css";
import { RolProvider } from "@/lib/session";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "CLM · Gerencia de Asuntos Jurídicos — EPE",
  description: "Sistema de Gestión del Ciclo de Vida de Contratos",
};

/**
 * Nota: las fuentes (Barlow / Barlow Condensed, sección 1.2 del design
 * system) se cargan por <link> estándar en vez de next/font/google a
 * propósito: next/font intenta resolverlas en tiempo de build, lo que
 * rompe el build en entornos sin salida a fonts.googleapis.com. Con <link>
 * el navegador las pide en runtime, igual que en el preview HTML.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: no existe pages/_document.js, este <link> en el layout raíz es el patrón correcto. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <RolProvider session={session}>{children}</RolProvider>
      </body>
    </html>
  );
}
