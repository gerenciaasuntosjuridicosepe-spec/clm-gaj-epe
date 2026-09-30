import { MOCK_SECTORES, MOCK_ASIGNACION_SECTOR, MOCK_TIPOS_CONTRATO, MOCK_TIPOS_ANOTACION, MOCK_TIPOS_GARANTIA, SectorEmisor } from "./mock-catalogos";
import { googleSheetsConfigurado } from "./google-sheets-client";
import { leerFilas, agregarFila, actualizarFila } from "./google-sheets-client";
import {
  SHEET_NAMES,
  filaASector,
  sectorAFila,
  filaATipoContrato,
  tipoContratoAFila,
} from "./sheets-schema";

/**
 * Catálogos administrables desde Administración (Sectores, Tipos de
 * contrato, Tipos de anotación, Tipos de garantía) — antes eran arrays
 * fijos en `mock-catalogos.ts` sin alta/edición real desde la UI. Sigue el
 * mismo patrón mock/Sheets que `provider.ts` (contratos) y
 * `usuarios-provider.ts`.
 *
 * En modo mock, el estado se guarda en memoria del proceso (se pierde al
 * reiniciar `next dev`) — igual que `MockContratosProvider`.
 */

export interface TipoContratoItem {
  nombre: string;
  sectorAsignadoId: string | null;
}

let mockSectores: SectorEmisor[] | null = null;
let mockTiposContrato: TipoContratoItem[] | null = null;
let mockTiposAnotacion: string[] | null = null;
let mockTiposGarantia: string[] | null = null;

function getMockSectores(): SectorEmisor[] {
  if (!mockSectores) mockSectores = [...MOCK_SECTORES];
  return mockSectores;
}

function getMockTiposContrato(): TipoContratoItem[] {
  if (!mockTiposContrato) {
    mockTiposContrato = MOCK_TIPOS_CONTRATO.map((nombre) => ({
      nombre,
      sectorAsignadoId: MOCK_ASIGNACION_SECTOR[nombre] ?? null,
    }));
  }
  return mockTiposContrato;
}

function getMockTiposAnotacion(): string[] {
  if (!mockTiposAnotacion) mockTiposAnotacion = [...MOCK_TIPOS_ANOTACION];
  return mockTiposAnotacion;
}

function getMockTiposGarantia(): string[] {
  if (!mockTiposGarantia) mockTiposGarantia = [...MOCK_TIPOS_GARANTIA];
  return mockTiposGarantia;
}

// ---- Sectores ----

export async function listarSectores(): Promise<SectorEmisor[]> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.sectores);
    return filas.filter((f) => f.length > 0).map(filaASector);
  }
  return getMockSectores();
}

export async function crearSector(nombre: string): Promise<SectorEmisor> {
  const sector: SectorEmisor = { id: `sec-${Date.now()}`, nombre };
  if (googleSheetsConfigurado()) {
    await agregarFila(SHEET_NAMES.sectores, sectorAFila(sector));
  } else {
    getMockSectores().push(sector);
  }
  return sector;
}

// ---- Tipos de contrato (+ sector emisor asignado) ----

export async function listarTiposContrato(): Promise<TipoContratoItem[]> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.tiposContrato);
    return filas.filter((f) => f.length > 0).map(filaATipoContrato);
  }
  return getMockTiposContrato();
}

export async function crearTipoContrato(nombre: string): Promise<TipoContratoItem> {
  const item: TipoContratoItem = { nombre, sectorAsignadoId: null };
  if (googleSheetsConfigurado()) {
    await agregarFila(SHEET_NAMES.tiposContrato, tipoContratoAFila(item));
  } else {
    getMockTiposContrato().push(item);
  }
  return item;
}

export async function renombrarTipoContrato(original: string, nuevo: string): Promise<TipoContratoItem | undefined> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.tiposContrato);
    const idx = filas.findIndex((f) => f[0] === original);
    if (idx === -1) return undefined;
    const actualizado: TipoContratoItem = { nombre: nuevo, sectorAsignadoId: filaATipoContrato(filas[idx]).sectorAsignadoId };
    await actualizarFila(SHEET_NAMES.tiposContrato, idx + 2, tipoContratoAFila(actualizado));
    return actualizado;
  }
  const lista = getMockTiposContrato();
  const item = lista.find((t) => t.nombre === original);
  if (!item) return undefined;
  item.nombre = nuevo;
  return item;
}

export async function actualizarSectorDeTipoContrato(nombre: string, sectorAsignadoId: string | null): Promise<TipoContratoItem | undefined> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.tiposContrato);
    const idx = filas.findIndex((f) => f[0] === nombre);
    if (idx === -1) return undefined;
    const actualizado: TipoContratoItem = { nombre, sectorAsignadoId };
    await actualizarFila(SHEET_NAMES.tiposContrato, idx + 2, tipoContratoAFila(actualizado));
    return actualizado;
  }
  const lista = getMockTiposContrato();
  const item = lista.find((t) => t.nombre === nombre);
  if (!item) return undefined;
  item.sectorAsignadoId = sectorAsignadoId;
  return item;
}

// ---- Tipos de anotación / Tipos de garantía (catálogos simples, solo nombre) ----

async function listarCatalogoSimple(hoja: string, mock: string[]): Promise<string[]> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(hoja);
    return filas.filter((f) => f.length > 0 && f[0]).map((f) => f[0]);
  }
  return mock;
}

async function crearEnCatalogoSimple(hoja: string, mock: string[], nombre: string): Promise<void> {
  if (googleSheetsConfigurado()) {
    await agregarFila(hoja, [nombre]);
  } else {
    mock.push(nombre);
  }
}

async function renombrarEnCatalogoSimple(hoja: string, mock: string[], original: string, nuevo: string): Promise<boolean> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(hoja);
    const idx = filas.findIndex((f) => f[0] === original);
    if (idx === -1) return false;
    await actualizarFila(hoja, idx + 2, [nuevo]);
    return true;
  }
  const idx = mock.indexOf(original);
  if (idx === -1) return false;
  mock[idx] = nuevo;
  return true;
}

export async function listarTiposAnotacion(): Promise<string[]> {
  return listarCatalogoSimple(SHEET_NAMES.tiposAnotacion, getMockTiposAnotacion());
}
export async function crearTipoAnotacion(nombre: string): Promise<void> {
  return crearEnCatalogoSimple(SHEET_NAMES.tiposAnotacion, getMockTiposAnotacion(), nombre);
}
export async function renombrarTipoAnotacion(original: string, nuevo: string): Promise<boolean> {
  return renombrarEnCatalogoSimple(SHEET_NAMES.tiposAnotacion, getMockTiposAnotacion(), original, nuevo);
}

export async function listarTiposGarantia(): Promise<string[]> {
  return listarCatalogoSimple(SHEET_NAMES.tiposGarantia, getMockTiposGarantia());
}
export async function crearTipoGarantia(nombre: string): Promise<void> {
  return crearEnCatalogoSimple(SHEET_NAMES.tiposGarantia, getMockTiposGarantia(), nombre);
}
export async function renombrarTipoGarantia(original: string, nuevo: string): Promise<boolean> {
  return renombrarEnCatalogoSimple(SHEET_NAMES.tiposGarantia, getMockTiposGarantia(), original, nuevo);
}
