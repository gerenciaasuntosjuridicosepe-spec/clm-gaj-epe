import { MOCK_USUARIOS, Usuario } from "./mock-catalogos";
import { googleSheetsConfigurado } from "./google-sheets-client";
import { leerFilas, agregarFila, actualizarFila } from "./google-sheets-client";
import { SHEET_NAMES, USUARIOS_COLUMNS, filaAUsuario, usuarioAFila } from "./sheets-schema";

/**
 * Usuarios del CLM — resuelve el rol a partir del email de Google (login,
 * ver src/auth.ts) y, desde Administración > Usuarios, permite dar de alta
 * y editar usuarios reales (antes solo existían como mock estático).
 *
 * Sigue el mismo patrón mock/Sheets que `provider.ts` (contratos) y
 * `catalogos-provider.ts`. En modo mock, el estado vive en memoria del
 * proceso (se pierde al reiniciar `next dev`).
 */

let mockUsuarios: Usuario[] | null = null;

function getMockUsuarios(): Usuario[] {
  if (!mockUsuarios) mockUsuarios = [...MOCK_USUARIOS];
  return mockUsuarios;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.usuarios);
    return filas.filter((f) => f.length > 0).map(filaAUsuario);
  }
  return getMockUsuarios();
}

export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
  const normalizado = email.trim().toLowerCase();

  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.usuarios);
    const idxEmail = USUARIOS_COLUMNS.indexOf("email" as (typeof USUARIOS_COLUMNS)[number]);
    const fila = filas.find((f) => (f[idxEmail] ?? "").trim().toLowerCase() === normalizado);
    return fila ? filaAUsuario(fila) : undefined;
  }

  return getMockUsuarios().find((u) => u.email.trim().toLowerCase() === normalizado);
}

export async function crearUsuario(datos: Omit<Usuario, "id">): Promise<Usuario> {
  const usuario: Usuario = { id: `u-${Date.now()}`, ...datos };
  if (googleSheetsConfigurado()) {
    await agregarFila(SHEET_NAMES.usuarios, usuarioAFila(usuario));
  } else {
    getMockUsuarios().push(usuario);
  }
  return usuario;
}

export async function actualizarUsuario(id: string, cambios: Partial<Omit<Usuario, "id">>): Promise<Usuario | undefined> {
  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.usuarios);
    const idx = filas.findIndex((f) => f[0] === id);
    if (idx === -1) return undefined;
    const actual = filaAUsuario(filas[idx]);
    const actualizado: Usuario = { ...actual, ...cambios };
    await actualizarFila(SHEET_NAMES.usuarios, idx + 2, usuarioAFila(actualizado));
    return actualizado;
  }
  const lista = getMockUsuarios();
  const idx = lista.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  lista[idx] = { ...lista[idx], ...cambios };
  return lista[idx];
}
