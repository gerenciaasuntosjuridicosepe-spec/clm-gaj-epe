import { AnotacionSeguimiento, Contrato, GarantiaExigida, HitoContractual, RolId } from "../types";
import { MOCK_CONTRATOS } from "./mock-contratos";
import { googleSheetsConfigurado } from "./google-sheets-client";
import { GoogleSheetsContratosProvider } from "./google-sheets-provider";
import { puedeVerContrato } from "../permisos";
import { exigirMockPermitido } from "./entorno";

/**
 * Contrato con el almacenamiento de datos.
 *
 * Hay dos implementaciones:
 *  - `MockContratosProvider`: datos de ejemplo en memoria. Es la que corre
 *    si no hay variables de entorno de Google Sheets configuradas.
 *  - `GoogleSheetsContratosProvider` (google-sheets-provider.ts): lee/escribe
 *    en la planilla real. Se activa solo con las tres variables de entorno
 *    cargadas (ver INSTRUCTIVO_CONFIGURACION.md) — no hace falta tocar código
 *    para pasar de una a otra.
 *
 * Importante: este archivo (y `GoogleSheetsContratosProvider`) usan la
 * librería `googleapis`, que depende de Node y NO corre en el navegador.
 * Por eso solo se debe importar `getContratosProvider()` desde Server
 * Components o Route Handlers (carpeta `src/app/api/`), nunca desde un
 * componente marcado `"use client"`.
 */
export interface ContratosProvider {
  listar(): Promise<Contrato[]>;
  obtener(id: string): Promise<Contrato | undefined>;
  crear(contrato: Contrato): Promise<Contrato>;
  actualizar(id: string, cambios: Partial<Contrato>): Promise<Contrato | undefined>;
  /** Agrega una anotación de seguimiento (Redacción/Negociación) a un contrato existente. */
  agregarAnotacion(id: string, anotacion: AnotacionSeguimiento): Promise<Contrato | undefined>;
  /** Agrega una garantía exigida (se carga en Encuadre legal) a un contrato existente. */
  agregarGarantia(id: string, garantia: GarantiaExigida): Promise<Contrato | undefined>;
  /** Agrega un hito contractual (se carga en Encuadre legal) a un contrato existente. */
  agregarHito(id: string, hito: HitoContractual): Promise<Contrato | undefined>;
  /** Actualiza una garantía existente (ej. fecha de presentación, cargada en Firma). */
  actualizarGarantia(id: string, garantiaId: string, cambios: Partial<GarantiaExigida>): Promise<Contrato | undefined>;
}

class MockContratosProvider implements ContratosProvider {
  constructor() {
    exigirMockPermitido("contratos");
  }

  private data: Contrato[] = MOCK_CONTRATOS;

  async listar(): Promise<Contrato[]> {
    return this.data;
  }

  async obtener(id: string): Promise<Contrato | undefined> {
    return this.data.find((c) => c.id === id);
  }

  async crear(contrato: Contrato): Promise<Contrato> {
    this.data = [contrato, ...this.data];
    return contrato;
  }

  async actualizar(id: string, cambios: Partial<Contrato>): Promise<Contrato | undefined> {
    const idx = this.data.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data[idx] = { ...this.data[idx], ...cambios };
    return this.data[idx];
  }

  async agregarAnotacion(id: string, anotacion: AnotacionSeguimiento): Promise<Contrato | undefined> {
    const idx = this.data.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data[idx] = { ...this.data[idx], anotacionesSeguimiento: [...this.data[idx].anotacionesSeguimiento, anotacion] };
    return this.data[idx];
  }

  async agregarGarantia(id: string, garantia: GarantiaExigida): Promise<Contrato | undefined> {
    const idx = this.data.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data[idx] = { ...this.data[idx], garantiasExigidas: [...this.data[idx].garantiasExigidas, garantia] };
    return this.data[idx];
  }

  async agregarHito(id: string, hito: HitoContractual): Promise<Contrato | undefined> {
    const idx = this.data.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data[idx] = { ...this.data[idx], hitos: [...this.data[idx].hitos, hito] };
    return this.data[idx];
  }

  async actualizarGarantia(id: string, garantiaId: string, cambios: Partial<GarantiaExigida>): Promise<Contrato | undefined> {
    const idx = this.data.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const garantias = this.data[idx].garantiasExigidas.map((g) => (g.id === garantiaId ? { ...g, ...cambios } : g));
    this.data[idx] = { ...this.data[idx], garantiasExigidas: garantias };
    return this.data[idx];
  }
}

let instancia: ContratosProvider | null = null;

/**
 * Devuelve el provider activo: Google Sheets si está configurado por
 * variables de entorno, mock en caso contrario. Es la única función que
 * el resto de la app debería llamar para leer/escribir contratos.
 */
export function getContratosProvider(): ContratosProvider {
  if (!instancia) {
    if (googleSheetsConfigurado()) {
      instancia = new GoogleSheetsContratosProvider();
    } else {
      instancia = new MockContratosProvider();
    }
  }
  return instancia;
}

/**
 * Punto único de autorización de lectura: todo Server Component que liste
 * contratos debe llamar a esto (con el rol de la sesión real, vía `auth()`)
 * en vez de `.listar()` directo. Antes, `.listar()` sin filtrar viajaba
 * completo al navegador y el recorte por rol pasaba a ser cosmético (solo
 * en el cliente) — este wrapper es lo que cierra ese hallazgo.
 */
export async function listarVisibles(rolId: RolId): Promise<Contrato[]> {
  const todos = await getContratosProvider().listar();
  return todos.filter((c) => puedeVerContrato(rolId, c.etapaActual));
}
