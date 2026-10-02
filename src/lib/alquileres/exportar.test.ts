import { describe, expect, it } from "vitest";
import { aCsv } from "./exportar";

interface Fila {
  nombre: string;
  monto: number;
  activo: boolean;
}

describe("aCsv", () => {
  it("arma un CSV con encabezado y filas, con BOM UTF-8", () => {
    const csv = aCsv<Fila>(
      [{ nombre: "Juan", monto: 1000, activo: true }],
      [
        { clave: "nombre", titulo: "Nombre" },
        { clave: "monto", titulo: "Monto" },
        { clave: "activo", titulo: "Activo" },
      ]
    );
    expect(csv.codePointAt(0)).toBe(0xfeff);
    expect(csv).toContain("Nombre,Monto,Activo\r\n");
    expect(csv).toContain("Juan,1000,TRUE\r\n");
  });

  it("escapa comas, comillas y saltos de línea (RFC 4180)", () => {
    const csv = aCsv<Fila>([{ nombre: 'Pérez, Juan "el jefe"', monto: 0, activo: false }], [{ clave: "nombre", titulo: "Nombre" }]);
    expect(csv).toContain('"Pérez, Juan ""el jefe"""');
  });

  it("neutraliza una celda que empieza con '=' (T13/NF-S4 — un CSV abierto en Excel es tan vulnerable como una celda de Sheets)", () => {
    const csv = aCsv<Fila>([{ nombre: "=HYPERLINK(\"http://malicioso\")", monto: 0, activo: false }], [{ clave: "nombre", titulo: "Nombre" }]);
    expect(csv).toContain("'=HYPERLINK");
  });

  it("filas vacías dan solo el encabezado", () => {
    const csv = aCsv<Fila>([], [{ clave: "nombre", titulo: "Nombre" }]);
    expect(csv).toBe("﻿Nombre\r\n");
  });
});
