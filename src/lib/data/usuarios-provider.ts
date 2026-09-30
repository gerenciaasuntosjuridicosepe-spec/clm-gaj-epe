import { MOCK_USUARIOS, Usuario } from "./mock-catalogos";
import { googleSheetsConfigurado } from "./google-sheets-client";
import { leerFilas } from "./google-sheets-client";
import { SHEET_NAMES, USUARIOS_COLUMNS, filaAUsuario } from "./sheets-schema";

/**
 * Resuelve el usuario del CLM asociado a un email de Google — es el punto de
 * autorización del login (ver src/auth.ts): si el email no aparece acá, el
 * login se rechaza aunque Google lo haya validado.
 *
 * Sigue el mismo patrón mock/Sheets que `getContratosProvider()` en
 * `provider.ts`, pero como hoy es una única lectura sin escritura no hace
 * falta una interfaz `UsuariosProvider` completa.
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
  const normalizado = email.trim().toLowerCase();

  if (googleSheetsConfigurado()) {
    const filas = await leerFilas(SHEET_NAMES.usuarios);
    const idxEmail = USUARIOS_COLUMNS.indexOf("email" as (typeof USUARIOS_COLUMNS)[number]);
    const fila = filas.find((f) => (f[idxEmail] ?? "").trim().toLowerCase() === normalizado);
    return fila ? filaAUsuario(fila) : undefined;
  }

  return MOCK_USUARIOS.find((u) => u.email.trim().toLowerCase() === normalizado);
}
