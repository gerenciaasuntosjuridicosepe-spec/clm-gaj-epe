import { describe, expect, it } from "vitest";
import { FakeSheetsApi } from "./transporte-sheets-fake";

describe("FakeSheetsApi", () => {
  it("agregarFila asigna números de fila consecutivos (1-based) por hoja", async () => {
    const api = new FakeSheetsApi();
    const a = await api.agregarFila("X", ["a"]);
    const b = await api.agregarFila("X", ["b"]);
    const c = await api.agregarFila("X", ["c"]);
    expect([a.filaNumero, b.filaNumero, c.filaNumero]).toEqual([1, 2, 3]);
  });

  it("cada hoja tiene su propia secuencia de filas", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("X", ["a"]);
    const primeraDeY = await api.agregarFila("Y", ["z"]);
    expect(primeraDeY.filaNumero).toBe(1);
  });

  it("leer devuelve las filas en el orden en que se agregaron", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("X", ["a", "1"]);
    await api.agregarFila("X", ["b", "2"]);
    expect(await api.leer("X")).toEqual([
      ["a", "1"],
      ["b", "2"],
    ]);
  });

  it("actualizarFila sobreescribe la fila indicada sin tocar las demás", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("X", ["a"]);
    await api.agregarFila("X", ["b"]);
    await api.actualizarFila("X", 2, ["b-editada"]);
    expect(await api.leer("X")).toEqual([["a"], ["b-editada"]]);
  });

  it("actualizarMultiple aplica todos los cambios cuando no hay errores", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("ACTUACIONES", ["A"]);
    await api.agregarFila("ACTUACIONES", ["B"]);
    await api.actualizarMultiple([
      { hoja: "ACTUACIONES", filaNumero: 1, valores: ["A-editada"] },
      { hoja: "ACTUACIONES", filaNumero: 2, valores: ["B-editada"] },
    ]);
    expect(await api.leer("ACTUACIONES")).toEqual([["A-editada"], ["B-editada"]]);
  });

  it("prueba técnica (d): si falla a mitad de un lote, no queda ningún cambio aplicado", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("ACTUACIONES", ["A"]);
    await api.agregarFila("ACTUACIONES", ["B"]);
    api.fallarEnActualizarMultipleEnIndice = 1; // falla en el segundo cambio del lote

    await expect(
      api.actualizarMultiple([
        { hoja: "ACTUACIONES", filaNumero: 1, valores: ["A-editada"] },
        { hoja: "ACTUACIONES", filaNumero: 2, valores: ["B-editada"] },
      ])
    ).rejects.toThrow();

    // Ninguno de los dos cambios quedó aplicado — ni siquiera el primero.
    expect(await api.leer("ACTUACIONES")).toEqual([["A"], ["B"]]);
  });

  it("actualizarMultiple puede tocar varias hojas distintas en el mismo lote atómico", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("ACTUACIONES", ["A"]);
    await api.agregarFila("LOG", ["log-A"]);

    await api.actualizarMultiple([
      { hoja: "ACTUACIONES", filaNumero: 1, valores: ["A-editada"] },
      { hoja: "LOG", filaNumero: 1, valores: ["log-A-editada"] },
    ]);

    expect(await api.leer("ACTUACIONES")).toEqual([["A-editada"]]);
    expect(await api.leer("LOG")).toEqual([["log-A-editada"]]);
  });

  it("lecturasRealizadas cuenta las llamadas a leer() por hoja", async () => {
    const api = new FakeSheetsApi();
    await api.leer("X");
    await api.leer("X");
    await api.leer("Y");
    expect(api.lecturasRealizadas("X")).toBe(2);
    expect(api.lecturasRealizadas("Y")).toBe(1);
  });

  it("actualizarFila fuera de rango lanza error", async () => {
    const api = new FakeSheetsApi();
    await api.agregarFila("X", ["a"]);
    await expect(api.actualizarFila("X", 5, ["z"])).rejects.toThrow();
  });
});
