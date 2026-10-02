/**
 * RF-38/M9 (+ M17, v2.1) — LOG_CAMBIOS: "cada alta, modificación o baja
 * guarda fecha, usuario, hoja, ID, campo, valor anterior y nuevo. Nadie
 * puede editarlo desde la app." M17 agrega: "además... registra conflictos
 * de versión."
 *
 * Hallazgo de esta tarea (Fase 4, RP-10 "Actividad y cambios"): el modelo
 * (`LogCambio` en `tipos.ts`) y el esquema (`LOG_CAMBIOS_COLUMNS` en
 * `esquema.ts`) existían desde Fase 1, pero NINGÚN alta/edición/baja
 * escribía ahí realmente — RF-38 (prioridad M) quedó sin implementar sin
 * que ninguna prueba lo detectara, porque ninguna prueba de Fase 1-3
 * verificaba el EFECTO SECUNDARIO de escribir en LOG_CAMBIOS, solo el
 * resultado directo de cada operación. Se corrige acá, conectado
 * GENÉRICAMENTE en `repositorio-mock.ts`/`repositorio-sheets.ts` (no en
 * cada ruta por separado, que es exactamente como se habría seguido
 * olvidando) — ver `docs/DECISIONES.md`.
 *
 * `LogCambio` no tiene `version`/`activo` (es un registro de solo
 * escritura, "nadie puede editarlo") — por eso no pasa por
 * `crearRepositorio()` (que exige esa forma); este módulo replica lo
 * mínimo de esa mecánica (secuencia de ID vía `SEQ_LOG`, mock en
 * `globalThis` o Sheets vía un transporte).
 *
 * Todas las funciones públicas aceptan un `transporte` EXPLÍCITO opcional
 * en vez de ir siempre a buscar el compartido de `obtenerTransporteHttpCompartido()`
 * — así `RepositorioSheets` (que puede construirse con cualquier
 * `TransporteSheets`, real o un fake de pruebas) siempre loguea contra SU
 * PROPIO transporte, no contra el compartido del proceso (que en una
 * prueba puede no ser el mismo, o ni existir). Si no se pasa nada
 * (uso normal desde un reporte, por ejemplo), cae al compartido/mock según
 * corresponda — igual que el resto del módulo.
 */
import { filaAObjeto, LOG_CAMBIOS_COLUMNS, objetoAFila, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { ahoraIso } from "../fechas";
import { neutralizarFormula } from "../reglas/validaciones";
import { PREFIJOS_ID, type AccionLog, type LogCambio } from "../tipos";
import { obtenerTransporteHttpCompartido } from "./index";
import { exigirMockPermitido } from "./entorno";
import type { TransporteSheets } from "./transporte-sheets";

interface CacheGlobalLogCambios {
  __alquileresLogCambiosMock?: LogCambio[];
  __alquileresLogCambiosContadorMock?: number;
}
const cacheGlobal = globalThis as typeof globalThis & CacheGlobalLogCambios;

function getMock(): LogCambio[] {
  if (!cacheGlobal.__alquileresLogCambiosMock) cacheGlobal.__alquileresLogCambiosMock = [];
  return cacheGlobal.__alquileresLogCambiosMock;
}

export interface EntradaLogCambio {
  usuarioEmail: string;
  accion: AccionLog;
  hoja: string;
  registroId: string;
  campo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivo?: string;
}

/** Agrega una entrada a LOG_CAMBIOS — nunca se actualiza ni se borra una ya escrita (RF-38: "nadie puede editarlo desde la app"). */
export async function registrarLogCambio(entrada: EntradaLogCambio, transporteExplicito?: TransporteSheets): Promise<LogCambio> {
  const transporte = transporteExplicito ?? obtenerTransporteHttpCompartido();
  const registro: LogCambio = { logId: "", fechaHora: ahoraIso(), ...entrada };

  if (transporte) {
    const { filaNumero } = await transporte.agregarFila(SEQ_SHEET_NAMES[PREFIJOS_ID.logCambio], [registro.fechaHora]);
    registro.logId = `${PREFIJOS_ID.logCambio}-${String(filaNumero).padStart(4, "0")}`;
    await transporte.agregarFila(SHEET_NAMES.logCambios, objetoAFila(LOG_CAMBIOS_COLUMNS, registro, neutralizarFormula));
  } else {
    exigirMockPermitido("LOG_CAMBIOS");
    cacheGlobal.__alquileresLogCambiosContadorMock = (cacheGlobal.__alquileresLogCambiosContadorMock ?? 0) + 1;
    registro.logId = `${PREFIJOS_ID.logCambio}-${String(cacheGlobal.__alquileresLogCambiosContadorMock).padStart(4, "0")}`;
    getMock().push(registro);
  }
  return registro;
}

/** RP-10 (Actividad y cambios) lee todo el historial — solo lectura, sin filtros acá (los aplica el reporte). */
export async function listarLogCambios(transporteExplicito?: TransporteSheets): Promise<LogCambio[]> {
  const transporte = transporteExplicito ?? obtenerTransporteHttpCompartido();
  if (transporte) {
    const filas = await transporte.leer(SHEET_NAMES.logCambios);
    return filas.map((fila) => filaAObjeto<LogCambio>(LOG_CAMBIOS_COLUMNS, fila));
  }
  return getMock();
}

/**
 * Compara dos versiones de un registro y arma las entradas de MODIFICACION
 * (una por campo cambiado, M9: "un registro por campo cambiado") — ignora
 * los campos de auditoría que SIEMPRE cambian en cualquier `actualizar()`
 * (`version`, `modificadoEn`, `modificadoPor`) porque loguearlos en cada
 * fila no aporta nada (ya está `fechaHora`/`usuarioEmail` en la propia
 * entrada de LOG_CAMBIOS).
 */
const CAMPOS_IGNORADOS = new Set(["version", "modificadoEn", "modificadoPor"]);

function aTexto(valor: unknown): string {
  if (valor === undefined || valor === null) return "";
  if (typeof valor === "boolean") return valor ? "TRUE" : "FALSE";
  return String(valor);
}

export function armarEntradasModificacion<T extends Record<string, unknown>>(
  anterior: T,
  nuevo: T,
  comun: { hoja: string; registroId: string; usuarioEmail: string; motivo?: string }
): EntradaLogCambio[] {
  const entradas: EntradaLogCambio[] = [];
  const claves = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
  for (const campo of claves) {
    if (CAMPOS_IGNORADOS.has(campo)) continue;
    const valorAnterior = aTexto(anterior[campo]);
    const valorNuevo = aTexto(nuevo[campo]);
    if (valorAnterior === valorNuevo) continue;
    entradas.push({ ...comun, accion: "MODIFICACION", campo, valorAnterior, valorNuevo });
  }
  return entradas;
}

/**
 * Orquesta el registro de una actualización completa: si el ÚNICO cambio
 * real es `activo` de `true` a `false`, es una baja lógica (RF-17) y se
 * registra como accion `BAJA` (una sola entrada) en vez de `MODIFICACION`
 * — distinción que pide la propia `AccionLog`. Cualquier otra combinación
 * de cambios se registra como una `MODIFICACION` por campo (M9). No
 * lanza si falla la escritura del log — una falla de auditoría nunca debe
 * tirar abajo la operación de negocio que la originó (se deja constancia
 * con `console.error` para que no desaparezca en silencio).
 */
export async function registrarCambiosDeActualizacion<T extends Record<string, unknown>>(
  hoja: string,
  registroId: string,
  usuarioEmail: string,
  anterior: T,
  nuevo: T,
  transporteExplicito?: TransporteSheets
): Promise<void> {
  try {
    const entradas = armarEntradasModificacion(anterior, nuevo, { hoja, registroId, usuarioEmail });
    const esBajaUnica = entradas.length === 1 && entradas[0].campo === "activo" && entradas[0].valorNuevo === "FALSE";
    if (esBajaUnica) {
      await registrarLogCambio({ ...entradas[0], accion: "BAJA" }, transporteExplicito);
      return;
    }
    for (const entrada of entradas) {
      await registrarLogCambio(entrada, transporteExplicito);
    }
  } catch (err) {
    console.error(`No se pudo registrar en LOG_CAMBIOS (${hoja}/${registroId}):`, err);
  }
}

/** Análogo para el alta (RF-38: "cada alta... guarda fecha, usuario, hoja, ID"). Una sola entrada, sin detalle de campos (M9: eso es para MODIFICACION). */
export async function registrarAlta(
  hoja: string,
  registroId: string,
  usuarioEmail: string,
  transporteExplicito?: TransporteSheets
): Promise<void> {
  try {
    await registrarLogCambio({ accion: "ALTA", hoja, registroId, usuarioEmail }, transporteExplicito);
  } catch (err) {
    console.error(`No se pudo registrar en LOG_CAMBIOS (${hoja}/${registroId}):`, err);
  }
}

/** M17: conflictos de versión también quedan en LOG_CAMBIOS. */
export async function registrarConflictoVersion(
  hoja: string,
  registroId: string,
  usuarioEmail: string,
  transporteExplicito?: TransporteSheets
): Promise<void> {
  try {
    await registrarLogCambio({ accion: "CONFLICTO_VERSION", hoja, registroId, usuarioEmail }, transporteExplicito);
  } catch (err) {
    console.error(`No se pudo registrar en LOG_CAMBIOS (${hoja}/${registroId}):`, err);
  }
}
