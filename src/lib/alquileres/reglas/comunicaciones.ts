/**
 * RF-23/RF-24 [CAMBIO en v2.1] + M16 — "Marcar como enviado": el gestor
 * declara que ya envió el mail/la reiteración desde su casilla. Exige fecha
 * no futura; recién con eso se guarda ENVIADO y se cumple H-01 (T23).
 */

interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

/** T23: sin fecha, o con fecha futura, se rechaza — el hito que esa comunicación cumple sigue pendiente. */
export function validarMarcarComoEnviado(fechaEnvio: string | undefined, hoy: string): ResultadoValidacion {
  if (!fechaEnvio) {
    return { valida: false, error: "La fecha de envío es obligatoria para marcar como enviado." };
  }
  if (fechaEnvio > hoy) {
    return { valida: false, error: "La fecha de envío no puede ser futura." };
  }
  return { valida: true };
}
