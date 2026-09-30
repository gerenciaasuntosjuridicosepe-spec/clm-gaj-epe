import { AnotacionSeguimiento, Contrato, GarantiaExigida, HitoContractual } from "../types";
import { ContratosProvider } from "./provider";
import { agregarFila, leerFilas, actualizarFila } from "./google-sheets-client";
import {
  SHEET_NAMES,
  CONTRATOS_COLUMNS,
  contratoAFila,
  filaAContrato,
  filaAEvento,
  eventoAFila,
  filaAHito,
  hitoAFila,
  filaAAnotacion,
  anotacionAFila,
  filaAGarantia,
  garantiaAFila,
} from "./sheets-schema";

/**
 * Implementación real de `ContratosProvider` sobre Google Sheets.
 *
 * Sigue exactamente la interfaz de `MockContratosProvider` (provider.ts):
 * ningún componente de la UI sabe ni le importa cuál de las dos está activa.
 * `getContratosProvider()` en provider.ts elige automáticamente esta
 * implementación en cuanto detecta las variables de entorno de Google
 * Sheets configuradas (ver `googleSheetsConfigurado()`).
 *
 * Limitaciones ya documentadas en el PRD (sección 7.1/8.2) y que esta
 * implementación NO resuelve porque son inherentes a elegir Sheets como
 * almacenamiento, no un bug de este código:
 *  - Sin bloqueo de fila real: dos escrituras simultáneas sobre el mismo
 *    contrato pueden pisarse. `actualizar()` relee la fila antes de escribir,
 *    pero eso reduce la ventana de la condición de carrera, no la elimina.
 *  - Sin transacciones: crear/actualizar un contrato y su historial son dos
 *    llamadas separadas a la API; si la segunda falla, quedan desincronizadas.
 */
export class GoogleSheetsContratosProvider implements ContratosProvider {
  async listar(): Promise<Contrato[]> {
    const [filasContratos, filasHistorial, filasHitos, filasAnotaciones, filasGarantias] = await Promise.all([
      leerFilas(SHEET_NAMES.contratos),
      leerFilas(SHEET_NAMES.historial),
      leerFilas(SHEET_NAMES.hitos),
      leerFilas(SHEET_NAMES.anotaciones),
      leerFilas(SHEET_NAMES.garantias),
    ]);

    const contratos = filasContratos.filter((f) => f.length > 0).map(filaAContrato);

    for (const c of contratos) {
      c.historial = filasHistorial
        .filter((f) => f[0] === c.id)
        .map((f) => {
          const { fecha, usuario, rol, descripcion } = filaAEvento(f);
          return { fecha, usuario, rol, descripcion };
        });
      c.hitos = filasHitos
        .filter((f) => f[0] === c.id)
        .map((f) => {
          const { tipo, fecha, descripcion, monto } = filaAHito(f);
          return { tipo, fecha, descripcion, monto };
        });
      c.anotacionesSeguimiento = filasAnotaciones
        .filter((f) => f[0] === c.id)
        .map((f) => {
          const { fecha, tipo, observaciones, usuario } = filaAAnotacion(f);
          return { fecha, tipo, observaciones, usuario };
        });
      c.garantiasExigidas = filasGarantias
        .filter((f) => f[0] === c.id)
        .map((f) => {
          const { id, tipo, descripcion, fechaPresentacion } = filaAGarantia(f);
          return { id, tipo, descripcion, fechaPresentacion };
        });
    }

    return contratos;
  }

  async obtener(id: string): Promise<Contrato | undefined> {
    const todos = await this.listar();
    return todos.find((c) => c.id === id);
  }

  async crear(contrato: Contrato): Promise<Contrato> {
    await agregarFila(SHEET_NAMES.contratos, contratoAFila(contrato));
    for (const ev of contrato.historial) {
      await agregarFila(SHEET_NAMES.historial, eventoAFila(contrato.id, ev));
    }
    for (const h of contrato.hitos) {
      await agregarFila(SHEET_NAMES.hitos, hitoAFila(contrato.id, h));
    }
    for (const a of contrato.anotacionesSeguimiento) {
      await agregarFila(SHEET_NAMES.anotaciones, anotacionAFila(contrato.id, a));
    }
    for (const g of contrato.garantiasExigidas) {
      await agregarFila(SHEET_NAMES.garantias, garantiaAFila(contrato.id, g));
    }
    return contrato;
  }

  async agregarAnotacion(id: string, anotacion: AnotacionSeguimiento): Promise<Contrato | undefined> {
    await agregarFila(SHEET_NAMES.anotaciones, anotacionAFila(id, anotacion));
    return this.obtener(id);
  }

  async agregarGarantia(id: string, garantia: GarantiaExigida): Promise<Contrato | undefined> {
    await agregarFila(SHEET_NAMES.garantias, garantiaAFila(id, garantia));
    return this.obtener(id);
  }

  async agregarHito(id: string, hito: HitoContractual): Promise<Contrato | undefined> {
    await agregarFila(SHEET_NAMES.hitos, hitoAFila(id, hito));
    return this.obtener(id);
  }

  async actualizarGarantia(id: string, garantiaId: string, cambios: Partial<GarantiaExigida>): Promise<Contrato | undefined> {
    const filas = await leerFilas(SHEET_NAMES.garantias);
    const idxFila = filas.findIndex((f) => f[0] === id && f[1] === garantiaId);
    if (idxFila === -1) return undefined;

    const actual = filaAGarantia(filas[idxFila]);
    const actualizada: GarantiaExigida = { ...actual, ...cambios };
    await actualizarFila(SHEET_NAMES.garantias, idxFila + 2, garantiaAFila(id, actualizada));
    return this.obtener(id);
  }

  async actualizar(id: string, cambios: Partial<Contrato>): Promise<Contrato | undefined> {
    const filas = await leerFilas(SHEET_NAMES.contratos);
    const idxCol = CONTRATOS_COLUMNS.findIndex((c) => c.key === "id");
    const idxFila = filas.findIndex((f) => f[idxCol] === id);
    if (idxFila === -1) return undefined;

    const actual = filaAContrato(filas[idxFila]);
    const actualizado: Contrato = { ...actual, ...cambios, hitos: actual.hitos, historial: actual.historial };

    // +2: +1 porque leerFilas empieza en A2 (se salta el header), +1 porque las filas son 1-based.
    await actualizarFila(SHEET_NAMES.contratos, idxFila + 2, contratoAFila(actualizado));

    if (cambios.historial) {
      for (const ev of cambios.historial) {
        await agregarFila(SHEET_NAMES.historial, eventoAFila(id, ev));
      }
    }

    return this.obtener(id);
  }
}
