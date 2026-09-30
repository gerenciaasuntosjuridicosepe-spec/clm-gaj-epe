"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_SECTORES, MOCK_ASIGNACION_SECTOR, MOCK_TIPOS_CONTRATO } from "@/lib/data/mock-catalogos";

/**
 * Biblioteca de sectores emisores de Acto Administrativo — PRD sección 4.3.
 * Único punto del flujo de aprobación que varía según el Tipo de contrato
 * (sección 6.2). La carga real de esta asignación es tarea de Jurídicos una
 * vez construido el sistema (PRD, tabla de resolución de puntos abiertos).
 */
export default function SectoresPage() {
  return (
    <AppShell titulo="Biblioteca de sectores">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Biblioteca de sectores</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Asignación de sector/Directorio que emite el Acto Administrativo, por Tipo de contrato (PRD 4.3)
      </p>

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <h3 className="mb-3 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          Sectores/Directorio dados de alta
        </h3>
        <div className="flex flex-wrap gap-2">
          {MOCK_SECTORES.map((s) => (
            <Badge key={s.id} variant="blue">{s.nombre}</Badge>
          ))}
          <Button size="xs" variant="ghost">+ Agregar sector</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            Asignación por tipo de contrato
          </h3>
        </div>
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">Tipo de contrato</th>
              <th className="px-3.5 py-2.5">Sector/Directorio emisor</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {MOCK_TIPOS_CONTRATO.map((t) => {
              const sectorId = MOCK_ASIGNACION_SECTOR[t];
              const sector = MOCK_SECTORES.find((s) => s.id === sectorId);
              return (
                <tr key={t} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-medium">{t}</td>
                  <td className="px-3.5 py-2.5">
                    {sector ? <Badge variant="blue">{sector.nombre}</Badge> : <Badge variant="warning">Sin asignar</Badge>}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Button size="xs" variant="ghost">Editar</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
