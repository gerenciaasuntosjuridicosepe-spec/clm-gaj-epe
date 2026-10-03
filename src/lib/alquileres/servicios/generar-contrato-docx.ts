/**
 * RF-25/26/27 — Generación de un borrador de contrato en .docx, en el
 * servidor, sin Google Docs/Drive.
 *
 * Decisión 2026-10-03 (ver docs/DECISIONES.md): el PRD v2.1 pedía generarlo
 * copiando una plantilla de Google Docs vía API (corrigiendo el hallazgo 13:
 * AutoCrat solo mapeaba un locador). Carlos eligió en cambio construirlo
 * server-side con la librería `docx` (MIT, sin dependencias con
 * vulnerabilidades — ver `npm audit` en el commit de esta decisión), porque:
 *  - El bloque de locadores ya viene aplanado a un solo string por
 *    `armarBloqueLocadores()` (reglas/datos-plantilla.ts) — no hace falta
 *    resolver "repetir una sección", que es lo que de verdad complicaba la
 *    integración con Docs.
 *  - Evita cualquier scope/cuota nuevo de Google (Docs API, Drive API) y es
 *    100% testeable offline, igual que el resto del módulo.
 *  - El documento SIEMPRE necesita una revisión humana después (las dos
 *    cláusulas legales de IVA/actualización no se inventan — PENDIENTES-
 *    HUMANOS.md punto 10), así que perder la edición "en vivo" de un Google
 *    Doc es un costo menor: el abogado va a abrir el archivo igual.
 *
 * No se persiste como fila de DOCUMENTOS (no hay "origen: GENERADO" todavía,
 * a propósito — ver el comentario en la ruta de API de este mismo borrador):
 * se genera de nuevo cada vez que se pide, a partir de los datos actuales.
 * Si el abogado quiere adjuntarlo al expediente, lo sube a su Drive y usa el
 * flujo ya existente (RF-28, `POST .../documentos` con un link real).
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { armarValoresPlantillaContrato, type ParametrosValoresPlantilla } from "../reglas/datos-plantilla";
import { ETIQUETAS_PLANTILLA_SEED } from "../catalogos/etiquetas-plantilla-seed";

const MARCA_A_COMPLETAR = "— A COMPLETAR POR EL ÁREA LEGAL —";

/**
 * Las dos etiquetas de redacción legal (ver comentario de arriba) nunca
 * tienen contenido inventado: si vienen vacías (`"—"`, el placeholder que ya
 * devuelve `armarValoresPlantillaContrato`), se muestran con una marca
 * visible en el documento, no con el placeholder crudo ni con texto legal
 * fabricado.
 */
const ETIQUETAS_LEGALES = new Set(["CONDICION_IVA", "REGLA_ACTUALIZACION"]);

function valorVisible(etiqueta: string, valor: string): string {
  if (ETIQUETAS_LEGALES.has(etiqueta) && valor === "—") return MARCA_A_COMPLETAR;
  return valor;
}

/**
 * Arma el .docx completo (un párrafo por etiqueta de `ETIQUETAS_PLANTILLA_SEED`,
 * en su orden, con el nombre legible como título y el valor armado debajo) y
 * lo devuelve como `Buffer`, listo para servir como descarga.
 *
 * Es deliberadamente un documento estructurado simple (no una redacción
 * contractual real) — el contenido legal de fondo lo redacta GAJ fuera de
 * esta app; esto solo evita que alguien tenga que copiar a mano los 10
 * datos desde el sistema a un documento en blanco.
 */
export async function generarContratoDocx(
  params: ParametrosValoresPlantilla,
  meta: { actuacionId: string; tipoActuacion: string }
): Promise<Buffer> {
  const valores = armarValoresPlantillaContrato(params);

  const parrafos: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(`BORRADOR — ${meta.tipoActuacion} ${meta.actuacionId}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Documento generado automáticamente por el CLM — Gestión de Alquileres. Revisar y completar antes de enviar.",
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const etiqueta of ETIQUETAS_PLANTILLA_SEED) {
    const clave = etiqueta.etiqueta.replace(/[{}]/g, "");
    parrafos.push(
      new Paragraph({
        children: [new TextRun({ text: etiqueta.contenido, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun(valorVisible(clave, valores[clave] ?? "—"))],
      }),
      new Paragraph({ text: "" })
    );
  }

  const doc = new Document({ sections: [{ children: parrafos }] });
  return Packer.toBuffer(doc);
}
