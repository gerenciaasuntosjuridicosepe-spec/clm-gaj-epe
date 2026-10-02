import { ConflictoVersionError, type OpcionesListar, type RepositorioTabla } from "./tipos-repositorio";
import { ahoraIso } from "../fechas";
import { registrarAlta, registrarCambiosDeActualizacion, registrarConflictoVersion } from "./log-cambios";

export interface OpcionesRepositorioMock<T extends { version: number; activo: boolean }> {
  prefijo: string;
  campoId: keyof T & string;
  nombreTabla: string;
}

/**
 * Implementación en memoria de `RepositorioTabla<T>` — la que corre en
 * desarrollo/pruebas sin Google Sheets configurado (mismo rol que
 * `MockContratosProvider` del CLM, generalizado para cualquier tabla).
 *
 * Mantiene las mismas garantías que la versión sobre Sheets (R1: secuencia
 * nunca retrocede ni repite; M15: control optimista de versión) sin pasar
 * por `TransporteSheets` — acá la "secuencia" es directamente un contador
 * en memoria, no hace falta simular "número de fila de una API".
 */
export class RepositorioMock<T extends { version: number; activo: boolean }> implements RepositorioTabla<T> {
  private datos: T[] = [];
  private contadorSecuencia = 0;

  constructor(private readonly opciones: OpcionesRepositorioMock<T>) {}

  private generarId(): string {
    this.contadorSecuencia += 1;
    return `${this.opciones.prefijo}-${String(this.contadorSecuencia).padStart(4, "0")}`;
  }

  async listar(opcionesListar: OpcionesListar = {}): Promise<T[]> {
    const soloActivos = opcionesListar.soloActivos ?? true;
    return soloActivos ? this.datos.filter((o) => o.activo) : [...this.datos];
  }

  async obtener(id: string): Promise<T | undefined> {
    return this.datos.find((o) => (o[this.opciones.campoId] as unknown) === id);
  }

  async crear(datos: Partial<T>, creadoPor: string): Promise<T> {
    const id = this.generarId();
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
    this.datos.push(completo);
    await registrarAlta(this.opciones.nombreTabla, id, creadoPor);
    return completo;
  }

  async actualizar(id: string, cambios: Partial<T>, versionEsperada: number, modificadoPor: string): Promise<T> {
    const idx = this.datos.findIndex((o) => (o[this.opciones.campoId] as unknown) === id);
    if (idx === -1) throw new Error(`No existe ${this.opciones.nombreTabla}/${id}.`);

    const actual = this.datos[idx];
    if (actual.version !== versionEsperada) {
      await registrarConflictoVersion(this.opciones.nombreTabla, id, modificadoPor);
      throw new ConflictoVersionError(this.opciones.nombreTabla, id, versionEsperada, actual.version);
    }

    const actualizado: T = {
      ...actual,
      ...cambios,
      [this.opciones.campoId]: id,
      version: actual.version + 1,
      modificadoEn: ahoraIso(),
      modificadoPor,
    } as T;
    this.datos[idx] = actualizado;
    await registrarCambiosDeActualizacion(
      this.opciones.nombreTabla,
      id,
      modificadoPor,
      actual as unknown as Record<string, unknown>,
      actualizado as unknown as Record<string, unknown>
    );
    return actualizado;
  }

  /** Igual que `actualizar()`, pero para varias filas a la vez, todo o nada (R3a) — en memoria, sin IO, trivialmente atómico. */
  async actualizarMultiple(
    entradas: { id: string; cambios: Partial<T>; versionEsperada: number }[],
    modificadoPor: string
  ): Promise<T[]> {
    // Valida todo antes de tocar nada.
    const indices: number[] = [];
    for (const entrada of entradas) {
      const idx = this.datos.findIndex((o) => (o[this.opciones.campoId] as unknown) === entrada.id);
      if (idx === -1) throw new Error(`No existe ${this.opciones.nombreTabla}/${entrada.id}.`);
      const actual = this.datos[idx];
      if (actual.version !== entrada.versionEsperada) {
        await registrarConflictoVersion(this.opciones.nombreTabla, entrada.id, modificadoPor);
        throw new ConflictoVersionError(this.opciones.nombreTabla, entrada.id, entrada.versionEsperada, actual.version);
      }
      indices.push(idx);
    }

    const ahora = ahoraIso();
    const resultados: T[] = [];
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      const entrada = entradas[i];
      const anterior = this.datos[idx];
      const actualizado: T = {
        ...anterior,
        ...entrada.cambios,
        [this.opciones.campoId]: entrada.id,
        version: anterior.version + 1,
        modificadoEn: ahora,
        modificadoPor,
      } as T;
      this.datos[idx] = actualizado;
      await registrarCambiosDeActualizacion(
        this.opciones.nombreTabla,
        entrada.id,
        modificadoPor,
        anterior as unknown as Record<string, unknown>,
        actualizado as unknown as Record<string, unknown>
      );
      resultados.push(actualizado);
    }
    return resultados;
  }
}
