# DESIGN.md - UI/UX Specifications

## Tokens de Diseño Centralizados
- Primary Brand Color: `#188ef3` (`brand.500`); Dark `#03246f`, Light `#00b9f2`
- Accent: `#fced04` (`accent`) — solo acentos mínimos, nunca fondos grandes
- Ink / texto: `#2c2e35` (`ink`), neutros `steel.50`–`steel.900` para superficies
- Tipografía UI: Inter (`font-sans`); display: Space Grotesk (`font-display`); datos: JetBrains Mono (`font-mono`)
- Utilidades decorativas del sitio público: `bg-hazard-stripes`, `bg-grid-pattern` (no usar en el panel)

## Catálogo de Componentes Consolidados
### Panel interno (`/panel`, modo Operate)
- **TicketRow**: fila densa de cola — estado (badge de color semántico), cliente, comprador, n° ítems, responsable, tiempo. Click abre detalle.
- **StatusBadge**: `pendiente` (ámbar), `asignada` (brand), `en_proceso` (violeta), `cotizada` (verde), `descartada` (gris).
- **ItemEditor**: filas dinámicas producto+cantidad con autocompletado desde `src/data/productos.json`.
- **Composer / acciones**: botones primarios `bg-brand-500`, secundarios outline `steel`, destructivos `red-600`.
- **Aviso de asignación**: tarjeta fija top-right (`z-50`, borde `brand`, punto `animate-pulse`), click abre el pedido y auto-cierra a los 15 s; acompaña beep WebAudio. Patrón reusable para alertas en tiempo real del panel (el toast efímero queda para confirmaciones).
- Sitio público: Header/Footer en `src/components/`; el panel **no** los usa (chrome propio mínimo).

## Gestión de Estados Globales
- Vistas de datos: skeleton durante fetch; empty states que enseñan (acción primaria visible), nunca "sin datos" a secas.
- Errores: banner inline rojo suave con reintento; no alerts.
- Confirmaciones implícitas para cambios de estado; `descartada` sí pide confirmación.

## Piezas gráficas SST (`_afiches/`)
- Afiches A3 y trípticos A4 de charlas SST (Luis Astorga) en `_afiches/`; fuera del build del sitio.
- Pipeline: plantilla HTML (`_afiches/tripticos/triptico.html`, param `?c=`) → Chrome headless `--print-to-pdf` → PDF 303×216 mm (A4 + 3 mm sangrado, marcas de pliegue). Verificación: `printcraft-cli render` + `photocraft-cli convert` (el render PDF sale en PAM).
- Tipografía de piezas impresas: Barlow Condensed (títulos) + Inter (cuerpo); paleta navy `#03246f` / blue `#188ef3` / amarillo `#fced04`; iconos OpenMoji color (CC BY-SA, se acredita al pie).

## Criterios a11y
- Controles con `label` real, foco visible (`focus-visible:ring-2 ring-brand-500`), contraste AA sobre steel.
- Operable por teclado: lista navegable, Esc cierra paneles/modales.
