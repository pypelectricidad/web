# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Recepción** (1 persona): recibe pedidos de cotización por WhatsApp de clientes y los carga al panel como tickets: texto pegado del chat + adjuntos (captura, Excel, PDF). No cotiza, deriva y luego responde al cliente.
- **Coordinador de ventas / supervisor** (1 persona): asigna tickets a vendedores, revisa las cotizaciones que los vendedores entregan en PDF y las libera a recepción.
- **Vendedores** (con login): ven solo sus pedidos asignados, reciben el pedido tal como lo cargó recepción, cotizan en sus sistemas propios y adjuntan la cotización en PDF. Pueden devolver un pedido a la cola.
- **Cliente con múltiples compradores** (caso crítico): una empresa que compra y vende material tiene varios encargados de compra que envían pedidos simultáneos; cada pedido debe existir como ticket independiente aunque lleguen juntos por el mismo chat.

## Product Purpose

Sitio público de PyP Electricidad (catálogo, tienda, contenido) **más** un panel interno de cola de cotizaciones. El panel existe porque WhatsApp es una conversación lineal y los pedidos son unidades de trabajo: convierte cada pedido entrante en un ticket discreto con estado, responsable y datos completos, para que la cola se procese en paralelo y nada se pierda en el scroll del chat.

Éxito = ningún pedido queda sin estado ni responsable; recepción deja de ser cuello de botella de retransmisión; el coordinador ve la carga real de la cola de un vistazo.

## Positioning

No es un CRM ni un reemplazo de WhatsApp: es una cola de trabajo mínima que convive con WhatsApp. Los pedidos siguen entrando por WhatsApp; el panel los estructura. La cotización y la respuesta al cliente siguen ocurriendo fuera.

## Operating Context

- Volumen: 10-30 pedidos de cotización por día.
- Dispositivo principal: PC de escritorio; debe ser usable en celular de forma secundaria.
- Recepción NO transcribe ítem por ítem: pega el texto del pedido tal como llegó y adjunta los archivos originales (captura, Excel, PDF). El paquete llega íntegro al vendedor.
- Cada pedido necesita: cliente, texto del pedido y/o adjuntos, referencia/OC opcional, notas internas.
- La cotización se hace en los sistemas de cada vendedor; al panel solo vuelve el PDF final.

## Capabilities and Constraints

- Roles: `recepcion` (crea tickets, edita sus pendientes), `coordinador` (todo + asignar + aprobar cotizaciones) y `vendedor` (solo sus asignados: trabajar, devolver a cola, entregar PDF).
- Estados del ticket: `pendiente` → `asignada` → `en_proceso` → `por_revisar` → `cotizada` → `enviada`; `descartada` como salida lateral. `por_revisar` exige `cotizacion_pdf` adjunto; `enviada` cierra el ciclo cuando recepción le responde al cliente.
- Stack fijo: sitio Astro estático (GitHub Pages, `base: /`, dominio `pypelectricidad.com.ar`) + panel en `/panel` servido también por PocketBase (backend primario, servidor propio LAN). Supabase queda como backend alternativo; sin credenciales el panel corre en modo demo localStorage.
- Roadmap anotado: OC del cliente al aceptar la oferta → área depósito para cumplimiento; acceso externo con HTTPS; notificaciones nativas (requieren HTTPS).

## Brand Commitments

Identidad PyP Electricidad ya establecida en el sitio: azul eléctrico `#188ef3`, azul marino `#03246f`, cyan `#00b9f2`, amarillo `#fced04` solo como acento mínimo; Inter para UI, Space Grotesk display, JetBrains Mono para datos. El panel hereda este sistema sin reinterpretarlo (herramienta interna, modo Operate).

## Evidence on Hand

- Catálogo de productos: `src/data/productos.json`, `categories-map.json`.
- Manual de identidad de marca: `MANUAL DE IDENTIDAD DE MARCA con trinorma.pdf`.
- No hay backend, base de datos ni usuarios existentes; no inventar claims comerciales en el sitio público.

## Product Principles

- El ticket es la unidad, no el mensaje: todo pedido existe como objeto con estado y responsable.
- Captura rápida por encima de completitud: recepción debe poder crear un ticket en menos de un minuto.
- Familiaridad operativa: el panel se parece a las herramientas que la gente ya usa (bandeja, lista, asignación), no inventa metáforas.
- WhatsApp queda afuera, pero cerca: cada acción produce texto listo para pegar en WhatsApp cuando haga falta.
