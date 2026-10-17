# ADR.md

## ADR-005: Aviso de asignación en la pestaña (sin n8n ni WhatsApp)
- Fecha: 2026-10-17
- Estado: Accepted

### Contexto
Se pidió que el vendedor reciba un aviso cuando el coordinador le asigna un pedido, con el panel abierto en una pestaña (aunque esté en segundo plano). Se evaluó usar n8n como intermediario del webhook `WA_NOTIFY_URL`, pero no aporta nada si el aviso es dentro del browser. Además, la Notification API y los service workers exigen contexto seguro: en la LAN por `http://192.168.x.x` no están disponibles (solo en `localhost` de la máquina servidora o con HTTPS futuro).

### Decisión
- El aviso de asignación se resuelve **client-side sobre el realtime ya existente**: en cada `refresh()` se compara la lista anterior con la nueva; para el vendedor, un ticket cuyo id no estaba en su lista = recién asignado (el vendedor solo ve sus asignadas).
- **Suscripción doble** (`backend.subscribe`): `cotizaciones` + `cotizacion_eventos`. Motivo: PB no emite el evento `update` a quien recién gana visibilidad del registro (la asignación), pero sí el `create` del evento `'asignada'`, que ya es visible para el vendedor. Bonus: comentarios e historial refrescan en vivo.
- Al detectarse: tarjeta de aviso fija en la pestaña (click abre el pedido, auto-cierre a los 15 s) + beep por WebAudio (dos tonos, no requiere archivos).
- Bonus donde el contexto lo permite (localhost/HTTPS): `new Notification(...)` con `tag` por pedido y `onclick` que enfoca la pestaña y abre el ticket. El permiso se pide en el gesto de login.
- Auto-curación de la suscripción: al volver el foco a la pestaña se re-suscribe desde cero (sobrevive a reinicios de PB y suspensiones de PC).
- **Bugfix relacionado**: el hook `notify_assign.pb.js` usaba `$os.Getenv` (inexistente en JSVM; es `process.env` / `$os.getenv` minúscula) y tiraba TypeError en cada asignación → el PATCH respondía 400 aunque guardaba el cambio (el panel mostraba "No se pudo asignar" aunque sí asignaba). Corregido a `process.env.*`.
- `pb_hooks/notify_assign.pb.js` y la vía `WA_NOTIFY_URL`/n8n quedan como opción para canales externos (WhatsApp/push con browser cerrado), sin cambios funcionales.
- **Deploy**: `dist/` se copia a la raíz de `pb_public/` (además de `pb_public/web/` para la URL `/web/panel/`): el HTML referencia `/_astro/` absoluto, así que sin copia en raíz el panel servía sin JS/CSS (bug preexistente del deploy).

### Consecuencias
- (+) Cero infraestructura nueva: mismo realtime, misma build, funciona en toda la LAN por HTTP.
- (+) No depende de tokens de Meta ni de servicios externos.
- (−) Requiere el panel abierto en una pestaña; con el browser cerrado no llega nada (para eso está el hook + n8n/push).
- (−) La notificación nativa del SO solo aparece en `localhost` o cuando se migre a HTTPS.

## ADR-004: Realtime PocketBase, badge de no-leídos y hook de aviso por WhatsApp
- Fecha: 2026-09-17
- Estado: Accepted

### Contexto
En la prueba LAN los usuarios tenían que hacer F5 para ver novedades, y se pidió aviso al vendedor por WhatsApp al asignarle un pedido.

### Decisión
- Suscripción realtime de PocketBase (`cotizaciones` `*`): cualquier cambio refresca el tablero de todos los clientes conectados sin recargar.
- Badge estilo WhatsApp en el título de la pestaña: `(n) Cotizaciones — PyP` cuenta tickets con `updated_at` posterior a la última vez que el usuario tuvo la pestaña visible (localStorage por usuario).
- Aviso WhatsApp **preparado, inactivo por defecto**: `pb_hooks/notify_assign.pb.js` corre server-side al asignar un pedido. Dos destinos por variables de entorno: `WA_NOTIFY_URL` (webhook genérico: Make/Zapier/n8n) o `WA_TOKEN`+`WA_PHONE_ID`+`WA_TEMPLATE` (WhatsApp Cloud API de Meta, requiere template aprobado). El teléfono del vendedor se carga en el panel (sección Vendedores).

### Consecuencias
- (+) Cero polling; la LAN se siente instantánea.
- (+) El token de Meta nunca toca el cliente: el hook corre en el servidor PB.
- (−) El badge usa `updated_at`: también cuenta movimientos de estado, no solo altas — simplificación deliberada.
- (−) WhatsApp Cloud API exige template aprobado y ventana de 24 h para mensajes iniciados por la empresa; la alternativa webhook queda como vía intermedia.

## ADR-003: Vendedores con login y flujo de cotización por adjuntos + revisión del supervisor
- Fecha: 2026-09-16
- Estado: Accepted — modifica "vendedores sin login" de ADR-001 y el flujo de estados

### Contexto
La prueba real mostró que los vendedores (mostrador) sí operan el panel: cotizan en sus propios sistemas y necesitan recibir el pedido tal como llegó, no re-transcrito. Recepción deja de cargar ítem por ítem: adjunta el pedido original (texto pegado de WhatsApp, Excel, PDF o captura). El coordinador asigna, el vendedor entrega la cotización en PDF, el supervisor la revisa antes de que vuelva a recepción.

### Decisión
- Rol `vendedor` en `users`; cada registro de `vendedores` puede vincularse a una cuenta (`vendedores.user`). Vendedores sin cuenta siguen existiendo como asignables nominales.
- Pedido = `detalle` (texto libre pegado) + `captura` como adjuntos múltiples (imágenes, PDF, Excel, CSV, TXT; máx. 5 × 8 MB). El formulario acepta pegar capturas con Ctrl+V.
- Estados: `pendiente` → `asignada` → `en_proceso` → `por_revisar` → `cotizada` → `enviada`; `descartada` lateral. `por_revisar` solo se alcanza subiendo `cotizacion_pdf` (el vendedor entrega; el coordinador aprueba o devuelve). `enviada` lo marca recepción al responderle al cliente.
- Nota sobre reglas PB: el `updateRule` se evalúa contra el registro original (no el nuevo valor), así que recepción puede modificar cualquier ticket en `cotizada` — la UI solo ofrece "Marcar enviada"; restricción de transición exacta no es expresable en reglas PB.
- Reglas PocketBase: el vendedor solo lista/edita cotizaciones donde `asignado_a.user = @request.auth.id`; recepción edita solo sus pendientes; coordinador todo.
- Fase futura anotada (no implementada): adjuntar OC del cliente al aceptar, rol/área `deposito` para cumplimiento, seguimiento global del coordinador.
- Mejora futura anotada (no implementada): vista "Historial" tipo tabla con filtros por fecha/vendedor/estado para consultar cotizaciones viejas cuando el volumen haga inmanejable la columna `enviada`; el buscador actual (cliente/comprador/ref/número, sobre todas las columnas) cubre el corto plazo. Habilitaría además reportes (tiempo de respuesta, cotizaciones por vendedor).

### Consecuencias
- (+) El pedido viaja íntegro: el vendedor ve exactamente lo que mandó el cliente.
- (+) Trazabilidad completa: cada cambio de estado queda en `cotizacion_eventos` con actor.
- (−) Las reglas PB son a nivel registro, no por campo: un vendedor autenticado podría técnicamente modificar otros campos de sus tickets vía API directa — riesgo aceptable en herramienta interna LAN.
- (−) `cotizacion_items` queda legacy: el esquema se mantiene para tickets históricos pero el formulario ya no los crea.

## ADR-002: Backend por defecto pasa a PocketBase auto-hospedado en el servidor de la empresa
- Fecha: 2026-09-16
- Estado: Accepted — modifica la parte de persistencia de ADR-001

### Contexto
El requisito cambió: el sistema debe funcionar independiente de una PC de desarrollo y vivir en el servidor físico de la empresa (LAN primero, exposición a internet después). Mantener Postgres/Supabase cloud agrega dependencia externa que el usuario no quiere como camino principal.

### Decisión
- **PocketBase** como backend primario: un ejecutable, SQLite, auth + storage incluidos; sirve además el build estático del panel desde `pb_public/web/`.
- Autodetección de backend en `src/lib/panel/backend.js`: `PUBLIC_PB_URL` → same-origin `/api/health` → Supabase → demo localStorage. Un mismo build sirve en todos los escenarios.
- Setup de colecciones/reglas/usuarios: `scripts/pb-setup.mjs` (idempotente, corre una vez contra el server).
- Supabase queda como backend alternativo soportado (`supabase/schema.sql` se mantiene).

### Consecuencias
- (+) Cero dependencia cloud; datos quedan en la empresa; backup = copiar `pb_data/`.
- (+) Deploy = copiar `pocketbase.exe` + `pb_public/` al servidor y correr el exe.
- (−) Acceso remoto futuro requiere exponer el puerto con HTTPS (reverse proxy).
- (−) `numero` correlativo se calcula client-side (max+1): colisión posible si dos cargan en el mismo segundo — aceptable a este volumen.

## ADR-001: Panel de cotizaciones client-side sobre Supabase, dentro del sitio Astro
- Fecha: 2026-09-16
- Estado: Accepted — persistencia modificada por ADR-002 (PocketBase primario, Supabase alternativo)

### Contexto
Los pedidos de cotización entran por WhatsApp y se retransmiten por WhatsApp a ventas: canal lineal que genera embudo y pérdida de pedidos cuando varios compradores escriben en simultáneo. Se necesita una cola de trabajo con tickets, sin backend propio que mantener, accesible desde internet, conviviendo con el sitio estático en GitHub Pages. WhatsApp sigue fuera del sistema (carga y respuesta manuales).

### Decisión
- El panel vive en `src/pages/panel/` dentro del mismo repo Astro (un repo, un deploy, mismo sistema visual).
- Persistencia: **Supabase** (Postgres + Auth email + Storage para capturas) consumido directo desde el browser con `@supabase/supabase-js` + RLS; sin servidor.
- Interactividad con **Alpine.js** (sin framework pesado: el proyecto no usa React).
- Sin credenciales configuradas, el panel corre en **modo demo** sobre localStorage para probar la UI sin cuenta.
- Vendedores sin login en v1: `asignado_a` referencia tabla `vendedores` (nombre); esquema preparado para migrar a `profiles` si en v2 se les da acceso.

### Consecuencias
- (+) Cero backend que operar; costo $0 en tier gratuito; acceso desde cualquier lugar.
- (+) Un solo repo; el panel hereda tokens de diseño existentes.
- (−) La seguridad depende enteramente de políticas RLS bien escritas (son la única barrera).
- (−) Lógica de datos duplicada levemente entre adapter Supabase y demo localStorage.
- (−) Requiere setup manual único: crear proyecto Supabase, correr `supabase/schema.sql`, crear usuarios.
