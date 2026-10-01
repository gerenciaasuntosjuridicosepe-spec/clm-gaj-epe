import { describe, expect, it } from "vitest";
import type { ColumnaDef } from "../esquema";
import { RepositorioSheets } from "./repositorio-sheets";
import { FakeSheetsApi } from "./transporte-sheets-fake";
import { ConflictoVersionError } from "./tipos-repositorio";

/** Tipo mínimo de prueba — no es ninguna tabla real del dominio, solo ejercita el repositorio genérico. */
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

function crearRepo(api = new FakeSheetsApi()) {
  return {
    api,
    repo: new RepositorioSheets<Cosa>({
      transporte: api,
      hojaDatos: "COSAS",
      hojaSecuencia: "SEQ_COS",
      prefijo: "COS",
      campoId: "cosaId",
      columnas: COLUMNAS,
      nombreTabla: "COSAS",
    }),
  };
}

describe("RepositorioSheets — alta (R1)", () => {
  it("asigna un ID con el prefijo y el número de fila de la secuencia", async () => {
    const { repo } = crearRepo();
    const c1 = await repo.crear({ nombre: "Primera" } as never, "tester@ejemplo.test");
    const c2 = await repo.crear({ nombre: "Segunda" } as never, "tester@ejemplo.test");
    expect(c1.cosaId).toBe("COS-0001");
    expect(c2.cosaId).toBe("COS-0002");
  });

  it("T1': 20 altas concurrentes dan 20 IDs distintos y consecutivos", async () => {
    const { repo } = crearRepo();
    const resultados = await Promise.all(
      Array.from({ length: 20 }, (_, i) => repo.crear({ nombre: `Cosa ${i}` } as never, "tester@ejemplo.test"))
    );
    const ids = resultados.map((r) => r.cosaId);
    expect(new Set(ids).size).toBe(20); // todos distintos
    const numeros = ids.map((id) => Number(id.split("-")[1])).sort((a, b) => a - b);
    expect(numeros).toEqual(Array.from({ length: 20 }, (_, i) => i + 1)); // consecutivos 1..20
  });

  it("empieza en version = 1 y activo = true por defecto", async () => {
    const { repo } = crearRepo();
    const c = await repo.crear({ nombre: "X" } as never, "tester@ejemplo.test");
    expect(c.version).toBe(1);
    expect(c.activo).toBe(true);
  });
});

describe("RepositorioSheets — listar/obtener", () => {
  it("listar devuelve solo activos por defecto", async () => {
    const { repo } = crearRepo();
    const c1 = await repo.crear({ nombre: "Activa" } as never, "t@t.test");
    await repo.crear({ nombre: "Se da de baja" } as never, "t@t.test");
    const c2 = (await repo.listar({ soloActivos: false }))[1];
    await repo.actualizar(c2.cosaId, { activo: false } as never, c2.version, "t@t.test");

    const activos = await repo.listar();
    expect(activos.map((c) => c.cosaId)).toEqual([c1.cosaId]);

    const todos = await repo.listar({ soloActivos: false });
    expect(todos.length).toBe(2);
  });

  it("obtener encuentra por id, incluidos los dados de baja", async () => {
    const { repo } = crearRepo();
    const c = await repo.crear({ nombre: "X" } as never, "t@t.test");
    expect((await repo.obtener(c.cosaId))?.nombre).toBe("X");
    expect(await repo.obtener("COS-9999")).toBeUndefined();
  });
});

describe("RepositorioSheets — control optimista de versión (T20)", () => {
  it("actualiza con la versión correcta e incrementa version", async () => {
    const { repo } = crearRepo();
    const c = await repo.crear({ nombre: "Original" } as never, "t@t.test");
    const actualizado = await repo.actualizar(c.cosaId, { nombre: "Editada" } as never, 1, "editor@t.test");
    expect(actualizado.nombre).toBe("Editada");
    expect(actualizado.version).toBe(2);
    expect(actualizado.modificadoPor).toBe("editor@t.test");
  });

  it("T20: dos usuarios editan la misma fila — el segundo (con versión vieja) recibe un conflicto, nada se pierde en silencio", async () => {
    const { repo } = crearRepo();
    const c = await repo.crear({ nombre: "Original" } as never, "t@t.test");

    // Usuario 1 lee version=1 y actualiza con éxito.
    const despuesDeUsuario1 = await repo.actualizar(c.cosaId, { nombre: "Cambio de usuario 1" } as never, 1, "u1@t.test");
    expect(despuesDeUsuario1.version).toBe(2);

    // Usuario 2 también había leído version=1 (antes del cambio de usuario 1) e intenta actualizar con esa versión vieja.
    await expect(repo.actualizar(c.cosaId, { nombre: "Cambio de usuario 2" } as never, 1, "u2@t.test")).rejects.toThrow(
      ConflictoVersionError
    );

    // El cambio de usuario 1 no se perdió.
    const final = await repo.obtener(c.cosaId);
    expect(final?.nombre).toBe("Cambio de usuario 1");
    expect(final?.version).toBe(2);
  });

  it("actualizar un id inexistente lanza error", async () => {
    const { repo } = crearRepo();
    await expect(repo.actualizar("COS-9999", { nombre: "x" } as never, 1, "t@t.test")).rejects.toThrow();
  });
});

describe("RepositorioSheets — actualizarMultiple (R3a, prueba técnica d: atomicidad)", () => {
  it("aplica varios cambios atómicamente cuando todas las versiones coinciden", async () => {
    const { repo } = crearRepo();
    const a = await repo.crear({ nombre: "A" } as never, "t@t.test");
    const b = await repo.crear({ nombre: "B" } as never, "t@t.test");

    const [aActualizada, bActualizada] = await repo.actualizarMultiple(
      [
        { id: a.cosaId, cambios: { nombre: "A-editada" } as never, versionEsperada: 1 },
        { id: b.cosaId, cambios: { nombre: "B-editada" } as never, versionEsperada: 1 },
      ],
      "t@t.test"
    );

    expect(aActualizada.nombre).toBe("A-editada");
    expect(bActualizada.nombre).toBe("B-editada");
  });

  it("si una entrada del lote tiene conflicto de versión, NINGUNA se aplica", async () => {
    const { repo } = crearRepo();
    const a = await repo.crear({ nombre: "A" } as never, "t@t.test");
    const b = await repo.crear({ nombre: "B" } as never, "t@t.test");

    await expect(
      repo.actualizarMultiple(
        [
          { id: a.cosaId, cambios: { nombre: "A-editada" } as never, versionEsperada: 1 },
          { id: b.cosaId, cambios: { nombre: "B-editada" } as never, versionEsperada: 99 }, // versión incorrecta a propósito
        ],
        "t@t.test"
      )
    ).rejects.toThrow(ConflictoVersionError);

    // "a" tampoco se tocó, aunque su versión era correcta — todo o nada.
    expect((await repo.obtener(a.cosaId))?.nombre).toBe("A");
    expect((await repo.obtener(a.cosaId))?.version).toBe(1);
  });
});

describe("RepositorioSheets — caché corta de lecturas", () => {
  it("una segunda lectura dentro de los 60s no vuelve a pegarle al transporte", async () => {
    const api = new FakeSheetsApi();
    const { repo } = crearRepo(api);
    await repo.crear({ nombre: "X" } as never, "t@t.test");
    api.lecturasRealizadas("COSAS"); // (no cuenta la lectura de la secuencia, hoja distinta)

    await repo.listar();
    const lecturasTrasPrimerListar = api.lecturasRealizadas("COSAS");
    await repo.listar();
    const lecturasTrasSegundoListar = api.lecturasRealizadas("COSAS");

    expect(lecturasTrasSegundoListar).toBe(lecturasTrasPrimerListar); // no aumentó: sirvió de caché
  });

  it("una escritura invalida la caché — la siguiente lectura vuelve a pegarle al transporte", async () => {
    const api = new FakeSheetsApi();
    const { repo } = crearRepo(api);
    const c = await repo.crear({ nombre: "X" } as never, "t@t.test");
    await repo.listar();
    const lecturasAntes = api.lecturasRealizadas("COSAS");

    await repo.actualizar(c.cosaId, { nombre: "Y" } as never, 1, "t@t.test");
    await repo.listar();
    const lecturasDespues = api.lecturasRealizadas("COSAS");

    expect(lecturasDespues).toBeGreaterThan(lecturasAntes);
  });
});
