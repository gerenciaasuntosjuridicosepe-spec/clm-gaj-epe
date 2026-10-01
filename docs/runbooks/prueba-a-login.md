# Runbook — Prueba técnica (a): login con cuenta @gmail.com personal y de Workspace

PRD v2.1, sección 3, tabla de pruebas técnicas de la Fase 0. **No ejecutada por el desarrollo autónomo**: requiere cuentas de Google reales y credenciales OAuth, que no existen en este worktree (sin `.env.local`, por instrucción explícita).

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
