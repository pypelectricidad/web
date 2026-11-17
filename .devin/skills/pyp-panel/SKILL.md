---
name: pyp-panel
description: Acceso y operación del panel de cotizaciones PyP (PocketBase desplegado en el servidor LAN vía Coolify). Usar cuando haga falta conectarse al panel, verificar su estado, consultar la API, provisionar usuarios o redesplegar.
argument-hint: "[verificar | api | provision | deploy]"
allowed-tools:
  - read
  - exec
  - grep
  - glob
triggers:
  - user
  - model
---

# pyp-panel

Skill de acceso al panel interno de cotizaciones de PyP Electricidad.
Cualquier agente que necesite hablar con el panel en el servidor, verificar su
salud, crear datos de prueba o redesplegarlo usa esta referencia.

## Instancias

| Entorno | Base URL | Panel | Admin PB |
|---|---|---|---|
| Servidor (Coolify, referencia) | `http://panel.192.168.101.241.sslip.io` | `/panel/` | `/_/` |
| Local dev (PC mevan, si corre) | `http://localhost:8090` | `/panel/` | `/_/` |

Ambas sirven el mismo build; el dominio `*.sslip.io` resuelve a la IP LAN
`192.168.101.241`. **Solo HTTP dentro de la LAN** — sin HTTPS todavía.

## Verificación rápida

```bash
curl -s http://panel.192.168.101.241.sslip.io/api/health   # {"message":"API is healthy."}
curl -s -o /dev/null -w "%{http_code}" http://panel.192.168.101.241.sslip.io/panel/   # 200
```

## API PocketBase

- Auth de usuarios del panel: `POST /api/collections/users/auth-with-password`
  body `{"identity": "<email>", "password": "<pass>"}` → `{token, record}`.
- Auth de superuser: `POST /api/collections/_superusers/auth-with-password`.
- Colecciones: `clientes`, `vendedores`, `cotizaciones`, `cotizacion_items`,
  `cotizacion_eventos`, `users` (campo `rol`).
- Realtime: SSE en `GET /api/realtime` (SDK JS lo maneja); el panel se suscribe
  a `cotizaciones` + `cotizacion_eventos`.
- **Ojo:** un PATCH crudo de `estado:'asignada'` NO genera el aviso realtime
  del vendedor — el aviso dispara por el `cotizacion_evento` tipo `asignada`
  que crea el panel al asignar. Por API hay que crear el evento también.
- Reglas y seeds: fuente de verdad en `scripts/pb-setup.mjs` (idempotente).

### Usuarios seed (ya públicos en `scripts/pb-setup.mjs`)

- `recepcion@pyp.local` — recepción · `ventas@pyp.local` — coordinador
- `escobar@pyp.local` / `salek@pyp.local` — vendedores
- Passwords: `cambiar-<rol>-123` (pendiente cambio antes de uso serio).
- Superuser: `admin@pyp.local` — la contraseña NO está en el repo; pedirla al
  usuario (local) o está en Coolify como env `PB_ADMIN_PASS` (server).

## Provision

```bash
node scripts/pb-setup.mjs --url <BASE_URL> --admin admin@pyp.local --pass <admin-pass>
```

Crea/migra colecciones, reglas y usuarios. Idempotente: se puede recorrer.

## Deploy (Coolify)

- App `pyp-panel` uuid `olxnpaxaacjvudqf3q5uryds`, proyecto `PyP`/`production`
  en `http://192.168.101.241:8000` (ver skill `coolify` para token/CLI).
- Build: `Dockerfile` multi-stage de la raíz (Node → `dist/` → Alpine +
  PocketBase 0.40.4). Envs: `PB_ADMIN_EMAIL`, `PB_ADMIN_PASS`. Volumen
  `pyp-panel-data` → `/pb/pb_data` (backup = ese volumen).
- Redeploy: push a `feat/custom-domain` + `coolify deploy uuid olxnpaxaacjvudqf3q5uryds`.

## Hooks

`pb_hooks/notify_assign.pb.js` — aviso WhatsApp al asignar, INACTIVO sin envs
(`WA_NOTIFY_URL` o `WA_TOKEN`+`WA_PHONE_ID`). Lee envs con `process.env`
(NO `$os.Getenv`, rompe en PB 0.40.x). Los cambios en hooks requieren
restart/redeploy de PocketBase.

## Restricciones

- Nada de SSR: el panel es 100% client-side (Astro estático + Alpine.js).
- No commitear secretos: passwords reales y tokens van en envs de Coolify o
  se piden al usuario — el repo es público.
- `/panel` fuera del sitemap y con `noindex`.
