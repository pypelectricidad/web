# Identidad visual — PyP Electricidad S.R.L.

Documento de referencia verificable para producir piezas coherentes con la marca.
Las reglas están separadas en tres niveles: **explícitas del manual**, **patrones
observados en aplicaciones reales** y **decisiones por validar**. No mezclarlos.

## Fuentes de verdad (archivos del repo)

| Fuente | Archivos |
|---|---|
| Manual de identidad (28 pp.) | `MANUAL DE IDENTIDAD DE MARCA con trinorma.pdf`; renders `pdf-page-1.png` … `pdf-page-28.png` |
| Manual Bureau Veritas (sello ISO) | `ManualdeUsodeLogoyMarcasdeCertificacion.pdf` (reglas de uso del sello, ver A.10) |
| Logo (arte original) | `public/images/logo-pyp.png` (horizontal color), `public/images/logo-pyp-white.png` (1/0 blanco), `logo-pyp-2x.png`; `Logos/logo-horizontal.png`, `Logos/logo-circulo-fondo-blanco.png` (lockup circular, avatar de IG), `Logos/logo-circulo-fondo-celeste.png` (1/0 blanco sobre celeste), `Logos/logo-blanco-transparente.png`, **`Logos/logo-pyp-vector.svg`** (vector, fuente para derivar tamaños) y `Logos/logo-pyp-con-slogan.svg`. Fuente completa: `C:\Users\mevan\OneDrive\Escritorio\Logos\00 LOGOS PYP` (+ subcarpetas: Bureau Veritas, socios comerciales, banners redes, plantillas office) |
| Sello y pie trinorma ISO | `Logos/sello trinorma.png`, `Logos/pie de pagina trinorma 2026.png`, `brochure/assets/` (versiones color/light) |
| Sitio web | `live-site.png`, `pyp-home-full.png`, `tienda-desktop.png`, `producto-detail.png`; tokens en `tailwind.config.mjs` y `DESIGN.md` |
| Instagram | `ig-feed-grid.png` (captura del feed completo de @pyp.electricidad), `public/images/ig-*.jpg` (posts reales), `download-ig.cjs` (downloader de posts) |
| Piezas editoriales previas | `brochure/index.html` + `brochure/PyP-Electricidad-Brochure{,-Claro}.pdf` + `brochure/preview-*.png`; `_afiches/` (SST, trípticos); `brochure/carta de presentación 2026 trinorma.pdf`; `Brief PyP Electricidad.docx` (contenido) |
| Fotografía | `Fotos imagenes/Frente local pyp.png`, `public/images/{servicio,proyecto,producto,nosotros,sucursal}-*.jpg` |

## A. Reglas explícitas del manual

### A.1 Logotipo y firma
- Símbolo: círculo amarillo + media luna celeste (forma de "P" estilizada).
- Firma: `P&P` en **Souvenir Bold Italic** azul marino (altura de caja alterada a 65%); `Electricidad S.R.L.` en **Souvenir Bold** celeste, debajo o al lado según versión.
- Versión **apilada** (símbolo + P&P + Electricidad S.R.L.): para espacios cuadrados o circulares.
- Versión **horizontal** (símbolo + firma en una línea): para encabezados y espacios de altura limitada.

### A.2 Reproducción sobre fondos
| Fondo | Versiones permitidas |
|---|---|
| Claro / blanco | 4/4 color · 1/0 azul (todo el logo en azul, incluido el círculo) |
| Oscuro / negro | 4/4 (sol amarillo, P&P blanco, Electricidad celeste) · 1/0 blanco |
| Azul claro / corporativo | **solo** 1/0 blanco |

### A.3 Área de seguridad y tamaños mínimos
- Logo apilado: margen **3X** en los cuatro lados; contención circular de **8X** de diámetro.
- Logo horizontal: margen **1X** en los cuatro lados.
- Reductibilidad impresa: mínimo **20 mm** de ancho (color, 100%, 70%); las versiones 50% y 20% requieren **30 mm**.
- Reductibilidad online: mínimo **100 px** (color, 100%, 70%); 50% y 20% requieren **130 px**.
- Versiones grises permitidas: 100%, 70%, 50%, 20%.

### A.4 Colores corporativos
| Nombre | HEX | RGB | CMYK | Vinilo |
|---|---|---|---|---|
| Celeste letras | `#188EF3` | 24·142·243 | 77·42·0·0 | Orcal 053 |
| Azul PyP | `#03246F` | 3·36·111 | 100·89·19·43 | Orcal 067 |
| Amarillo Sol | `#FCED04` | 252·237·4 | 5·0·100·0 | Orcal 019 |

- **Degradado corporativo**: `#03246F → #188EF3`, usado en posts de IG y gráfica vehicular. Siempre como **fondo**, con logotipo y textos en blanco. El manual pide usar degradados con prudencia y moderación.

### A.5 Tipografía
- Firma: Souvenir Bold Italic / Souvenir Bold (ver A.1). **Solo vive dentro del arte del logo.**
  Souvenir está instalada en el sistema (`C:\Windows\Fonts\Souvenir{,B,I,BI}.ttf`) — disponible
  si alguna pieza la requiere, pero la firma nunca se recompone: se usa el arte.
- Tipografía secundaria oficial: **Montserrat** y **Montserrat Bold** (papelería: tarjetas
  personales). Familia completa + Alternates instaladas en `C:\Windows\Fonts` (OTF).

### A.6 Usos incorrectos
No deformar el logo, no cambiar sus colores, no cambiar la tipografía de la firma,
respetar el área de seguridad, no rotarlo, mantener contraste suficiente con el fondo.

### A.7 Cobranding
- Lockup horizontal: línea divisoria entre logos, separación **4X**.
- Lockup vertical: PyP arriba, separaciones 4X / 2X / 2X / 4X.
- En auspicios/uniformes: ningún logo acompañante puede superar en tamaño al de PyP.

### A.8 Papelería y credenciales
- Tarjeta personal: **55 × 85 mm**, papel ilustración 270–300 g, laminado mate con **UV sectorizado** en logo y nombre. Fondo gris 10 con degradado desde blanco, textos en negro, tipografía Montserrat/Montserrat Bold. Motivo de franjas diagonales cortadas (navy/celeste/cyan/verde-lima) en el borde.
- Credencial: fondo blanco, logo horizontal, foto, nombre en navy bold, DNI, banda navy con texto blanco ("ART: Provincia ART", teléfono de emergencias).

### A.9 Señalética
Coherencia, claridad, legibilidad, consistencia. Logo como elemento protagonista,
colores corporativos, tipografía legible y consistente, elementos gráficos
complementarios (formas y patrones) usados estratégicamente.

### A.10 Marca de certificación Bureau Veritas (sello trinorma)
Fuente normativa: `ManualdeUsodeLogoyMarcasdeCertificacion.pdf` (raíz del repo;
original en `OneDrive\Documentos\información institucional\Brief\`).
- **Permitido**: brochures, publicidad corporativa, sitio web, redes sociales,
  firmas de email, vehículos, material POP (siempre acompañado del logo PyP),
  cotizaciones, papelería membretada.
- **Prohibido**: sobre producto/etiqueta/empaque primario, certificados y
  documentos de evaluación/conformidad, logos de acreditación (OAA, UKAS) sin
  cumplir sus requisitos propios.
- **Tamaño**: impreso mínimo **60 mm** de largo (recomendado 115×45 mm);
  digital mínimo 820×510 px incluyendo zona de protección.
- **Zona de protección**: ~50% del alto del bloque gris del sello alrededor.
  Puede ser **transparente** — no exige placa blanca ni color de fondo propio.
- **Colores**: solo `#00049E` azul, `#68A641` verde, `#68655C` gris. No
  recolorear: sobre fondos oscuros el sello oficial va **directo con fondo
  transparente** (el arte ya contiene su placa interna); no usar versiones
  "light" recoloreadas.
- Solo la sección de normas (ISO 9001/14001/45001) es modificable: **no
  agregar** numeración de normas, tags ni gráficos propios debajo o alrededor
  del sello (repetir "9001/14001/45001" en cajas propias es uso no permitido).
- Fuentes del sello: Arial Normal ("CERTIFIED"), Arial Negrita (normas),
  Arial Cursiva (textos explicativos).

## B. Patrones observados en aplicaciones reales

### B.1 Grafismo de circuitos — **uso restringido a vehicular**
Trazas estilo PCB con nodos y cortes diagonales en franjas navy/celeste/amarillo.
Existe en la gráfica vehicular (ploteos) y en las tarjetas personales del manual.
**Decisión del usuario: se usa solo en vehículos.** No aplicarlo en piezas
editoriales, web ni papelería nueva: el trazo tipo PCB se lee como "electrónica"
y PyP es empresa eléctrica. El acento verde-lima que aparece en ese grafismo
tampoco se usa (ver D).

### B.2 Sitio web (`tailwind.config.mjs`, `DESIGN.md`)
- Paleta extendida: `brand #188ef3`, `brand-dark #03246f`, `brand-light #00b9f2`
  (cyan, extensión digital fuera del manual), `accent #fced04` **solo acentos
  mínimos**, `ink #2c2e35`, neutros `steel.50–900`.
- Fuentes: **Inter** (UI/cuerpo), **Space Grotesk** (display/titulares),
  **JetBrains Mono** (datos, etiquetas, kickers).
- Motivos CSS: `bg-hazard-stripes` (diagonal 45° brand/dark, franja industrial),
  `bg-grid-pattern` (retícula ingenieril cyan ~7–9% opacity).
- Hero: fondo navy oscuro, chip mono uppercase letterspaced con bullet cuadrado,
  titular grotesk enorme blanco→azul, cuerpo gris claro con highlights cyan bold,
  CTA primario `bg-brand-500`.

### B.3 Editorial impreso — brochure A4 (`brochure/index.html`)
Pipeline: **HTML autocontenido → Chrome headless `--print-to-pdf` → PDF**, con
previews renderizadas a PNG para verificación. Doble tema claro/oscuro por
variables CSS. Componentes:
- Hoja `.sheet` 210 × 296 mm, márgenes 16 mm; `@page { size: A4; margin: 0 }`.
- `.kicker`: mono 7.5 pt uppercase, tracking 0.25 em, precedido de regla de 34 px.
- `.cover-badge`: chip borde brand, mono uppercase, punto cuadrado cyan.
- Portada: logo 19 mm alto; H1 grotesk 900 42 pt line-height 0.98 con palabras en
  brand/brand-light; lead 10.5 pt/1.7; `.cover-stats` (números 22 pt 900 brand +
  labels mono); fila de contacto mono; `.hazard-bar` de 5 mm al pie.
- Interiores: `.page-head` mono `NN / SECCIÓN` + `PYP ELECTRICIDAD S.R.L.`,
  `h2.section-title` 20 pt 900 con `.hl` brand, `.lead` 9.5 pt/1.75,
  `.service-card` con foto + numeración mono, `.industrial-corner` (escuadras
  brand en esquinas), `.page-foot` mono con regla superior.
- Fuentes: Roboto (400/500/700/900) + JetBrains Mono.

### B.4 Afiches y trípticos SST (`_afiches/`)
Mismo pipeline HTML→PDF (A3/A4 con 3 mm de sangrado y marcas de pliegue).
Tipografía: **Barlow Condensed** (títulos) + Inter (cuerpo); paleta navy/blue/amarillo;
iconos OpenMoji color con crédito. Verificación con `printcraft-cli render` +
`photocraft-cli convert`. Sub-marca SST: tres cuadrados navy/celeste/amarillo +
"PyP DEPARTAMENTO DE SST" (`logo-pyp.png` en raíz del repo).

### B.5 Instagram — dos registros
1. **Institucional / obra**: foto real de trabajo (tableros, técnicos en campo,
   equipos) + placa blanca con logo color arriba-izquierda + **banda navy sólida**
   con titular blanco en mayúsculas **Roboto Black** (fuente instalada en
   `C:\Windows\Fonts\Roboto-Black.ttf`; a veces el titular arranca dentro de la
   banda y termina fuera, sobre la foto) + caption secundario blanco suelto
   sobre la foto (ej. "PLANTA DE FILTROS / CRUZ ALTA - TUCUMÁN"). Es el registro
   dominante del feed (`ig-feed-grid.png`): la grilla se lee como columna de
   bandas navy + fotos de obra; variantes: hitos/aniversario ("15 AÑOS",
   "20 AÑOS"), equipo ("DESTINO: CATAMARCA", perfiles de puesto), fechas
   ("DÍA DE LA MINERÍA") y productos. Avatar: `logo-circulo-fondo-blanco.png`.
2. **Comercial / promo**: fondo blanco, banda superior negra con logo blanco y
   claim ("ESPECIAL EPP" con palabra en amarillo), titulares negros gigantes,
   hazard stripes **negro/amarillo** en bordes laterales, tag "OFERTA"
   amarillo/negro, precio enorme, iconos con captions, bullets con puntos
   amarillos. Color de marca del producto (ej. rojo 3M) admitido como acento.

### B.6 Datos institucionales oficiales (pie trinorma)
`P&P Electricidad SRL` · CUIT 30-71162482-8 · +54 381 427 5594 ·
Av. Siria 1.699, S. M. de Tucumán · ventas@pyp-argentina.com.ar ·
pypelectricidad.com.ar. Sello Bureau Veritas ISO 9001 / 14001 / 45001.
Claims verificados: "más de 15 años de experiencia" (fundada 2006 → "casi 20 años"
en el manual 2026), slogan "Conectamos energía y calidad", ámbito NOA.

## C. Decisiones por validar / hipótesis (no tratar como regla)

- La firma nunca se recompone tipográficamente: se usa el arte del logo
  (`Logos/logo-pyp-vector.svg` para derivar tamaños; PNGs listos en `Logos/` y
  `public/images/`). Souvenir está instalada por si una pieza la necesita fuera
  de la firma. Para textos se usa la familia del canal: web → Inter/Space
  Grotesk/JetBrains Mono; impresos → Roboto o Barlow Condensed + mono;
  papelería estricta → Montserrat.
- **Disponibilidad de fuentes** en este equipo: instaladas localmente Souvenir,
  Montserrat (+Alternates) y Roboto completa (`C:\Windows\Fonts`). Inter, Space
  Grotesk, JetBrains Mono y Barlow Condensed **no están instaladas**: el pipeline
  HTML→PDF las carga vía Google Fonts (como hace `brochure/index.html`); si se
  renderiza sin red, hay que instalarlas o embeber los woff2 en la plantilla.
- El cyan `#00b9f2` es extensión digital; en impresos preferir celeste `#188EF3`
  y navy `#03246F` (los Orcal del manual).
- El registro promo IG usa negro+amarillo (hazard stripes negro/amarillo): es
  patrón propio de ese canal; no trasladarlo a piezas institucionales.

## D. Restricciones duras

- No rediseñar el logo, no recomponer la firma con otra tipografía, no alterar
  proporciones ni colores. Usar siempre el arte original.
- Amarillo `#FCED04`: solo acentos puntuales; nunca fondos extensos (excepción:
  registro promo IG con hazard negro/amarillo).
- Degradado navy→celeste: solo como fondo, con logo y texto blancos.
- En cualquier fondo azul claro/corporativo, el logo va 1/0 blanco.
- Grafismo de circuitos tipo PCB: **solo gráfica vehicular** (decisión del
  usuario; no trasladarlo a editorial, web ni papelería).
- Verde-lima: **no se usa** en ninguna pieza (decisión del usuario).
- No inventar información institucional: usar solo los datos del pie trinorma,
  el manual, PRODUCT.md y el brief docx.
- Marcas de terceros (Rockwell, 3M, Bureau Veritas…): respetar reglas de
  cobranding del manual; su color/tipografía propios no son de PyP.

## E. Pipeline de producción documental

1. **Documentos impresos/PDF**: plantilla HTML autocontenida (patrón
   `brochure/index.html` o `_afiches/tripticos/triptico.html`) → Chrome headless
   `--print-to-pdf` → PNG de verificación por página (`printcraft-cli render` o
   screenshot de playwright) → comparación contra esta referencia.
2. **Piezas web**: componentes Astro + Tailwind con los tokens existentes; no
   introducir librerías nuevas (ver `package.json`, restricción en AGENTS.md).
3. **Verificación visual obligatoria**: toda página se revisa como imagen
   renderizada, no solo como código, contra la sección correspondiente de este
   documento (paleta, tipografía, área de seguridad del logo, motivos).
