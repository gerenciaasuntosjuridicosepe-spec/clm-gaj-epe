/**
 * Validaciones obligatorias en el servidor (sección 5 del PRD v1, tabla
 * "Validaciones obligatorias en el servidor") — funciones puras, cada una
 * se usa tanto en el formulario (mensaje en pantalla) como de nuevo en el
 * servidor antes de escribir (nunca confiar solo en la validación del
 * cliente).
 */

const PATRON_EXPEDIENTE_1 = /^1-\d{4}-\d+$/;
const PATRON_EXPEDIENTE_EE = /^EE-\d{4}-\d+-APPSF-OD$/;

/** RF-07: dos formatos válidos de número de expediente (T11). El sistema de origen se deduce del patrón, no se guarda. */
export function validarNroExpediente(nro: string): boolean {
  return PATRON_EXPEDIENTE_1.test(nro) || PATRON_EXPEDIENTE_EE.test(nro);
}

const PATRON_PARTIDA = /^\d{2}-\d{2}-\d{2}-\d{6}\/\d{4}-\d$/;

/** Formato NN-NN-NN-NNNNNN/NNNN-N. Única entre inmuebles activos cuando se informa (se valida la unicidad en el repositorio/servicio). */
export function validarPartidaInmobiliaria(partida: string): boolean {
  return PATRON_PARTIDA.test(partida);
}

/** Solo dígitos, 7 u 8 (DNI argentino). */
export function validarDni(dni: string): boolean {
  return /^\d{7,8}$/.test(dni);
}

/**
 * T12: CUIT/CUIL con dígito verificador módulo 11. Acepta con o sin
 * guiones ("20-12345678-6" o "20123456786"); 11 dígitos exactos.
 */
export function validarCuit(cuit: string): boolean {
  const limpio = cuit.replace(/-/g, "");
  if (!/^\d{11}$/.test(limpio)) return false;

  const digitos = limpio.split("").map(Number);
  const verificador = digitos[10];
  const base = digitos.slice(0, 10);
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  const suma = base.reduce((acc, d, i) => acc + d * pesos[i], 0);
  const resto = suma % 11;
  let esperado = 11 - resto;
  if (esperado === 11) esperado = 0;
  if (esperado === 10) return false; // módulo 11 no produce un dígito verificador válido para esta base

  return esperado === verificador;
}

/** Formatea un CUIT de 11 dígitos (sin guiones) al formato con guiones NN-NNNNNNNN-N. */
export function formatearCuit(cuitSinGuiones: string): string {
  const limpio = cuitSinGuiones.replace(/-/g, "");
  if (!/^\d{11}$/.test(limpio)) return cuitSinGuiones;
  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`;
}

/** Enlace válido de documento (RF-28): https:// de drive.google.com o docs.google.com. */
export function validarUrlDocumento(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "drive.google.com" || u.hostname === "docs.google.com");
  } catch {
    return false;
  }
}

/** Formato de mail válido (RFC simplificado, suficiente para este dominio de uso). */
export function validarMail(mail: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
}

/** CONTACTOS_EPE.mail: además del formato, debe ser del dominio institucional. */
export function validarMailEpe(mail: string): boolean {
  return validarMail(mail) && mail.trim().toLowerCase().endsWith("@epe.santafe.gov.ar");
}

const PREFIJOS_PELIGROSOS = ["=", "+", "-", "@"];

/**
 * T13 / NF-S4: protección contra inyección de fórmulas de Sheets/Excel. Todo
 * texto que empiece con `=`, `+`, `-` o `@` se guarda anteponiendo una
 * comilla simple, tanto al escribir en la planilla como al exportar.
 */
export function neutralizarFormula(valor: string): string {
  if (valor.length > 0 && PREFIJOS_PELIGROSOS.includes(valor[0])) {
    return `'${valor}`;
  }
  return valor;
}

/** Recorta espacios al inicio y al final (sección 5 del PRD v1: "se recortan antes de guardar"). */
export function recortarEspacios(valor: string): string {
  return valor.trim();
}
