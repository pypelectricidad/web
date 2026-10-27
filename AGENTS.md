# AGENTS.md

## Matriz de Consulta Documental
- Para entender restricciones de arquitectura antes de codificar: consultar obligatoriamente `ADR.md`
- Para identidad visual de marca y producción editorial (briefs, brochures, afiches, posts): consultar `.devin/skills/pyp-brand/reference/brand-identity.md` (reglas del manual + patrones por canal)
- Para asegurar la consistencia estética y reusabilidad de componentes visuales: consultar y actualizar `DESIGN.md`
- Para producto/usuarios/objetivos duraderos: consultar `PRODUCT.md`
- Para validar el impacto en la lógica de negocio existente: consultar y sincronizar `BEHAVIOR.md` (se genera con tests; hoy no hay suite)
- Para dudas de stack o bootstrap: consultar `README.md`

## Restricciones Operativas Locales
- Prohibido el uso de librerías externas no listadas en `package.json` sin aprobación previa vía ADR. Dependencias del panel aprobadas en ADR-001/002: `alpinejs`, `@supabase/supabase-js`, `pocketbase`.
- El sitio público es estático (GitHub Pages): nada de SSR ni endpoints de servidor. El panel debe funcionar 100% client-side contra Supabase.
- Toda ruta interna del panel debe respetar `import.meta.env.BASE_URL` (`/` en producción; el sitio vive en `pypelectricidad.com.ar`).
- El panel es interno: excluir `/panel` del sitemap y marcar `noindex`.
- Responder al usuario en español; código, identificadores y commits en inglés.

## Skills/Tools Disponibles
- `impeccable`: diseño/UI de superficies (`.agents/skills/impeccable/`); ver PRODUCT.md y DESIGN.md.
- `context-organizer`: mantiene los 5 .md de contexto (README, AGENTS, DESIGN, BEHAVIOR, ADR) sincronizados con el código.
- `browser-automation`: control de navegador vía playwright-cli.
- `pyp-brand`: identidad visual y producción editorial PyP (`.devin/skills/pyp-brand/`); obligatoria antes de diseñar piezas de marca, incluye control de calidad visual.
- `pyp-panel`: acceso y operación del panel de cotizaciones (`.devin/skills/pyp-panel/`); URLs, API, provision y deploy en Coolify.
- `react-tools`, `devin-cli`, `declarative-repo-setup`, `upload-secrets`: utilidades varias.
