CLM — Sistema de Gestión del Ciclo de Vida de Contratos de la Gerencia de Asuntos Jurídicos (EPE).

Construido a partir de `PRD_CLM_EPE.docx` y `DESIGN_SYSTEM_CLM_EPE.md`. Next.js (App Router) + TypeScript + Tailwind CSS v4 + Radix UI.

## Estado actual

Funciona de punta a punta con datos de ejemplo (mock, en `src/lib/data/mock-*.ts`): Bandeja de tareas, Contratos (con filtros por abogado a cargo, sector requirente y tipo), Alertas de vencimiento, Nueva solicitud, detalle de contrato con flujo de etapas, y las pantallas de administración (sectores, tipos de contrato, usuarios, auditoría). El login es con Google (Auth.js): el email autenticado se busca en la tabla de Usuarios para resolver el rol real (sección 6.7 del PRD) — ya no hay selector de rol simulado. El filtrado por rol y las validaciones de escritura corren en el servidor, no solo en la UI.

Todavía no está conectado a Google Sheets ni desplegado en Vercel, y falta cargar las credenciales OAuth de Google para que el login funcione — ver `INSTRUCTIVO_CONFIGURACION.md` para esos pasos.

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
