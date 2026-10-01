/**
 * Interfaces genéricas de la capa de datos del módulo de Alquileres —
 * independientes de si el almacenamiento real es Google Sheets o el mock en
 * memoria (mismo espíritu que `ContratosProvider` del CLM, generalizado:
 * acá UNA interfaz sirve para las ~20 tablas de `esquema.ts`, en vez de una
 * interfaz manual por entidad).
 */

/**
 * M15/D14 — control optimista de concurrencia (T20): se lanza cuando
 * `actualizar()` recibe una `versionEsperada` que ya no coincide con la
 * versión real de la fila (alguien más la modificó en el medio).
 */
export class ConflictoVersionError extends Error {
  constructor(
    public readonly tabla: string,
    public readonly id: string,
    public readonly versionEsperada: number,
    public readonly versionActual: number
  ) {
    super(
      `Conflicto de versión en ${tabla}/${id}: se esperaba version=${versionEsperada}, la fila ya está en version=${versionActual} (otro usuario la modificó).`
    );
    this.name = "ConflictoVersionError";
  }
}

/** Se lanza al intentar actualizar/obtener una fila que no existe (o está dada de baja, según el método). */
export class RegistroNoEncontradoError extends Error {
  constructor(
    public readonly tabla: string,
    public readonly id: string
  ) {
    super(`No existe ${tabla}/${id}.`);
    this.name = "RegistroNoEncontradoError";
  }
}

export interface OpcionesListar {
  /** Si es `false` (default `true`), incluye también los dados de baja lógica. */
  soloActivos?: boolean;
}

/**
 * Repositorio genérico sobre una tabla con auditoría + control de versión
 * (M15). `T` siempre extiende `CamposAuditoria` (ver tipos.ts), pero no se
 * importa ese tipo acá para no crear una dependencia circular entre
 * `tipos.ts` y este archivo — el genérico alcanza para expresar el
 * contrato.
 */
export interface RepositorioTabla<T extends { version: number; activo: boolean }> {
  listar(opciones?: OpcionesListar): Promise<T[]>;
  obtener(id: string): Promise<T | undefined>;
  /**
   * Crea un registro nuevo: asigna el ID (vía secuencia atómica por
   * prefijo, R1), `version = 1` y los campos de auditoría de alta — si
   * `datos` incluye alguno de esos campos (o el de ID), se ignora, siempre
   * se generan acá. `Partial<T>` en vez de `Omit<T, campoId | ...>` porque
   * el nombre del campo de ID varía por tabla (no conviene un segundo
   * parámetro de tipo solo para expresarlo); la obligatoriedad de cada
   * campo de negocio al crear es una regla propia de cada tabla (R4', por
   * ejemplo), no algo que el repositorio genérico deba tipar.
   */
  crear(datos: Partial<T>, creadoPor: string): Promise<T>;
  /**
   * Actualiza un registro existente con control optimista: si
   * `versionEsperada` no coincide con la versión real, lanza
   * `ConflictoVersionError` sin aplicar ningún cambio (T20).
   */
  actualizar(id: string, cambios: Partial<T>, versionEsperada: number, modificadoPor: string): Promise<T>;
}
