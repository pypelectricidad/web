---
name: pyp-brand
description: Identidad visual y producción editorial de PyP Electricidad — consultar el documento de identidad, aplicar las reglas de marca y verificar visualmente briefs, brochures, afiches, posts y piezas web.
argument-hint: "[pieza o documento a producir]"
allowed-tools:
  - read
  - edit
  - grep
  - glob
  - exec
triggers:
  - user
  - model
---

# pyp-brand

Skill de identidad visual y producción editorial para PyP Electricidad S.R.L.
Úsala antes de diseñar cualquier pieza de marca (brief corporativo, brochure,
afiche, post, papelería, página del sitio) y cuando haga falta verificar la
consistencia visual de un entregable.

## Fuente de verdad

Leé `reference/brand-identity.md` (junto a este SKILL.md) **antes de producir
nada**. Contiene las reglas en tres niveles:

- **A — explícitas del manual de marca** (logo, reproducción por fondos, área de
  seguridad, tamaños mínimos, colores, degradado, tipografías, cobranding,
  papelería, señalética).
- **B — patrones observados** en el sitio, el brochure A4, los afiches SST,
  Instagram (dos registros: institucional/obra y comercial/promo) y el grafismo
  de circuitos.
- **C — hipótesis por validar**: no las trates como regla; si una decisión
  depende de ellas, marcáselo al usuario o pedí la referencia que falta.

Las fuentes primarias están en el repo (ver tabla "Fuentes de verdad" del
documento): manual renderizado en `pdf-page-*.png`, arte del logo en
`public/images/`, posts de IG en `public/images/ig-*.jpg`, plantillas en
`brochure/` y `_afiches/`.

## Flujo de trabajo

### 1. Encuadre
Definí el canal de la pieza: institucional impreso, web, Instagram
(institucional o promo), papelería, vehicular/gráfica. Cada canal tiene su
registro tipográfico y de color en el documento de identidad; no mezclarlos.

### 2. Análisis de referencias
Antes de diseñar, releé las referencias visuales del canal elegido (renders del
manual, previews del brochure, posts de IG). Si falta una referencia necesaria,
marcala como gap al final; no la suplas con una plantilla genérica.

### 3. Producción
- **Impresos/PDF**: partí de las plantillas existentes (`brochure/index.html`
  para A4, `_afiches/tripticos/triptico.html` para trípticos) o clonalas;
  renderizá con Chrome headless `--print-to-pdf`. Respetá márgenes, área de
  seguridad del logo y tamaños mínimos.
- **Web**: Astro + Tailwind con los tokens de `tailwind.config.mjs`/`DESIGN.md`.
  No agregues dependencias (restricción del repo).
- **Logo**: siempre arte original de `public/images/`. Nunca recomponer la firma
  con otra tipografía (Souvenir no está disponible).
- **Contenido**: solo datos verificados (pie trinorma, manual, PRODUCT.md,
  `Brief PyP Electricidad.docx`). No inventar claims institucionales.
- **Compatibilidad CorelDRAW**: el PDF crudo de Chrome puede ser rechazado por
  Corel (fuentes Type3 de variable fonts + quirks del generador). Reglas para
  piezas destinadas a edición en Corel:
  - No uses glifos especiales por fuente (`✓`, `↔`, `→`, etc.): dibujalos con
    CSS puro (borders/transform) o SVG inline.
  - Horneá overlays translúcidos (velos, degradados sobre fotos) dentro de la
    imagen con PIL: los image masks/SMask no sobreviven la normalización.
  - Post-procesá con `mutool draw -F pdf -o out.pdf in.pdf` (mutool portable en
    `web/_tools/mupdf/`): reescribe streams y re-embede fuentes como Type0.

### 4. Control de calidad visual (obligatorio)
1. Renderizá cada página/pliego como imagen (PNG).
2. Comparala contra las referencias del canal:
   - paleta exacta (los tres hex del manual; amarillo solo acento),
   - variante de logo correcta para el fondo y su área de seguridad,
   - jerarquía tipográfica y familia del canal,
   - márgenes, alineaciones, retícula,
   - motivos (hazard stripes, grid, circuitos) usados como en las referencias.
3. Corregí desviaciones y volvé a renderizar las páginas afectadas (máx. 2
   rondas; si algo sigue sin cerrar, reportalo).
4. No des por terminado un documento porque el archivo se generó: se termina
   cuando la revisión visual pasa.

### 5. Cierre
Informá: qué se produjo, qué reglas se aplicaron, qué decisiones quedaron como
hipótesis (nivel C) y qué referencias faltaron.

## Restricciones duras

- No rediseñar la identidad ni el logo; no alterar proporciones ni colores.
- Amarillo `#FCED04` solo como acento (salvo registro promo IG documentado).
- Degradado navy→celeste solo como fondo con logo/texto blancos.
- Sobre azul claro/corporativo el logo va siempre 1/0 blanco.
- Grafismo de circuitos PCB solo en vehicular; verde-lima no se usa.
- No agregar recursos decorativos sin fundamento en las referencias.
- No usar plantillas corporativas genéricas como sustituto del análisis.
