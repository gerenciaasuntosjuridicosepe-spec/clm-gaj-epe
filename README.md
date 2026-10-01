CLM — Sistema de Gestión del Ciclo de Vida de Contratos de la Gerencia de Asuntos Jurídicos (EPE).

Construido a partir de `PRD_CLM_EPE.docx` y `DESIGN_SYSTEM_CLM_EPE.md`. Next.js (App Router) + TypeScript + Tailwind CSS v4 + Radix UI.

## Estado actual

Funciona de punta a punta con datos de ejemplo (mock, en `src/lib/data/mock-*.ts`): Bandeja de tareas, Contratos (con filtros por abogado a cargo, sector requirente y tipo), Alertas de vencimiento, Nueva solicitud, detalle de contrato con flujo de etapas, y las pantallas de administración (sectores, tipos de contrato, usuarios, auditoría). El login es con Google (Auth.js): el email autenticado se busca en la tabla de Usuarios para resolver el rol real (sección 6.7 del PRD) — ya no hay selector de rol simulado. El filtrado por rol y las validaciones de escritura corren en el servidor, no solo en la UI.

La app elige automáticamente entre Google Sheets y datos mock según haya o no las tres variables de entorno de Sheets cargadas (`googleSheetsConfigurado()`, ver `src/lib/data/google-sheets-client.ts`) — no hay ningún flag ni cambio de código para pasar de un modo al otro. **Este checkout concreto** puede estar conectado a una planilla real y desplegado en Vercel, o puede no estarlo (por ejemplo, un worktree de desarrollo sin `.env.local`): verificá si existe `.env.local` en la raíz del proyecto y si las variables de la sección 2.3 de `INSTRUCTIVO_CONFIGURACION.md` están cargadas (localmente) o configuradas (en Vercel, para producción) antes de asumir el estado de un checkout en particular. En producción, si esas variables faltaran, la app no arranca (ver `src/instrumentation.ts`, F0-4) — nunca sirve el mock en ese ambiente.

## Correr en local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/lib/types.ts` — modelo de datos del contrato (PRD sección 4).
- `src/lib/permisos.ts` — roles y matriz de visibilidad por etapa (PRD sección 3/6.7).
- `src/lib/data/provider.ts` — capa de acceso a datos; único punto a tocar para conectar Google Sheets.
- `src/components/domain/` — componentes propios del sistema (semáforo, flujo de etapas, KPI card, historial de auditoría).
- `src/components/ui/` — primitivos de interfaz (botón, badge, input, tabs, tooltip, dropdown, dialog, drawer).
- `src/app/` — páginas (App Router).
