---
name: pyp-empleados
description: Gestión del padrón de empleados PyP (autorización WhatsApp, roles y permisos por cargo). Fuente de verdad en Postgres del n8n; usar cuando haya que agregar/quitar/desactivar empleados, cambiar puestos o roles, exportar CSV o tocar el filtro de autorización del workflow de herramientas.
argument-hint: "[listado | csv | alta | baja | permisos]"
allowed-tools:
  - read
  - exec
  - grep
  - glob
triggers:
  - user
  - model
---

# pyp-empleados

Padrón de empleados de PyP Electricidad. **Postgres es la fuente de verdad** —
el Excel (`pyp-pic/config/empleados.xlsx` / `Herramientas PyP/config/empleados.xlsx`)
queda descartado como fuente; solo sirve de referencia histórica de columnas.
Tablas en inglés, prefijo `n8n_`, dentro del Postgres del servicio n8n en Coolify
(ver skill `pyp-n8n` para conexión SSH y credenciales).

## Esquema (DDL canónico)

```sql
CREATE TABLE n8n_positions (
  position      text PRIMARY KEY,             -- 'oficial electricista', 'banista'...
  description   text,
  active        boolean NOT NULL DEFAULT true
);

CREATE TABLE n8n_employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           text NOT NULL UNIQUE,       -- normalizado: últimos 10 dígitos
  first_name      text NOT NULL,
  last_name       text,
  position        text REFERENCES n8n_positions(position),
  active          boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deactivated_at  timestamptz                 -- baja lógica, nunca DELETE físico
);

CREATE TABLE n8n_roles (
  role   text PRIMARY KEY,                    -- valores del Excel original:
                                              -- 'trabajador','encargado_herramientas','deposito',
                                              -- 'compras','tecnico_hys','administracion',
                                              -- 'jefatura','supervisor'
  name   text NOT NULL
);

CREATE TABLE n8n_employee_roles (
  employee_id uuid NOT NULL REFERENCES n8n_employees(id) ON DELETE CASCADE,
  role        text NOT NULL REFERENCES n8n_roles(role),
  PRIMARY KEY (employee_id, role)
);

CREATE TABLE n8n_role_actions (                -- matriz de permisos rol → acción
  role       text NOT NULL REFERENCES n8n_roles(role),
  action     text NOT NULL,                   -- catálogo abajo
  allowed    boolean NOT NULL DEFAULT true,
  PRIMARY KEY (role, action)
);
```

## Normalización de teléfono

- Guardar y comparar **solo los últimos 10 dígitos** (característica + número).
  Cubre `+54 9 381 202-2035`, `5493812022035`, `3812022035` por igual.
- Quitar `+`, espacios, guiones y el `9` argentino de móvil si quedara duplicado
  (`549` + 10 dígitos → tomar los últimos 10).
- La misma función de normalización aplica en el alta (SQL) y en el check del
  workflow n8n — si difieren, el whitelist nunca matchea.

## Catálogo de acciones

| action | Habilita |
|---|---|
| `inventory` | listar herramientas |
| `query` | "dónde está X", por lugar/persona, historial |
| `withdraw` | retiros de herramientas |
| `return` | devoluciones |
| `transfer` | traslados |
| `register` | altas de herramientas nuevas |
| `return_all` | devolver todo |
| `photo_qr` | enviar foto/QR de herramienta |
| `forward_picot` | reenviar mensaje a pyp-pic (PIC/OT) |
| `manage_employees` | *(futuro)* alta/baja por WhatsApp desde admin |

Matriz inicial sugerida (pendiente de confirmación del usuario):
`trabajador` → query + movimientos propios; `encargado_herramientas` → todo lo
de herramientas; `administracion`/`jefatura`/`supervisor` → incluye
`forward_picot`; `deposito`/`compras`/`tecnico_hys` → según se defina.

## Cómo se aplica en el workflow

1. Tras `Extraer Mensajes`/dedupe y **antes** de `Clasificar` (ver `pyp-n8n`):
   una query trae empleado activo + roles + acciones permitidas.
2. Sin empleado o `active=false` → ejecución termina en silencio (ignore total).
   **Regla estricta (definida por el usuario): si `n8n_employees` está vacía,
   NADIE responde** — no hay modo bootstrap abierto.
3. La acción resuelta se valida contra `n8n_role_actions`; sin permiso →
   **silencio total** (decisión del usuario, nov-2026).
4. `forward_picot` controla el reenvío a `pyp-pic` → PIC/OT también queda
   restringido por rol.
5. Los status updates de Meta (sent/delivered/read) no tienen texto de
   remitente: el filtro solo aplica a mensajes reales.

## Gestión (operada por Devin vía chat)

- **Alta**: "agregá a Juan Pérez, 3815551234, oficial electricista,
  roles trabajador+deposito" → INSERT en `n8n_employees` + `n8n_employee_roles`
  (+ `n8n_positions` si el cargo es nuevo). Efecto inmediato, sin deploy.
- **Baja**: `active=false` + `deactivated_at=now()` (nunca DELETE).
- **Reactivar**: `active=true`, `deactivated_at=NULL`.
- **Cambios de puesto/roles**: UPDATE/INSERT en tablas puente.
- **CSV**: "bajame los empleados" → generar CSV desde Postgres replicando
  columnas del Excel original (nombre, apellido, teléfono, puesto, roles con X).
- Toda operación queda en `updated_at`/`notes` para auditoría.

## Decisiones tomadas (nov-2026)

- Prefijo de tablas: `n8n_`.
- Sin permiso para una acción → **silencio total**.
- `forward_picot`: **pendiente de definición** — cargar la matriz con
  `allowed=false` hasta que el usuario defina qué roles usan PIC/OT.
- Seed inicial: pendiente — se necesita al menos un número real del usuario.

## Estado de implementación (nov-2026)

- Tablas `n8n_positions`, `n8n_employees`, `n8n_roles`, `n8n_employee_roles`,
  `n8n_role_actions` **creadas** en el Postgres de n8n (8 roles, 80 permisos
  sembrados; `forward_picot` en `false` para todos — pendiente de definición).
- Workflow `WhatsApp PyP - Herramientas` ya filtra: nodo `Check Empleado`
  (Postgres, tras `Inbox Dedupe`) descarta items sin empleado activo;
  `Check Permiso` (Code) mapea `accion`→permiso y degrada a `silencio`;
  `Puede PICOT?` (IF sobre `can_picot`) protege los 3 caminos a
  `Reenviar PIC/OT`; regla `silencio` del Switch no tiene salida → muere ahí.
- `phoneKey` = últimos 10 dígitos, calculado en `Extraer Mensajes`.
- **Verificado en vivo:** desconocido → muere en `Check Empleado`;
  empleado + `inventario` → procesa; empleado + `hola` (reenvío) → muere en
  `Puede PICOT?`. Tabla vacía = nadie responde (estricto, por decisión del usuario).
- Deploy del workflow: `node scripts/gen-n8n-herramientas.mjs` →
  `node scripts/gen-deploy-sql.mjs <out.sql` → psql en el contenedor postgres
  (versiona en `workflow_history` + `workflow_entity.activeVersionId`) →
  `docker restart n8n-z8in9r0n1zd2iq0fmefupufz`.

## Decisión de gestión (nov-2026)

Se evaluó una interfaz web para el ABM (empleados, roles, herramientas,
clientes). Opciones analizadas: (A) consolidar catálogos en PocketBase
(`pyp-panel`) y migrar los nodos SQL de n8n a HTTP — arquitectura correcta
pero refactor grande; (B) UI mínima propia — no recomendada; (C) gestión por
chat/SQL — **elegida por ahora**. Si el volumen de cambios crece, revisar A.

## Decisiones pendientes

1. Matriz rol→acción definitiva (qué rol habilita cada acción y `forward_picot`).
2. Cargar empleados reales (Excel/CSV del usuario o alta por chat).
3. Número del usuario para seed/admin.
