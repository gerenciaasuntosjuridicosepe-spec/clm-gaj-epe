/**
 * PARAMETROS (RF-37) tiene clave de negocio (`clave`, ej. "alicuota_iva"),
 * no un ID por secuencia — el repositorio genérico (`crearRepositorio()`)
 * SIEMPRE asigna el ID como el número de fila/contador de secuencia
 * (R1), así que no sirve para esta tabla tal cual (sobreescribiría
 * `clave` con algo como "PAR-0001"). Por eso PARAMETROS no tiene una
 * fábrica genérica, igual que LOG_CAMBIOS (ver `repositorio/log-cambios.ts`,
 * mismo motivo de fondo) — un módulo chico, dedicado a upsert-por-clave.
 *
 * Alcance de esta tarea (Fase 4): solo se necesita leer/escribir UN
 * parámetro nuevo, `ultimo_respaldo_en` (RF-39/A8) — así que esto NO es
 * un ABM general de PARAMETROS (RF-37 completo, con los parámetros ya
 * sembrados en `catalogos/parametros-seed.ts`, sigue leyéndose directo de
 * la semilla en el resto del código — ver nota en `docs/PROGRESO.md`).
 */
import { filaAObjeto, objetoAFila, PARAMETROS_COLUMNS, SHEET_NAMES } from "../esquema";
import { ahoraIso } from "../fechas";
import { neutralizarFormula } from "../reglas/validaciones";
import { obtenerTransporteHttpCompartido } from "../repositorio";
import { exigirMockPermitido } from "../repositorio/entorno";
import { registrarAlta, registrarCambiosDeActualizacion } from "../repositorio/log-cambios";
import type { Parametro } from "../tipos";

interface CacheGlobalParametros {
  __alquileresParametrosMock?: Map<string, Parametro>;
}
const cacheGlobal = globalThis as typeof globalThis & CacheGlobalParametros;

function getMock(): Map<string, Parametro> {
  if (!cacheGlobal.__alquileresParametrosMock) cacheGlobal.__alquileresParametrosMock = new Map();
  return cacheGlobal.__alquileresParametrosMock;
}

export async function obtenerParametro(clave: string): Promise<Parametro | undefined> {
  const transporte = obtenerTransporteHttpCompartido();
  if (transporte) {
    const filas = await transporte.leer(SHEET_NAMES.parametros);
    return filas.map((f) => filaAObjeto<Parametro>(PARAMETROS_COLUMNS, f)).find((p) => p.clave === clave);
  }
  return getMock().get(clave);
}

/** Upsert por clave (sin control de versión: tabla chica, de administración, igual criterio de riesgo aceptado que otras ventanas TOCTOU del módulo — ver docs/DECISIONES.md). Cada alta/edición queda en LOG_CAMBIOS (RF-38) igual que el resto del módulo. */
export async function guardarParametro(clave: string, valor: string, modificadoPor: string, descripcion?: string): Promise<Parametro> {
  const transporte = obtenerTransporteHttpCompartido();
  const existente = await obtenerParametro(clave);
  const ahora = ahoraIso();

  if (existente) {
    const actualizado: Parametro = { ...existente, valor, descripcion: descripcion ?? existente.descripcion, modificadoEn: ahora, modificadoPor, version: existente.version + 1 };
    if (transporte) {
      const filas = await transporte.leer(SHEET_NAMES.parametros);
      const idx = filas.map((f) => filaAObjeto<Parametro>(PARAMETROS_COLUMNS, f)).findIndex((p) => p.clave === clave);
      await transporte.actualizarFila(SHEET_NAMES.parametros, idx + 1, objetoAFila(PARAMETROS_COLUMNS, actualizado, neutralizarFormula));
    } else {
      exigirMockPermitido("PARAMETROS");
      getMock().set(clave, actualizado);
    }
    await registrarCambiosDeActualizacion("PARAMETROS", clave, modificadoPor, existente as unknown as Record<string, unknown>, actualizado as unknown as Record<string, unknown>, transporte);
    return actualizado;
  }

  const nuevo: Parametro = { clave, valor, descripcion, activo: true, creadoEn: ahora, creadoPor: modificadoPor, modificadoEn: ahora, modificadoPor, version: 1 };
  if (transporte) {
    await transporte.agregarFila(SHEET_NAMES.parametros, objetoAFila(PARAMETROS_COLUMNS, nuevo, neutralizarFormula));
  } else {
    exigirMockPermitido("PARAMETROS");
    getMock().set(clave, nuevo);
  }
  await registrarAlta("PARAMETROS", clave, modificadoPor, transporte);
  return nuevo;
}
