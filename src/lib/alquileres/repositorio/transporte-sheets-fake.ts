import type { CambioFila, TransporteSheets } from "./transporte-sheets";

/**
 * Doble completo en memoria de la API de Sheets, para probar
 * `repositorio-sheets.ts` sin credenciales reales. A diferencia de un mock
 * de `fetch` ensayo por ensayo, esto es un backend funcional: agregar una
 * fila de verdad le asigna el próximo número de fila (igual que la API
 * real lo haría), y `actualizarMultiple` aplica todo o nada de verdad
 * (no es una promesa vacía — si algo fallara a mitad de camino, lo ya
 * aplicado se revierte).
 */
export class FakeSheetsApi implements TransporteSheets {
  private hojas = new Map<string, (string | number | boolean)[][]>();
  private contadorLecturas = new Map<string, number>();

  /** Para pruebas que fuerzan un error a mitad de un lote (prueba técnica (d) del PRD: atomicidad). */
  public fallarEnActualizarMultipleEnIndice: number | null = null;

  private filas(hoja: string): (string | number | boolean)[][] {
    let f = this.hojas.get(hoja);
    if (!f) {
      f = [];
      this.hojas.set(hoja, f);
    }
    return f;
  }

  async leer(hoja: string): Promise<string[][]> {
    this.contadorLecturas.set(hoja, (this.contadorLecturas.get(hoja) ?? 0) + 1);
    return this.filas(hoja).map((fila) => fila.map(String));
  }

  /** Cantidad de veces que se llamó a `leer()` para esa hoja — usado por las pruebas de caché del repositorio. */
  lecturasRealizadas(hoja: string): number {
    return this.contadorLecturas.get(hoja) ?? 0;
  }

  async agregarFila(hoja: string, valores: (string | number | boolean)[]): Promise<{ filaNumero: number }> {
    const f = this.filas(hoja);
    f.push(valores);
    return { filaNumero: f.length }; // 1-based: la última fila agregada.
  }

  async actualizarFila(hoja: string, filaNumero: number, valores: (string | number | boolean)[]): Promise<void> {
    const f = this.filas(hoja);
    if (filaNumero < 1 || filaNumero > f.length) {
      throw new Error(`actualizarFila: fila ${filaNumero} fuera de rango en "${hoja}" (hay ${f.length}).`);
    }
    f[filaNumero - 1] = valores;
  }

  async actualizarMultiple(cambios: CambioFila[]): Promise<void> {
    // Simula la semántica de `spreadsheets.batchUpdate`: se valida TODO
    // antes de aplicar nada, y además se puede forzar una falla a mitad de
    // camino (para la prueba de atomicidad) sin dejar cambios parciales.
    for (const c of cambios) {
      const f = this.filas(c.hoja);
      if (c.filaNumero < 1 || c.filaNumero > f.length) {
        throw new Error(`actualizarMultiple: fila ${c.filaNumero} fuera de rango en "${c.hoja}".`);
      }
    }

    const snapshot = new Map<string, (string | number | boolean)[][]>();
    for (const c of cambios) {
      if (!snapshot.has(c.hoja)) snapshot.set(c.hoja, this.filas(c.hoja).map((fila) => [...fila]));
    }

    try {
      cambios.forEach((c, idx) => {
        if (this.fallarEnActualizarMultipleEnIndice === idx) {
          throw new Error(`Falla forzada en el índice ${idx} (prueba de atomicidad).`);
        }
        const f = this.filas(c.hoja);
        f[c.filaNumero - 1] = c.valores;
      });
    } catch (err) {
      // Revierte TODAS las hojas tocadas al estado previo al lote — "o se aplica completo, o no se aplica".
      for (const [hoja, filasOriginales] of snapshot) {
        this.hojas.set(hoja, filasOriginales);
      }
      throw err;
    }
  }

  /** Solo para pruebas: inspeccionar el estado crudo de una hoja. */
  _debugFilas(hoja: string): (string | number | boolean)[][] {
    return this.filas(hoja).map((f) => [...f]);
  }
}
