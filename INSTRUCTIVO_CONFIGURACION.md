# Instructivo de configuración — CLM GAJ (EPE)

La integración con Google Sheets ya está programada (`src/lib/data/google-sheets-provider.ts` + `src/lib/data/sheets-schema.ts`) y el proyecto la activa solo con variables de entorno — no hace falta escribir código. Este documento cubre lo que sí queda como tarea manual: crear la planilla, generar credenciales, correr un script que arma las hojas y columnas automáticamente, y desplegar en Vercel.

## 0. Antes de empezar

Si en algún momento se creó una carpeta `node_modules` a medio instalar dentro de este proyecto, borrala manualmente desde el Explorador de Windows antes de seguir. Requisito: Node.js 20 o superior.

## 0.5 Configurar el login con Google (Auth.js)

El acceso a la app requiere iniciar sesión con una cuenta de Google. La identidad la confirma Google; el rol lo resuelve la tabla de Usuarios (si tu email no está cargado ahí, el login se rechaza aunque la cuenta de Google sea válida — ver sección 2 más abajo para cargar usuarios).

1. Generar el secreto de sesión: `npx auth secret`. Esto agrega (o pide agregar) `AUTH_SECRET` a `.env.local`.
2. En [Google Cloud Console](https://console.cloud.google.com/), en el mismo proyecto que uses para Sheets (o uno nuevo): "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth".
   - Tipo de aplicación: **Aplicación web**.
   - Orígenes autorizados de JavaScript: `http://localhost:3000`.
   - URI de redirección autorizados: `http://localhost:3000/api/auth/callback/google`.
   - Si más adelante se despliega en Vercel, hay que agregar ahí también el origen y el callback con el dominio de producción.
3. Copiá el **Client ID** y el **Client secret** que te muestra Google al crear la credencial.
4. Completá en `.env.local`:

```
AUTH_SECRET=<generado en el paso 1>
AUTH_GOOGLE_ID=<Client ID del paso 3>
AUTH_GOOGLE_SECRET=<Client secret del paso 3>
```

Sin estas tres variables, `npm run dev` levanta igual pero el botón "Continuar con Google" no funciona.

## 1. Instalar y correr el proyecto en local (con datos de ejemplo)

```
cd C:\proyectos\clm-gaj-epe
npm install
npm run dev
```

Abrí `http://localhost:3000`. Redirige a `/login` (hace falta una cuenta de Google dada de alta en Usuarios y las variables del paso 0.5). Sin las variables de Google Sheets, los datos que vas a ver después de iniciar sesión son los de ejemplo (mock) — funciona igual, es la forma de probar la app antes de tener la planilla real.

## 2. Conectar Google Sheets

### 2.1 Crear la planilla (vacía)

Creá una planilla nueva en Google Sheets — no hace falta crear hojas ni columnas a mano, eso lo hace el script del paso 2.4. Copiá el ID de la planilla: es la cadena larga en la URL entre `/d/` y `/edit`.

**Cuando tengas ese link/ID, pasámelo y yo mismo completo el resto de la configuración con vos** (correr el script de aprovisionamiento, cargar datos iniciales si hace falta, verificar que todo lea bien).

### 2.2 Crear credenciales de acceso (cuenta de servicio)

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/) y creá un proyecto (o usá uno existente).
2. Habilitá la **Google Sheets API** ("APIs y servicios" → "Habilitar APIs y servicios" → buscar "Google Sheets API").
3. "Credenciales" → "Crear credenciales" → "Cuenta de servicio" (ej. nombre `clm-gaj-sheets`).
4. Entrá a la cuenta de servicio creada → pestaña "Claves" → "Agregar clave" → "Crear clave nueva" → formato **JSON**. Se descarga un archivo — guardalo fuera del repositorio, nunca se sube a Git.
5. Copiá el email de la cuenta de servicio (termina en `.iam.gserviceaccount.com`).
6. Abrí la planilla del paso 2.1 y compartila con ese email como **Editor**.

### 2.3 Variables de entorno

Copiá `.env.local.example` a `.env.local` (este archivo ya está en `.gitignore`, nunca se sube) y completá:

```
GOOGLE_SHEETS_SPREADSHEET_ID=<el ID de la planilla del paso 2.1>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<el email de la cuenta de servicio>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<el campo private_key del JSON descargado>"
```

El `private_key` del JSON trae saltos de línea como `\n` literales — pegalo tal cual viene, entre comillas, en una sola línea.

### 2.4 Crear las hojas y columnas automáticamente

Con `.env.local` completo, corré:

```
npm run setup:sheet
```

Esto conecta con la planilla y crea (si no existen) las hojas `Contratos`, `Historial`, `Hitos`, `Sectores`, `TiposContrato` y `Usuarios`, con la fila de encabezados correspondiente a cada una — el mismo esquema que ya sabe leer `google-sheets-provider.ts`. No pisa datos si las hojas ya existen, solo agrega lo que falte.

Si preferís pasar el ID sin tenerlo en `.env.local` todavía: `npm run setup:sheet -- <SPREADSHEET_ID>`.

### 2.5 Verificar

Reiniciá `npm run dev`. La app detecta las tres variables de entorno automáticamente (`googleSheetsConfigurado()` en `src/lib/data/provider.ts`) y empieza a leer/escribir en la planilla real en vez del mock — no hay ningún flag ni cambio de código que hacer. Si algo falla, el error de la API de Google se muestra en la consola del servidor (`npm run dev`), con el código HTTP y el mensaje tal cual lo devuelve Google.

## 3. Cómo quedó armada la integración (para referencia)

- `src/lib/data/sheets-schema.ts` — nombres de hoja, columnas y funciones de mapeo fila ↔ objeto. Es la única fuente de verdad sobre la estructura de la planilla; si se agrega un campo al modelo de datos (`src/lib/types.ts`), se agrega acá y en el script de setup.
- `src/lib/data/google-sheets-client.ts` — autenticación (cuenta de servicio) y llamadas HTTP a la API de Sheets. Usa `google-auth-library` + `fetch`, no el paquete `googleapis` completo (ese paquete empaqueta el cliente de todas las APIs de Google — Drive, Calendar, YouTube, etc. — y su volumen de tipos hacía que el build tardara varios minutos; con `google-auth-library` sola alcanza).
- `src/lib/data/google-sheets-provider.ts` — implementación de `ContratosProvider` sobre esas hojas: `listar`, `obtener`, `crear`, `actualizar`.
- `src/lib/data/provider.ts` — `getContratosProvider()` elige automáticamente Google Sheets o mock según haya o no variables de entorno.
- `src/app/api/contratos/route.ts` — Route Handler que expone `GET`/`POST`. Es el único puente entre el navegador y el provider: como `google-auth-library` necesita Node (no corre en el navegador), cualquier pantalla que necesite crear o modificar un contrato llama a esta API por `fetch`, nunca importa el provider directamente. Ya está conectado: el formulario de "Nueva solicitud" hace esto de punta a punta.
- Las páginas de lectura (Bandeja, Contratos, Alertas, Auditoría) son Server Components: llaman a `getContratosProvider().listar()` directamente en el servidor y le pasan los datos ya resueltos a un componente de cliente para el filtrado/interactividad. Todas están marcadas `export const dynamic = "force-dynamic"` para que nunca sirvan una versión vieja cacheada — cada entrada a la página vuelve a leer la planilla.

**Limitaciones que esta implementación no resuelve porque son inherentes a elegir Sheets como almacenamiento** (ya documentadas como riesgos aceptados en el PRD, sección 8.2):

- Sin bloqueo de fila real: dos personas editando el mismo contrato a la vez pueden pisarse. `actualizar()` relee la fila antes de escribir para acortar la ventana de conflicto, pero no la elimina.
- Sin transacciones: crear un contrato y su historial son llamadas separadas a la API; si la segunda falla, quedan desincronizadas.
- Los permisos por rol se filtran en el código de la aplicación al leer las filas — cualquiera con acceso directo a la planilla (o a la clave de la cuenta de servicio) ve todos los datos igual.

## 4. Desplegar en Vercel

1. Subí el proyecto a un repositorio de GitHub (Vercel se conecta a un repo, no a una carpeta local).
2. En [vercel.com](https://vercel.com), "Add New… → Project" e importá el repositorio.
3. En "Environment Variables", cargá las tres del paso 2.3.
4. Deploy. Vercel detecta Next.js automáticamente.

Recordatorio del PRD (7.1/8.2): el plan gratuito de Vercel no tiene tareas de fondo programadas, así que las alertas de vencimiento se calculan cuando alguien entra a la aplicación, no a una hora fija del día — decisión ya aceptada, nada para resolver acá.

## 5. Qué falta más allá de esto

La carga real de asignaciones de sector emisor de Acto Administrativo por tipo de contrato (tarea de Jurídicos, no de desarrollo — PRD sección 11), y el CRUD real de usuarios desde la UI de Admin (hoy la tabla de Usuarios se edita manualmente en el mock o en la hoja de Sheets, incluyendo el campo `email` que determina quién puede iniciar sesión).
