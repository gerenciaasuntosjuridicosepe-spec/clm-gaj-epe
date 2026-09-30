"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/domain/alert";
import { Documento } from "@/lib/types";

const DOCUMENTOS: Documento[] = ["Contrato", "Convenio", "Acta Acuerdo", "Adenda"];

/**
 * Nueva solicitud — sección 4.2/8.1 del PRD: formulario de intake único,
 * común a todos los tipos de contrato en esta v1. Al enviar, hace un POST a
 * `/api/contratos` (Route Handler), que es quien realmente crea el registro
 * a través de `getContratosProvider()` — mock hoy, Google Sheets el día que
 * esté configurado, sin tocar este componente.
 *
 * `tiposContrato` viene del Server Component `page.tsx` (lee el catálogo
 * administrable en Administración > Tipos de contrato) — no es un array
 * fijo, así que un tipo agregado desde Admin aparece acá sin tocar código.
 */
export function NuevaSolicitudForm({ tiposContrato }: { tiposContrato: string[] }) {
  const [estado, setEstado] = React.useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensajeError, setMensajeError] = React.useState<string | null>(null);
  const [idCreado, setIdCreado] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // El navegador vacía `currentTarget` en cuanto termina de despachar el
    // evento — hay que guardar la referencia al form antes del `await`, no
    // leerla después (ahí ya es `null`, de ahí el error "reset" de null).
    const formEl = e.currentTarget;
    setEstado("enviando");
    setMensajeError(null);

    const form = new FormData(formEl);
    const payload = {
      areaSolicitante: String(form.get("areaSolicitante") ?? ""),
      documento: String(form.get("documento") ?? "") as Documento,
      tipoContrato: String(form.get("tipoContrato") ?? ""),
      objeto: String(form.get("objeto") ?? ""),
      contraparteRazonSocial: String(form.get("contraparteRazonSocial") ?? ""),
      contraparteIdentificacion: String(form.get("contraparteIdentificacion") ?? ""),
    };

    try {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status} al guardar la solicitud.`);
      }
      const creado = await res.json();
      setIdCreado(creado.id);
      setEstado("ok");
      formEl.reset();
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error inesperado al guardar la solicitud.");
      setEstado("error");
    }
  }

  return (
    <>
      {estado === "ok" && (
        <Alert variant="success">
          Solicitud <strong>{idCreado}</strong> guardada. El PDF de requerimiento se genera para adjuntar al expediente electrónico (paso manual, PRD 2.2).
        </Alert>
      )}
      {estado === "error" && <Alert variant="danger">{mensajeError}</Alert>}

      <form className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]" onSubmit={onSubmit}>
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Datos de la solicitud</h3>
        </div>
        <div className="p-4.5">
          <div className="mb-4.5 flex flex-wrap gap-3">
            <Field label="Área solicitante">
              <Select name="areaSolicitante" required defaultValue="">
                <option value="" disabled>Seleccionar…</option>
                <option>Distribución</option>
                <option>Grandes Clientes</option>
                <option>Administración</option>
              </Select>
            </Field>
            <Field label="Documento">
              <Select name="documento" required defaultValue="">
                <option value="" disabled>Seleccionar…</option>
                {DOCUMENTOS.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Tipo de contrato">
              <Select name="tipoContrato" required defaultValue="">
                <option value="" disabled>Seleccionar…</option>
                {tiposContrato.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>

          <div className="mb-4.5 flex flex-wrap gap-3">
            <Field label="Objeto / descripción breve" grow={2}>
              <Input name="objeto" required placeholder="Ej.: Provisión de transformadores de distribución" />
            </Field>
            <Field label="Contraparte (razón social)">
              <Input name="contraparteRazonSocial" required placeholder="Razón social" />
            </Field>
            <Field label="CUIT / DNI">
              <Input name="contraparteIdentificacion" required placeholder="20-XXXXXXXX-X" />
            </Field>
          </div>

          <Alert variant="info" className="mb-0">
            Al guardar se genera un PDF de requerimiento para adjuntar manualmente al expediente electrónico (sin integración automática, PRD sección 2.2).
          </Alert>

          <div className="mt-4.5 flex justify-end gap-2">
            <Button type="button" variant="ghost">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Guardando…" : "Guardar y generar PDF"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

function Field({ label, children, grow = 1 }: { label: string; children: React.ReactNode; grow?: number }) {
  return (
    <div className="min-w-[200px]" style={{ flexGrow: grow, flexBasis: 0 }}>
      <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
