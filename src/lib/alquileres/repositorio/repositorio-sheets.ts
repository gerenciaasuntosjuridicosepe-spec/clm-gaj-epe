import type { ColumnaDef } from "../esquema";
import { filaAObjeto, objetoAFila } from "../esquema";
import { ahoraIso } from "../fechas";
import { neutralizarFormula } from "../reglas/validaciones";
import { ConflictoVersionError, type OpcionesListar, type RepositorioTabla } from "./tipos-repositorio";
import type { TransporteSheets } from "./transporte-sheets";
import { registrarAlta, registrarCambiosDeActualizacion, registrarConflictoVersion } from "./log-cambios";

/** Vigencia de la caché de lecturas (sección 4 del PRD v2.1: "caché en memoria de corta vigencia, máximo 60 s"). */
const VIGENCIA_CACHE_MS = 60_000;

export interface OpcionesRepositorioSheets<T extends { version: number; activo: boolean }> {
  transporte: TransporteSheets;
  /** Hoja de datos de la tabla (ej. "ACTUACIONES"). */
  hojaDatos: string;
  /** Hoja de secuencia del prefijo de esta tabla (ej. "SEQ_ACT"). */
  hojaSecuencia: string;
  /** Prefijo del ID visible (ej. "ACT" -> "ACT-0001"). */
  prefijo: string;
  /** Nombre del campo que guarda el ID (ej. "actuacionId"). */
  campoId: keyof T & string;
  columnas: ColumnaDef<T>[];
  /** Nombre de la tabla, solo para mensajes de error legibles. */
  nombreTabla: string;
}

/**
 * Implementación genérica de `RepositorioTabla<T>` sobre Sheets (real o el
 * fake de pruebas, `transporte-sheets-fake.ts` — ambos cumplen
 * `TransporteSheets`). R1 (ID por secuencia atómica), M15 (control
 * optimista de versión), caché corta de lecturas invalidada en cada
 * escritura, y escritura multi-fila atómica delegada al transporte.
 */
export class RepositorioSheets<T extends { version: number; activo: boolean }> implements RepositorioTabla<T> {
  private cache: { datos: string[][]; expiraEn: number } | null = null;

  constructor(private readonly opciones: OpcionesRepositorioSheets<T>) {}

  private async leerFilasCacheadas(): Promise<string[][]> {
    const ahora = Date.now();
    if (this.cache && ahora < this.cache.expiraEn) return this.cache.datos;
    const datos = await this.opciones.transporte.leer(this.opciones.hojaDatos);
    this.cache = { datos, expiraEn: ahora + VIGENCIA_CACHE_MS };
    return datos;
  }

  private invalidarCache(): void {
    this.cache = null;
  }

  private aObjetos(filas: string[][]): T[] {
    return filas.map((fila) => filaAObjeto(this.opciones.columnas, fila));
  }

  async listar(opcionesListar: OpcionesListar = {}): Promise<T[]> {
    const soloActivos = opcionesListar.soloActivos ?? true;
    const objetos = this.aObjetos(await this.leerFilasCacheadas());
    return soloActivos ? objetos.filter((o) => o.activo) : objetos;
  }

  async obtener(id: string): Promise<T | undefined> {
    const objetos = this.aObjetos(await this.leerFilasCacheadas());
    return objetos.find((o) => (o[this.opciones.campoId] as unknown) === id);
  }

  private generarId(numeroFila: number): string {
    return `${this.opciones.prefijo}-${String(numeroFila).padStart(4, "0")}`;
  }

  async crear(datos: Partial<T>, creadoPor: string): Promise<T> {
    // R1: el número del ID es la fila que la propia API asigna al agregar a la hoja de secuencia — nunca se reutiliza.
    const { filaNumero } = await this.opciones.transporte.agregarFila(this.opciones.hojaSecuencia, [ahoraIso()]);
    const id = this.generarId(filaNumero);
    const ahora = ahoraIso();

    const completo = {
      ...datos,
      [this.opciones.campoId]: id,
      activo: datos.activo ?? true,
      creadoEn: ahora,
      creadoPor,
      modificadoEn: ahora,
      modificadoPor: creadoPor,
      version: 1,
    } as unknown as T;

    const fila = objetoAFila(this.opciones.columnas, completo, neutralizarFormula);
    await this.opciones.transporte.agregarFila(this.opciones.hojaDatos, fila);
    this.invalidarCache();
    await registrarAlta(this.opciones.nombreTabla, id, creadoPor, this.opciones.transporte);
    return completo;
  }

  async actualizar(id: string, cambios: Partial<T>, versionEsperada: number, modificadoPor: string): Promise<T> {
    const filas = await this.leerFilasCacheadas();
    const objetos = this.aObjetos(filas);
    const idx = objetos.findIndex((o) => (o[this.opciones.campoId] as unknown) === id);
    if (idx === -1) {
      throw new Error(`No existe ${this.opciones.nombreTabla}/${id}.`);
    }

    const actual = objetos[idx];
    if (actual.version !== versionEsperada) {
      await registrarConflictoVersion(this.opciones.nombreTabla, id, modificadoPor, this.opciones.transporte);
      throw new ConflictoVersionError(this.opciones.nombreTabla, id, versionEsperada, actual.version);
    }

    const actualizado: T = {
      ...actual,
      ...cambios,
      [this.opciones.campoId]: id, // el ID nunca se pisa con `cambios`
      version: actual.version + 1,
      modificadoEn: ahoraIso(),
      modificadoPor,
    } as T;

    const filaNueva = objetoAFila(this.opciones.columnas, actualizado, neutralizarFormula);
    // +1 porque `leer()` no devuelve el encabezado (fila de datos 1 = índice 0).
    await this.opciones.transporte.actualizarFila(this.opciones.hojaDatos, idx + 1, filaNueva);
    this.invalidarCache();
    await registrarCambiosDeActualizacion(
      this.opciones.nombreTabla,
      id,
      modificadoPor,
      actual as unknown as Record<string, unknown>,
      actualizado as unknown as Record<string, unknown>,
      this.opciones.transporte
    );
    return actualizado;
  }

  /**
   * Actualiza VARIAS filas de esta misma tabla en una única escritura
   * atómica (ej. R3a: insertar un LEGITIMO_ABONO cambia el
   * `actuacion_anterior_id` de dos actuaciones a la vez). Se valida la
   * versión de TODAS las entradas antes de escribir nada — si cualquiera
   * tiene conflicto, no se aplica ningún cambio (ídem control optimista de
   * `actualizar()`, pero atómico para el lote completo).
   */
  async actualizarMultiple(
    entradas: { id: string; cambios: Partial<T>; versionEsperada: number }[],
    modificadoPor: string
  ): Promise<T[]> {
    const filas = await this.leerFilasCacheadas();
    const objetos = this.aObjetos(filas);
    const ahora = ahoraIso();

    const resueltos: { idx: number; anterior: T; actualizado: T }[] = [];
    for (const entrada of entradas) {
      const idx = objetos.findIndex((o) => (o[this.opciones.campoId] as unknown) === entrada.id);
      if (idx === -1) throw new Error(`No existe ${this.opciones.nombreTabla}/${entrada.id}.`);
      const actual = objetos[idx];
      if (actual.version !== entrada.versionEsperada) {
        await registrarConflictoVersion(this.opciones.nombreTabla, entrada.id, modificadoPor, this.opciones.transporte);
        throw new ConflictoVersionError(this.opciones.nombreTabla, entrada.id, entrada.versionEsperada, actual.version);
      }
      const actualizado: T = {
        ...actual,
        ...entrada.cambios,
        [this.opciones.campoId]: entrada.id,
        version: actual.version + 1,
        modificadoEn: ahora,
        modificadoPor,
      } as T;
      resueltos.push({ idx, anterior: actual, actualizado });
    }

    await this.opciones.transporte.actualizarMultiple(
      resueltos.map(({ idx, actualizado }) => ({
        hoja: this.opciones.hojaDatos,
        filaNumero: idx + 1,
        valores: objetoAFila(this.opciones.columnas, actualizado, neutralizarFormula),
      }))
    );

    this.invalidarCache();
    for (const { anterior, actualizado } of resueltos) {
      await registrarCambiosDeActualizacion(
        this.opciones.nombreTabla,
        (actualizado[this.opciones.campoId] as unknown) as string,
        modificadoPor,
        anterior as unknown as Record<string, unknown>,
        actualizado as unknown as Record<string, unknown>,
        this.opciones.transporte
      );
    }
    return resueltos.map((r) => r.actualizado);
  }
}
