import { describe, expect, it } from "vitest";
import { RepositorioMock } from "./repositorio-mock";
import { ConflictoVersionError } from "./tipos-repositorio";

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

function crearRepo() {
  return new RepositorioMock<Cosa>({ prefijo: "COS", campoId: "cosaId", nombreTabla: "COSAS" });
}

describe("RepositorioMock — alta (R1)", () => {
  it("asigna IDs consecutivos con el prefijo dado", async () => {
    const repo = crearRepo();
    const a = await repo.crear({ nombre: "A" } as never, "t@t.test");
    const b = await repo.crear({ nombre: "B" } as never, "t@t.test");
    expect(a.cosaId).toBe("COS-0001");
    expect(b.cosaId).toBe("COS-0002");
  });

  it("T1': 20 altas concurrentes -> 20 IDs distintos y consecutivos", async () => {
    const repo = crearRepo();
    const resultados = await Promise.all(Array.from({ length: 20 }, (_, i) => repo.crear({ nombre: `${i}` } as never, "t@t.test")));
    const ids = resultados.map((r) => r.cosaId);
    expect(new Set(ids).size).toBe(20);
    const numeros = ids.map((id) => Number(id.split("-")[1])).sort((a, b) => a - b);
    expect(numeros).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});

describe("RepositorioMock — listar/obtener", () => {
  it("listar filtra por activo por defecto", async () => {
    const repo = crearRepo();
    const a = await repo.crear({ nombre: "A" } as never, "t@t.test");
    const b = await repo.crear({ nombre: "B" } as never, "t@t.test");
    await repo.actualizar(b.cosaId, { activo: false } as never, 1, "t@t.test");

    expect((await repo.listar()).map((c) => c.cosaId)).toEqual([a.cosaId]);
    expect((await repo.listar({ soloActivos: false })).length).toBe(2);
  });
});

describe("RepositorioMock — control optimista de versión (T20)", () => {
  it("rechaza una actualización con versión vieja sin perder el cambio ya aplicado", async () => {
    const repo = crearRepo();
    const c = await repo.crear({ nombre: "Original" } as never, "t@t.test");

    await repo.actualizar(c.cosaId, { nombre: "Cambio 1" } as never, 1, "u1@t.test");
    await expect(repo.actualizar(c.cosaId, { nombre: "Cambio 2" } as never, 1, "u2@t.test")).rejects.toThrow(
      ConflictoVersionError
    );

    expect((await repo.obtener(c.cosaId))?.nombre).toBe("Cambio 1");
  });
});

describe("RepositorioMock — actualizarMultiple (R3a)", () => {
  it("todo o nada: si una entrada falla, ninguna se aplica", async () => {
    const repo = crearRepo();
    const a = await repo.crear({ nombre: "A" } as never, "t@t.test");
    const b = await repo.crear({ nombre: "B" } as never, "t@t.test");

    await expect(
      repo.actualizarMultiple(
        [
          { id: a.cosaId, cambios: { nombre: "A-editada" } as never, versionEsperada: 1 },
          { id: b.cosaId, cambios: { nombre: "B-editada" } as never, versionEsperada: 99 },
        ],
        "t@t.test"
      )
    ).rejects.toThrow(ConflictoVersionError);

    expect((await repo.obtener(a.cosaId))?.nombre).toBe("A");
  });
});
