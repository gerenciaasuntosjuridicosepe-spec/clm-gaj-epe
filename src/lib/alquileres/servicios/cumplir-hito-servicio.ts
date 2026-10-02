/**
 * Servicio compartido para "cumplir un hito + recalcular R13/R14" — extraído
 * de `[id]/hitos/route.ts` (RF-20) para que `[id]/comunicaciones/route.ts`
 * (RF-23/RF-24: "Marcar como enviado" también cumple un hito, H-01 o H-03)
 * pueda reusar exactamente la misma lógica en vez de duplicarla. Ninguna
 * regla nueva acá — solo orquesta `marcarHitoCumplido` (R13) y
 * `calcularEstadoDerivado` (R14), ya probadas cada una por separado.
 */
import { getRepositorioActuaciones } from "../datos/actuaciones";
import { getRepositorioActuacionHitos } from "../datos/actuacion-hitos";
import { marcarHitoCumplido } from "../reglas/rf20-cumplir-hito";
import { calcularEstadoDerivado, esEstadoManual } from "../reglas/r14-estado-derivado";
import { validarObligatoriosFormalizacion } from "../reglas/r4-obligatorios-formalizada";
import { CFG_HITOS_TIPO_SEED } from "../catalogos/hitos-seed";
import { hoy } from "../fechas";
import type { Actuacion, ActuacionHito } from "../tipos";

export interface ResultadoCumplirHito {
  ok: boolean;
  error?: string;
  hitos?: ActuacionHito[];
  actuacion?: Actuacion;
}

export async function cumplirHitoYRecalcularEstado(params: {
  actuacion: Actuacion;
  hitoId: string;
  fechaCumplimiento: string;
  referencia: string | undefined;
  emailUsuario: string;
}): Promise<ResultadoCumplirHito> {
  const { actuacion, hitoId, fechaCumplimiento, referencia, emailUsuario } = params;
  const id = actuacion.actuacionId;

  const todosLosHitos = await getRepositorioActuacionHitos().listar();
  const hitosDeLaActuacion = todosLosHitos.filter((h) => h.actuacionId === id);
  const cfgDelTipo = CFG_HITOS_TIPO_SEED.filter((c) => c.tipoActuacion === actuacion.tipoActuacion);

  const resultado = marcarHitoCumplido({
    hitos: hitosDeLaActuacion,
    hitoId,
    fechaCumplimiento,
    referencia,
    cfgHitosTipo: cfgDelTipo,
    feriados: [], // sin RF-36/pantalla de feriados todavía — R13 ya contempla este caso (cómputo aproximado).
    hoy: hoy(),
  });

  if (!resultado.valido) {
    return { ok: false, error: resultado.error };
  }

  // Persiste cada hito que cambió (el cumplido + los recalculados), con control de versión (T20).
  const hitosActualizadosCompletos: ActuacionHito[] = [];
  for (const cambios of resultado.hitosActualizados) {
    const actual = hitosDeLaActuacion.find((h) => h.hitoId === cambios.hitoId)!;
    const actualizado = await getRepositorioActuacionHitos().actualizar(
      actual.actuacionHitoId,
      { estadoHito: cambios.estadoHito, fechaPrevista: cambios.fechaPrevista, fechaCumplimiento: cambios.fechaCumplimiento, referencia: cambios.referencia },
      actual.version,
      emailUsuario
    );
    hitosActualizadosCompletos.push(actualizado);
  }

  // R14: recalcula el estado de la actuación según el nuevo estado de sus hitos — salvo que esté en un estado manual (DESISTIDA/NO_RENOVADO/ANULADA), que solo un ADMINISTRADOR reabre (no acá).
  let actuacionActualizada = actuacion;
  if (actuacion.tipoActuacion === "CONTRATO" && !esEstadoManual(actuacion.estadoActuacion)) {
    const hitosFinal = todosLosHitos
      .filter((h) => h.actuacionId === id)
      .map((h) => resultado.hitosActualizados.find((u) => u.hitoId === h.hitoId) ?? h);
    const cumplido = (hId: string) => hitosFinal.find((h) => h.hitoId === hId)?.estadoHito === "CUMPLIDO";
    const { valida: puedeFormalizar } = validarObligatoriosFormalizacion(actuacion);

    const nuevoEstado = calcularEstadoDerivado({
      tieneExpedienteAsignado: Boolean(actuacion.expedienteId),
      h01Cumplido: cumplido("H-01"),
      h05Cumplido: cumplido("H-05"),
      h15Cumplido: cumplido("H-15"),
      h20Cumplido: cumplido("H-20"),
      puedeFormalizar,
    });

    if (nuevoEstado !== actuacion.estadoActuacion) {
      actuacionActualizada = await getRepositorioActuaciones().actualizar(
        id,
        { estadoActuacion: nuevoEstado },
        actuacion.version,
        emailUsuario
      );
    }
  }

  return { ok: true, hitos: hitosActualizadosCompletos, actuacion: actuacionActualizada };
}
