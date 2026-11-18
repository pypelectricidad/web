---
name: pyp-n8n
description: Operación del n8n de PyP en Coolify (workflows WhatsApp/Telegram, webhook Meta, túnel Cloudflare, pyp-pic). Usar cuando haya que revisar ejecuciones, modificar workflows, tocar el webhook de Meta/WhatsApp, el túnel o la conectividad n8n↔pyp-pic.
argument-hint: "[estado | ejecuciones | webhook | tunel | deploy]"
allowed-tools:
  - read
  - exec
  - grep
  - glob
triggers:
  - user
  - model
---

# pyp-n8n

Referencia operativa del n8n self-hosted de PyP Electricidad (Coolify, LAN).
Todo lo que sigue está verificado en producción (oct–nov 2026).

## Infraestructura

| Recurso | Valor |
|---|---|
| Coolify | `http://192.168.101.241:8000` — ver skill `coolify` para CLI/API |
| Servicio n8n | uuid `z8in9r0n1zd2iq0fmefupufz` — `n8nio/n8n:2.10.2` + runners + `postgres:16-alpine` |
| URL n8n (LAN) | `http://n8n.192.168.101.241.sslip.io` (Traefik por Host, HTTP plano) |
| Red Docker compartida | `z8in9r0n1zd2iq0fmefupufz` — n8n, `pyp-pic` y `cloudflared-pyp` conviven ahí |
| Contenedor pyp-pic | `pyp-pic` (Node 20, `--restart always`, vols `pyp-pic-data`/`pyp-pic-output`, **puerto 3000 publicado en LAN** `0.0.0.0` desde 2026-11-17) — webhook interno `http://pyp-pic:3000/webhook`, panel admin `http://192.168.101.241:3000/panel` (basic auth, ver skill pyp-whatsapp) |
| Tabla `pyp_ots` | OTs cerradas espejadas en Postgres (presentismo/obras/ubicaciones para el panel). Escritura fire-and-forget desde `archiveOT()` de pyp-pic; migración histórica con `scripts/migrate-ot-history.mjs` |
| Contenedor túnel | `cloudflared-pyp` — **named tunnel `pyp`** (`tunnel run --token`, remotamente gestionado), `--restart always` |
| Postgres n8n | credencial `sZrV4eyvcEFOdQ1p` "n8n Postgres (Coolify)" |

## Workflows activos

| Workflow | ID | Trigger |
|---|---|---|
| `WhatsApp PyP - Herramientas` | `pypHerramientas001a` | Webhook Meta `GET/POST /webhook/pyp-agentes` |
| `Telegram Bot PyP - Registro de visitas` | `teOidtZ2PvbqPyjn` | Schedule trigger (polling `getUpdates`) |

- Artefactos fuente en `pyp-pic/scripts/`: `gen-n8n-herramientas.mjs` (genera `n8n-herramientas-workflow.json`, 74 nodos) y `n8n-telegram-workflow.json`.
- Tablas: `her_*` (herramientas) y `bot_*` (telegram) — separadas a propósito, no mezclar.
- **No crear un segundo workflow con el mismo bot token de Telegram** (dos `getUpdates` compiten por la cola) ni otro listener del mismo webhook Meta.

## Cadena WhatsApp (verificada end-to-end)

```
WhatsApp → Meta Cloud API → https://webhook.pypelectricidad.com.ar/webhook/pyp-agentes
  → cloudflared-pyp (named tunnel) → n8n (webhook POST → Responder 200 inmediato → proceso async)
  → clasificación: herramientas (Postgres her_*) | reenvío → pyp-pic (PIC/OT)
  → respuesta vía Graph API (WHATSAPP_API_TOKEN + PHONE_NUMBER_ID)
```

- GET verifica `hub.verify_token` → devuelve `hub.challenge`; token malo → 403.
- Clasificador: comandos de herramientas se resuelven en n8n; el resto se reenvía a `PYP_PIC_WEBHOOK_URL` con header `x-pyp-agent` (secreto compartido; `pyp-pic/src/server.js` acepta `{phone,name,text}` normalizado con ese header).
- **Comportamiento conocido:** saludos tipo "hola" NO matchean herramientas → van a PIC/OT, que responde "¿para qué proyecto...". Es by-design del clasificador; si se quiere greeting propio, agregar regla en el generador.

## Túnel y webhook de Meta (estado: **named tunnel** desde 2026-11-18)

- `pypelectricidad.com.ar` está en DNS de **Cloudflare** (NS `vern/saanvi.ns.cloudflare.com`); zona `fa6db1baaf38aa292f3bfb84b7ace94d`, cuenta `d9cd14225e2e51cde93b29de738ef07d`. El sitio estático sigue en GitHub Pages.
- **Túnel `pyp`** id `ccb6c694-4fc6-48d2-ac68-20df930b21ad`, remotamente gestionado (`config_src=cloudflare`). Ingress:
  - `webhook.pypelectricidad.com.ar` → `http://n8n:5678` (webhook Meta)
  - `panel.pypelectricidad.com.ar` → `http://pyp-pic:3000` (panel admin, HTTPS válido — base para PWA)
  - catch-all → `http_status:404`
- DNS: CNAME `webhook` y `panel` → `ccb6c694-...cfargotunnel.com` (proxied).
- Tokens: API token CF (`cfut_…`, perms `Account: Cloudflare Tunnel Edit` + `Zone: DNS Edit` en la zona) en `C:\Users\mevan\web\.cf-token.txt`; run-token del túnel en `C:\Users\mevan\web\.cf-tunnel-token.txt` y `/root/.cf-tunnel-token` en la VM. **No versionar ni exponer.**
- Recrear el contenedor si hace falta: `docker run -d --name cloudflared-pyp --restart always --network z8in9r0n1zd2iq0fmefupufz cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$(cat /root/.cf-tunnel-token)"`.
- **Watcher desactivado:** cron borrado, script queda como `/root/watch-tunnel.sh.disabled` (con named tunnel la URL ya no cambia; reactivarlo solo si se vuelve a quick tunnel).
- Verificación manual del callback:
  ```bash
  # desde pyp-pic/.env: WHATSAPP_APP_SECRET, WHATSAPP_WEBHOOK_VERIFY_TOKEN
  curl -X POST "https://graph.facebook.com/v21.0/1139171925283354/subscriptions" \
    -d "access_token=1139171925283354|$WHATSAPP_APP_SECRET" \
    -d "object=whatsapp_business_account" -d "subscribed_fields=messages" \
    -d "callback_url=https://webhook.pypelectricidad.com.ar/webhook/pyp-agentes" -d "verify_token=$VT"
  # {"success":true} = Meta verificó el GET challenge contra el túnel
  ```
- Datos Meta: App `PyP-agentes` ID `1139171925283354`; Phone Number ID `1428563193670439`; WABA `1461781569400622`; número `+54 9 381 202-2035`.
- Secretos en `pyp-pic/.env`: `WHATSAPP_API_TOKEN` (System User `pyp-bot`, permanente `expires_at:0`), `WHATSAPP_APP_SECRET`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. **Rotar los expuestos en la conversación original.**

## Acceso SSH a la VM (para logs/docker)

La VM no acepta la clave personal; usar la del servidor Coolify:

```bash
~/bin/coolify.exe private-key list --format json   # uuid xro8sijx8jpwtbrqnmehkzig "localhost's key"
~/bin/coolify.exe private-key get <uuid> --format json | python -c "import json,sys;print(json.load(sys.stdin)['private_key'])" > /tmp/k && tr -d '\r' < /tmp/k > /tmp/k2 && chmod 600 /tmp/k2
ssh -i /tmp/k2 root@192.168.101.241
```

- **Ojo CRLF:** la salida de coolify.exe trae `\r\n` → ssh falla con `error in libcrypto: unsupported`. Convertir a LF (`tr -d '\r'`).
- **Puerto 22 puede quedar filtrado** (timeout, no refused): pasa tras varios intentos de auth fallidos (fail2ban). Coolify :8000 sigue OK. Reintentar más tarde o desde otra IP; no hay forma de desbloquear sin consola ESXi.
- Comandos útiles en la VM: `docker ps`, `docker logs cloudflared-pyp`, `crontab -l`, `psql` dentro del contenedor postgres de n8n para inspeccionar `execution_entity`/`her_*`/`bot_*`.

## Env vars de n8n (configuradas)

`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `PYP_PIC_WEBHOOK_URL` (`http://pyp-pic:3000/webhook`).

**Gotchas verificados:**
- `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` — si está en true, `$env.*` falla en los nodos Code.
- `NODE_FUNCTION_ALLOW_BUILTIN=crypto` en el servicio `task-runners` del compose Coolify (los Code nodes corren en runners externos; sin esto `require('crypto')` falla). Se agregó al `docker_compose_raw` del servicio vía API para que sobreviva redeploys.
- **Firma Meta**: `WebhookPOST` tiene `rawBody: true` y el nodo `Verificar Firma` valida `X-Hub-Signature-256` con HMAC-SHA256 del body crudo (`$input.item.binary.data.data` en base64 — `$binary` y `json.rawBody` NO llegan a los runners externos). Firma inválida → `Responder 403 Firma`. Verificado: firmado→200, sin firma→403.
- Los nodos Webhook necesitan `webhookId` (UUID) **a nivel de nodo**, no solo en `parameters`; si falta, n8n registra paths rotos `workflowId/nodo/path` y el webhook real da 404. Tras importar hay que republicar y limpiar `webhook_entity` si quedaron rutas viejas.
- Nombres de nodo con espacios generan paths con `%20` — evitar o aceptar.
- Postgres: `UPDATE` no puede ir dentro de `FROM (UPDATE...)`; usar CTE (`WITH x AS (UPDATE ... RETURNING ...) SELECT ...`).

## Ver ejecuciones / depurar

- UI: `http://n8n.192.168.101.241.sslip.io/home/executions` (global) o `/workflow/<id>/executions/<execId>` (detalle con datos por nodo).
- El usuario puede loguearse en el navegador Playwright MCP (sesión separada de la normal) — sirve para inspeccionar la UI remotamente.
- **Pendiente:** generar API key en Settings → n8n API para consultar `/api/v1` sin UI.
- Señal de vida: POST al webhook devuelve `{"ok":true}` al instante; la ejecución real sigue async (success en 1-2s si procesó mensaje, ~30ms si fue status update de Meta).

## Troubleshooting rápido

**Si no llegan los mensajes de WhatsApp a n8n, lo primero es revisar el túnel:**

1. `docker logs cloudflared-pyp | tail` en la VM → debe decir `Registered tunnel connection`.
2. Verificar que responde: `curl "https://webhook.pypelectricidad.com.ar/webhook/pyp-agentes?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=x"` → debe dar 403 (si da timeout/530/1033, el túnel está caído).
3. Verificar que Meta apunta a esa URL: re-correr el POST a `/subscriptions` (ver sección túnel).
4. Si el túnel está caído: `docker restart cloudflared-pyp` y repetir desde 1.
5. Recién después revisar n8n (ejecuciones) y los env vars.

Otras causas frecuentes: n8n caído (`docker ps` en la VM), workflow despublicado, o `WHATSAPP_API_TOKEN` revocado (la respuesta fallaría al enviar, no al recibir).

## Actualizar el workflow de Herramientas (deploy)

n8n 2.x versiona workflows: `workflow_entity` (draft + `activeVersionId`) +
`workflow_history` (snapshot por `versionId`) + `workflow_published_version`
(hoy vacía; el puntero real es `activeVersionId` en `workflow_entity`).

```bash
cd pyp-pic
node scripts/gen-n8n-herramientas.mjs          # regenera n8n-herramientas-workflow.json
node scripts/gen-deploy-sql.mjs /tmp/deploy_wf.sql   # emite SQL versionado
scp -i <key> /tmp/deploy_wf.sql root@192.168.101.241:/tmp/
ssh ... "docker exec -i postgresql-z8in9r0n1zd2iq0fmefupufz sh -c 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1' < /tmp/deploy_wf.sql"
ssh ... "docker restart n8n-z8in9r0n1zd2iq0fmefupufz"
```

La REST interna `/rest/workflows/:id` responde 401 desde fetch del navegador
(aunque la UI cargue) — el deploy por SQL + restart es el camino probado.

## Filtro de empleados (whitelist WhatsApp)

El workflow descarta en silencio todo mensaje cuyo `phoneKey` (últimos 10
dígitos) no matchee un `n8n_employees.active`. Tablas y permisos en skill
`pyp-empleados`. Ojo: con la tabla vacía NADIE recibe respuesta — es
intencional. `forward_picot` está apagado para todos los roles hasta definir
la matriz.

## Pendientes conocidos

1. Rotar secretos expuestos (WHATSAPP_API_TOKEN, APP_SECRET, token Playwright MCP, pass Postgres).
2. `QR_DECODE_URL` vacío → fotos/QR se reenvían a PIC/OT; falta microservicio decodificador si se quiere QR local.
3. Workflow no verifica `X-Hub-Signature-256` de Meta (solo verify_token del GET) — recomendado agregar.
4. ~~Named tunnel~~ **resuelto 2026-11-18**: `webhook.` + `panel.pypelectricidad.com.ar` activos vía túnel `pyp`. Falta PWA (manifest + service worker) para aprovechar el HTTPS.
5. Revisar `config/workers.json`, `recipients.json` y datos reales de pyp-pic antes de operación plena.
