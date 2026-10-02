/**
 * ERRORES — "pantalla de errores" (Fase 4, sección "Reportes y operación":
 * "...respaldo, pantalla de errores"). `ErrorRegistrado` (tipos.ts) es
 * deliberadamente mínimo (fecha_hora, función, mensaje — sin ID ni
 * `version`/`activo`): es un log de solo escritura, igual espíritu que
 * LOG_CAMBIOS pero más simple todavía (ni siquiera necesita secuencia de
 * ID — no hace falta direccionar una fila puntual después de escrita).
 *
 * Se alimenta automáticamente desde `src/instrumentation.ts`
 * (`onRequestError`, API estable desde Next 15 — ver
 * node_modules/next/dist/docs/.../instrumentation.md): CUALQUIER error no
 * capturado en una ruta de Alquileres queda registrado solo, sin que cada
 * ruta tenga que llamar nada a mano (mismo criterio de "cobertura
 * automática" que RF-42/T26 ya usan en este módulo).
 */
import { objetoAFila, filaAObjeto, ERRORES_COLUMNS, SHEET_NAMES } from "../esquema";
import { ahoraIso } from "../fechas";
import { neutralizarFormula } from "../reglas/validaciones";
import { obtenerTransporteHttpCompartido } from "./index";
import { exigirMockPermitido } from "./entorno";
import type { ErrorRegistrado } from "../tipos";

interface CacheGlobalErrores {
  __alquileresErroresMock?: ErrorRegistrado[];
}
const cacheGlobal = globalThis as typeof globalThis & CacheGlobalErrores;

function getMock(): ErrorRegistrado[] {
  if (!cacheGlobal.__alquileresErroresMock) cacheGlobal.__alquileresErroresMock = [];
  return cacheGlobal.__alquileresErroresMock;
}

/** No lanza nunca — un fallo registrando un error no puede convertirse en un segundo error que tape al primero. */
export async function registrarError(funcion: string, mensaje: string): Promise<void> {
  try {
    const registro: ErrorRegistrado = { fechaHora: ahoraIso(), funcion, mensaje };
    const transporte = obtenerTransporteHttpCompartido();
    if (transporte) {
      await transporte.agregarFila(SHEET_NAMES.errores, objetoAFila(ERRORES_COLUMNS, registro, neutralizarFormula));
    } else {
      exigirMockPermitido("ERRORES");
      getMock().push(registro);
    }
  } catch (err) {
    console.error("No se pudo registrar en ERRORES:", err);
  }
}

export async function listarErrores(): Promise<ErrorRegistrado[]> {
  const transporte = obtenerTransporteHttpCompartido();
  if (transporte) {
    const filas = await transporte.leer(SHEET_NAMES.errores);
    return filas.map((f) => filaAObjeto<ErrorRegistrado>(ERRORES_COLUMNS, f));
  }
  return getMock();
}
