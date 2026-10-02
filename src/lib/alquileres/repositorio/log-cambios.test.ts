import { afterEach, describe, expect, it } from "vitest";
import { armarEntradasModificacion, listarLogCambios } from "./log-cambios";
import { RepositorioMock } from "./repositorio-mock";
import { RepositorioSheets } from "./repositorio-sheets";
import { FakeSheetsApi } from "./transporte-sheets-fake";
import { ConflictoVersionError } from "./tipos-repositorio";
import type { ColumnaDef } from "../esquema";
import { SHEET_NAMES } from "../esquema";

interface Cosa {
  cosaId: string;
  nombre: string;
  activo: boolean;
  creadoEn: string;
  creadoPor: string;
  modificadoEn: string;
  modificadoPor: string;
  version: number;
}

const COLUMNAS: ColumnaDef<Cosa>[] = [
  { key: "cosaId", header: "cosa_id", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "activo", header: "activo", tipo: "boolean" },
  { key: "creadoEn", header: "creado_en", tipo: "string" },
  { key: "creadoPor", header: "creado_por", tipo: "string" },
  { key: "modificadoEn", header: "modificado_en", tipo: "string" },
  { key: "modificadoPor", header: "modificado_por", tipo: "string" },
  { key: "version", header: "version", tipo: "number" },
];

afterEach(() => {
  // Limpia el mock global de LOG_CAMBIOS entre pruebas (mismo criterio que index.test.ts con los repositorios).
  const g = globalThis as typeof globalThis & { __alquileresLogCambiosMock?: unknown; __alquileresLogCambiosContadorMock?: unknown };
  delete g.__alquileresLogCambiosMock;
  delete g.__alquileresLogCambiosContadorMock;
});

describe("armarEntradasModificacion", () => {
  it("una entrada por campo cambiado, ignorando los campos de auditoría que siempre cambian", () => {
    const anterior = { nombre: "A", monto: 100, version: 1, modificadoEn: "t0", modificadoPor: "u1@t.test" };
    const nuevo = { nombre: "B", monto: 100, version: 2, modificadoEn: "t1", modificadoPor: "u2@t.test" };

    const entradas = armarEntradasModificacion(anterior, nuevo, { hoja: "COSAS", registroId: "COS-0001", usuarioEmail: "u2@t.test" });

    expect(entradas).toHaveLength(1);
    expect(entradas[0]).toMatchObject({ campo: "nombre", valorAnterior: "A", valorNuevo: "B", accion: "MODIFICACION" });
  });

  it("sin cambios reales, no genera ninguna entrada", () => {
    const obj = { nombre: "A", version: 1, modificadoEn: "t0", modificadoPor: "u1@t.test" };
    const entradas = armarEntradasModificacion(obj, { ...obj, version: 2, modificadoEn: "t1" }, { hoja: "COSAS", registroId: "COS-0001", usuarioEmail: "u@t.test" });
    expect(entradas).toHaveLength(0);
  });
});

describe("RepositorioMock — escribe en LOG_CAMBIOS (RF-38/M9)", () => {
  function crearRepo(nombreTabla: string) {
    return new RepositorioMock<Cosa>({ prefijo: "COS", campoId: "cosaId", nombreTabla });
  }

  it("un alta genera una entrada ALTA", async () => {
    const repo = crearRepo("COSAS_LOG_A");
    const c = await repo.crear({ nombre: "Original" } as never, "creador@t.test");

    const log = (await listarLogCambios()).filter((l) => l.hoja === "COSAS_LOG_A");
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ accion: "ALTA", registroId: c.cosaId, usuarioEmail: "creador@t.test" });
  });

  it("una modificación de un campo real genera una entrada MODIFICACION con el valor anterior y el nuevo", async () => {
    const repo = crearRepo("COSAS_LOG_M");
    const c = await repo.crear({ nombre: "Original" } as never, "creador@t.test");
    await repo.actualizar(c.cosaId, { nombre: "Cambiada" } as never, 1, "editor@t.test");

    const log = (await listarLogCambios()).filter((l) => l.hoja === "COSAS_LOG_M" && l.accion === "MODIFICACION");
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ campo: "nombre", valorAnterior: "Original", valorNuevo: "Cambiada", usuarioEmail: "editor@t.test" });
  });

  it("una baja lógica (solo activo: false) genera una entrada BAJA, no MODIFICACION", async () => {
    const repo = crearRepo("COSAS_LOG_B");
    const c = await repo.crear({ nombre: "Original" } as never, "creador@t.test");
    await repo.actualizar(c.cosaId, { activo: false } as never, 1, "editor@t.test");

    const log = (await listarLogCambios()).filter((l) => l.hoja === "COSAS_LOG_B" && l.registroId === c.cosaId);
    const bajas = log.filter((l) => l.accion === "BAJA");
    const modificaciones = log.filter((l) => l.accion === "MODIFICACION");
    expect(bajas).toHaveLength(1);
    expect(modificaciones).toHaveLength(0);
  });

  it("M17: un conflicto de versión también queda registrado, con esa acción, aunque la operación falle", async () => {
    const repo = crearRepo("COSAS_LOG_C");
    const c = await repo.crear({ nombre: "Original" } as never, "creador@t.test");

    await expect(repo.actualizar(c.cosaId, { nombre: "X" } as never, 99, "editor@t.test")).rejects.toThrow(ConflictoVersionError);

    const log = (await listarLogCambios()).filter((l) => l.hoja === "COSAS_LOG_C" && l.accion === "CONFLICTO_VERSION");
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ registroId: c.cosaId, usuarioEmail: "editor@t.test" });
  });
});

describe("RepositorioSheets — escribe en LOG_CAMBIOS usando SU PROPIO transporte, no el mock global", () => {
  function crearRepo() {
    const api = new FakeSheetsApi();
    const repo = new RepositorioSheets<Cosa>({
      transporte: api,
      hojaDatos: "COSAS",
      hojaSecuencia: "SEQ_COS",
      prefijo: "COS",
      campoId: "cosaId",
      columnas: COLUMNAS,
      nombreTabla: "COSAS",
    });
    return { api, repo };
  }

  it("un alta y una modificación quedan en la hoja LOG_CAMBIOS del MISMO transporte, no en el mock global", async () => {
    const { api, repo } = crearRepo();
    const c = await repo.crear({ nombre: "Original" } as never, "creador@t.test");
    await repo.actualizar(c.cosaId, { nombre: "Cambiada" } as never, 1, "editor@t.test");

    const filasLog = await api.leer(SHEET_NAMES.logCambios);
    expect(filasLog.length).toBe(2); // 1 ALTA + 1 MODIFICACION

    // El mock global de LOG_CAMBIOS (usado por RepositorioMock) NO debe haber recibido nada de esta prueba.
    const logGlobal = await listarLogCambios();
    expect(logGlobal.filter((l) => l.hoja === "COSAS" && l.registroId === c.cosaId)).toHaveLength(0);
  });
});
