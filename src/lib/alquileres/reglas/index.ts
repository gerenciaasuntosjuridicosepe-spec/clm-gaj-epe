/**
 * Punto de entrada único de las reglas de negocio del módulo de Alquileres.
 * Todas son funciones puras (sin dependencias de Next ni de Sheets), tal
 * como exige la sección 4 del PRD v2.1 ("para poder probarlas").
 *
 * Estado de cobertura de R1-R20 (libro original, sección 6 del PRD v1):
 *  - R1 (IDs del servidor, nunca reutilizados): se implementa en la capa de
 *    repositorio (secuencia atómica por prefijo), no acá — ver
 *    src/lib/alquileres/repositorio/ (Fase 1, siguiente tarea).
 *  - R2 a R20 (salvo R6, R10, R11, R12): implementadas abajo.
 *  - R6, R10, R11, R12: EXISTEN en el libro original v0.1 (R1-R12) pero su
 *    texto no consta en ningún PRD disponible — no se inventan (regla del
 *    encargo). Ver docs/PENDIENTES-HUMANOS.md punto 1. Cuando Carlos aporte
 *    el original, agregar un archivo rN-nombre.ts por cada una, con su
 *    propia prueba, siguiendo el mismo patrón que el resto de este
 *    directorio — no hace falta tocar las reglas ya implementadas.
 */
export * from "./r2-jerarquia";
export * from "./r3-cadena-actuaciones";
export * from "./r4-obligatorios-formalizada";
export * from "./r5-fecha-fin";
export * from "./r8-partes-minimas";
export * from "./r9-persona-duplicada";
export * from "./r13-fecha-prevista";
export * from "./r14-estado-derivado";
export * from "./r15-vencimiento-efectivo";
export * from "./r16-canon-neto";
export * from "./r17-cambio-tipo";
export * from "./r18-hitos-condicionales";
export * from "./r19-canon-vigente";
export * from "./r20-catalogos-editables";
export * from "./validaciones";
export * from "./campos-calculados";
export * from "./alertas";
export * from "./legitimo-abono";
export * from "./comunicaciones";
