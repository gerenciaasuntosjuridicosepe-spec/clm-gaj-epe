# Runbook — Prueba técnica (a): login con cuenta @gmail.com personal y de Workspace

PRD v2.1, sección 3, tabla de pruebas técnicas de la Fase 0. **No ejecutada por el desarrollo autónomo**: requería cuentas de Google reales y credenciales OAuth, que no existían en este worktree (sin `.env.local`, por instrucción explícita).

## Resultado real — ejecutada 2026-10-03 (Carlos + coordinador), PARCIAL

Se cargó un `.env.local` real en este worktree (excepción puntual, ya terminado el desarrollo autónomo — `AUTH_SECRET`/`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, las mismas credenciales OAuth que ya usa el CLM, mismo proyecto de Google Cloud) y se probó con la única cuenta real disponible (`paganinicg@gmail.com`, personal):

1. **Login autorizado** (paso 3 de este runbook): Carlos inició sesión real con Google desde el navegador → entró normal a la Bandeja. **OK.**
2. **Cuenta rechazada por baja lógica** (paso 5): se marcó `activo: false` para esa misma cuenta en `mock-catalogos.ts` (temporal, revertido enseguida), se reinició el servidor, Carlos cerró sesión y volvió a loguearse con la misma cuenta de Google → Google confirmó la identidad igual, pero la app mostró "Acceso no autorizado" (`AccessDenied`). **OK** — confirma RA-1/T16': la cuenta de Google decide la identidad, la hoja Usuarios decide el acceso, no al revés.
3. Revertido el cambio, reiniciado el servidor, Carlos volvió a loguearse sin problema con la misma cuenta. **OK.**

**No se pudo probar** (sin una segunda cuenta de Google real disponible al momento de la prueba):
- El caso con una cuenta de **Workspace** (paso 4) — sigue sin confirmarse que el dominio de la cuenta no influye, aunque es muy poco probable que sí lo haga: Auth.js con el provider Google no distingue tipos de cuenta, y el chequeo de autorización (`puedeIniciarSesion`) no mira el dominio del email en ningún punto del código.
- El caso de una cuenta de Google válida que **nunca estuvo** en la hoja Usuarios (paso 6, T16') — no se probó con una cuenta distinta, pero el código ejecuta exactamente la misma rama (`puedeIniciarSesion` devuelve `false` tanto si `usuario` es `undefined` como si `usuario.activo === false`, ver `src/lib/acceso-modulo.ts` líneas 31-35), así que el caso 2 de arriba ya ejercita la misma lógica.

**Queda pendiente** (ver `docs/PENDIENTES-HUMANOS.md`, punto 5): repetir los pasos 4 y 6 con una segunda cuenta de Google real (idealmente de Workspace) cuando haya una disponible, para tener la confirmación empírica completa.

## Qué confirma

Que Auth.js (ya implementado en `src/auth.ts`) acepta tanto una cuenta `@gmail.com` personal como una cuenta de Google Workspace, y que en ambos casos la decisión de autorizar o no el acceso la toma la lista blanca (tabla Usuarios ampliada con `rol_alquileres`/`activo`, D12), no el dominio de la cuenta — cerrando el punto abierto 1 del PRD v1 (ya resuelto en el v2.1, sección 10: "Auth.js acepta cuentas Gmail personales").

## Prerrequisitos

1. Credenciales OAuth de Google cargadas en `.env.local` (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) — ver `INSTRUCTIVO_CONFIGURACION.md`, sección 0.5.
2. Dos cuentas de Google de prueba:
   - Una cuenta `@gmail.com` personal cualquiera.
   - Una cuenta de un dominio de Google Workspace (si no hay uno disponible, puede ser cualquier cuenta corporativa con Workspace).
3. Ambas cuentas dadas de alta en la hoja Usuarios (CLM, ampliada) con `rol_alquileres` no vacío y `activo` = TRUE (o vacío).

## Pasos

1. `npm run dev` con `.env.local` completo.
2. Abrir `http://localhost:3000/login` en una ventana de incógnito.
3. Iniciar sesión con la cuenta `@gmail.com` personal → debe entrar al módulo de Alquileres con el rol que tenga asignado.
4. Repetir en otra ventana de incógnito con la cuenta de Workspace → mismo resultado.
5. Dar de baja (`activo = FALSE`) a una de las dos cuentas en Usuarios y repetir el login → debe rechazarse ("Acceso no autorizado"), con el intento registrado (ver LOG_CAMBIOS / tabla de auditoría del CLM).
6. Probar con una cuenta de Google válida que **no** esté en absoluto en la hoja Usuarios → mismo resultado que el paso 5 (T16' del PRD v2.1).

## Resultado esperado

Los tres casos (Gmail personal activo, Workspace activo, cuenta sin fila o inactiva) se comportan exactamente como describe RA-1/T16' — la cuenta de Google decide la identidad, la hoja Usuarios decide el acceso.

## Quién puede correrlo

Un humano con acceso a Google Cloud Console (para las credenciales OAuth) y a al menos dos cuentas de Google reales para probar.
