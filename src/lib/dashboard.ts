/**
 * Dashboard del módulo de Contratos (CLM) — agregación pura sobre la lista
 * de contratos que el rol ya puede ver (`listarVisibles`, mismo alcance
 * que el resto de las páginas del CLM). Ninguna cuenta se calcula "a mano"
 * en el JSX; la página solo llama a esto y pinta el resultado.
 *
 * A pedido de Carlos (2026-10-12): agregar un dashboard al módulo de
 * Contratos, con los KPIs y gráficos que mejor correspondan — elegidos a
 * partir de lo que ya existe en el modelo (etapas, estado de vigencia,
 * plazo prudencial, hitos de vencimiento) para no inventar métricas sin
 * respaldo en datos reales.
 */
import { ETAPAS_ORDEN, type Contrato, type EtapaId } from "./types";
import { diasRestantes, nivelSemaforo, type NivelSemaforo } from "./fechas";

export interface ResumenDashboardContratos {
  total: number;
  vigentes: number;
  vencidos: number;
  prorroga: number;
  rescindidos: number;
  solicitudesPendientes: number;
  plazoPrudencialVencido: number;
}

export interface ItemPorEtapa {
  etapa: EtapaId;
  label: string;
  cantidad: number;
}

export interface ItemPorTipo {
  tipoContrato: string;
  cantidad: number;
}

export interface ItemVencimientoPorMesContrato {
  /** yyyy-mm */
  mes: string;
  cantidad: number;
}

export interface SegmentoSemaforoContratos {
  nivel: NivelSemaforo;
  cantidad: number;
}

export function calcularDashboardContratos(
  contratos: Contrato[],
  hoy: string
): {
  resumen: ResumenDashboardContratos;
  contratosPorEtapa: ItemPorEtapa[];
  contratosPorTipo: ItemPorTipo[];
  vencimientosPorMes: ItemVencimientoPorMesContrato[];
  semaforoVigencia: SegmentoSemaforoContratos[];
} {
  const resumen: ResumenDashboardContratos = {
    total: contratos.length,
    vigentes: 0,
    vencidos: 0,
    prorroga: 0,
    rescindidos: 0,
    solicitudesPendientes: 0,
    plazoPrudencialVencido: 0,
  };

  const conteoPorEtapa = new Map<EtapaId, number>();
  const conteoPorTipo = new Map<string, number>();
  const conteoPorNivel = new Map<NivelSemaforo, number>();
  const vencimientosEnVentana: string[] = [];

  for (const c of contratos) {
    if (c.estadoContrato === "Vigente") resumen.vigentes++;
    else if (c.estadoContrato === "Vencido") resumen.vencidos++;
    else if (c.estadoContrato === "Prórroga") resumen.prorroga++;
    else if (c.estadoContrato === "Rescindido") resumen.rescindidos++;

    if (c.estadoAprobacionSolicitud === "Pendiente") {
      resumen.solicitudesPendientes++;
      if (c.fechaLimitePlazoPrudencial && c.fechaLimitePlazoPrudencial < hoy) resumen.plazoPrudencialVencido++;
    }

    conteoPorEtapa.set(c.etapaActual, (conteoPorEtapa.get(c.etapaActual) ?? 0) + 1);
    conteoPorTipo.set(c.tipoContrato, (conteoPorTipo.get(c.tipoContrato) ?? 0) + 1);

    // Semáforo: contratos cuya vigencia sigue en curso (Vigente/Prórroga). Sin fecha_fin_vigencia cargada
    // cae en "gris" (nivelSemaforo ya lo hace con dias=null) — es dato real faltante, no se inventa una fecha.
    if (c.estadoContrato === "Vigente" || c.estadoContrato === "Prórroga") {
      const nivel = nivelSemaforo(diasRestantes(c.fechaFinVigencia));
      conteoPorNivel.set(nivel, (conteoPorNivel.get(nivel) ?? 0) + 1);
      if (c.fechaFinVigencia) vencimientosEnVentana.push(c.fechaFinVigencia);
    }
  }

  const contratosPorEtapa: ItemPorEtapa[] = ETAPAS_ORDEN.map((e) => ({
    etapa: e.id,
    label: e.label,
    cantidad: conteoPorEtapa.get(e.id) ?? 0,
  }));

  const contratosPorTipo: ItemPorTipo[] = Array.from(conteoPorTipo, ([tipoContrato, cantidad]) => ({ tipoContrato, cantidad })).sort(
    (a, b) => b.cantidad - a.cantidad
  );

  const anioHoy = Number(hoy.slice(0, 4));
  const mesHoy = Number(hoy.slice(5, 7)); // 1-12
  const vencimientosPorMes: ItemVencimientoPorMesContrato[] = Array.from({ length: 12 }, (_, i) => {
    const total = mesHoy - 1 + i;
    const anio = anioHoy + Math.floor(total / 12);
    const mes = (total % 12) + 1;
    const clave = `${anio}-${String(mes).padStart(2, "0")}`;
    const cantidad = vencimientosEnVentana.filter((v) => v.slice(0, 7) === clave).length;
    return { mes: clave, cantidad };
  });

  const semaforoVigencia: SegmentoSemaforoContratos[] = (["verde", "amarillo", "rojo", "gris"] as const).map((nivel) => ({
    nivel,
    cantidad: conteoPorNivel.get(nivel) ?? 0,
  }));

  return { resumen, contratosPorEtapa, contratosPorTipo, vencimientosPorMes, semaforoVigencia };
}
