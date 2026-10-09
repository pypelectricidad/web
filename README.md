# PyP Electricidad — Web

## Propósito
Sitio público de PyP Electricidad (catálogo, tienda, blog, stand) en Astro estático, desplegado en GitHub Pages con dominio propio (`pypelectricidad.com.ar`). Incluye un **panel interno de cola de cotizaciones** en `/panel` para convertir pedidos recibidos por WhatsApp en tickets con estado y responsable.

## Stack Tecnológico
- Runtime / Lenguaje: Node.js 20+, JavaScript/TypeScript, Astro 4 (`output: 'static'`)
- Estilos: Tailwind CSS 3 (`tailwind.config.mjs`, paleta `brand`/`steel`/`accent`)
- Panel interno: Alpine.js; backend intercambiable vía adaptador (`src/lib/panel/backend.js`)
- Persistencia del panel (por prioridad de detección): PocketBase same-origin o `PUBLIC_PB_URL` → Supabase → demo localStorage

## Deploy del panel en el servidor (PocketBase)
1. Descargar `pocketbase` (Windows o Linux) en una carpeta del servidor, ej. `C:\pyp-panel` o `/opt/pyp-panel`.
2. `pocketbase superuser upsert admin@pyp.local <password>` (una sola vez).
3. `pocketbase serve --http 0.0.0.0:8090` — dejar corriendo (NSSM/Task Scheduler en Windows, systemd en Linux).
4. `node scripts/pb-setup.mjs --url http://localhost:8090 --admin admin@pyp.local --pass <password>` — crea colecciones, reglas y usuarios.
5. `npm run build` y copiar el contenido de `dist/` a `pb_public/` dentro de la carpeta de PocketBase.
6. Copiar `pb_hooks/` junto al ejecutable (aviso WhatsApp al asignar; inactivo sin variables de entorno).
7. Panel: `http://<ip-del-servidor>:8090/panel/` desde cualquier PC de la LAN. Admin PB: `/_/`.
8. Backup: copiar la carpeta `pb_data/` con el servicio detenido.

### Aviso WhatsApp al asignar (opcional)
`pb_hooks/notify_assign.pb.js` envía un aviso al vendedor cuando se le asigna un pedido. Se activa con variables de entorno del proceso PocketBase:
- `WA_NOTIFY_URL`: webhook genérico que recibe el payload JSON (ej. Make/Zapier/n8n para reenviar por WhatsApp).
- o `WA_TOKEN` + `WA_PHONE_ID` (+ `WA_TEMPLATE`, default `aviso_cotizacion`): WhatsApp Cloud API de Meta.
Requiere el teléfono del vendedor cargado en el panel (sección Vendedores, formato 54911…).

### Usuarios y flujo del panel
Roles: `recepcion` (carga pedidos: texto pegado de WhatsApp + adjuntos Excel/PDF/captura), `coordinador` (asigna a vendedores, aprueba cotizaciones) y `vendedor` (ve solo sus asignados, cotiza en su sistema y adjunta el PDF). Estados: `pendiente` → `asignada` → `en_proceso` → `por_revisar` → `cotizada` → `enviada` (+ `descartada`). Usuarios seed en `scripts/pb-setup.mjs` — cambiar contraseñas antes de producción.

## Configuración del Entorno
Ver `.env.example`. Sin variables, el panel corre en modo demo.

## Inicialización Local
1. `npm install`
2. `npm run dev` → sitio en `http://localhost:4321/`, panel en `/panel`
3. `npm run build` → `dist/` (deploy: GitHub Pages)

## Estructura
- `src/pages/` — sitio público (es + `/en`), `src/pages/panel/` — app interna
- `src/data/productos.json` — catálogo de productos del sitio
- `supabase/schema.sql` — esquema y políticas a ejecutar en el proyecto Supabase (backend alternativo)
- `scripts/pb-setup.mjs` — setup/migración idempotente de PocketBase (colecciones, reglas, usuarios)
