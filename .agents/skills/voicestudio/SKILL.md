---
name: voicestudio
description: Generar locuciones/TTS local con voces guardadas o clonadas, transcribir audio y automatizar doblaje/narración vía la API REST local de VoiceStudio (Electron app instalada en este equipo). Usar cuando el usuario pida generar voz, locuciones, doblaje o transcripción de audio.
---

# VoiceStudio (local)

VoiceStudio está instalado como app de escritorio Electron en este equipo
(`C:\Program Files\VoiceStudio\VoiceStudio.exe`). El backend REST
expone una API compatible con OpenAI en `http://localhost:3900` y un endpoint
MCP en `http://localhost:3900/mcp`.

## Conectar y descubrir

1. `GET /health` — si no responde, lanzar la app instalada y esperar ~60 s
   (precarga el modelo TTS; el primer arranque tras instalar tarda aún más).
   **OJO:** el entorno del agente hereda `ELECTRON_RUN_AS_NODE=1` del IDE, lo
   que hace que cualquier Electron arranque como Node y salga con código 0 sin
   abrir. Lanzar siempre con `env -u ELECTRON_RUN_AS_NODE
   "/c/Program Files/VoiceStudio/VoiceStudio.exe" &`.
2. `GET /openapi.json` — contrato real de la versión instalada. No inventar
   IDs de perfil ni asumir modelos instalados por el catálogo.
3. `GET /v1/audio/voices` y `GET /models` — voces guardadas y estado real de
   modelos (`"installed": true/false`).
4. Nunca descargar un modelo sin consentimiento: informar tamaño y licencia
   y pedir confirmación (`POST /models/install` con `{"repo_id": "…"}`, luego
   sondear `GET /models/install/status`).

## Generar voz (TTS)

```sh
curl --fail-with-body --show-error http://localhost:3900/v1/audio/speech \
  -H 'Content-Type: application/json' \
  -d '{"model":"tts-1","voice":"<profile_id>","input":"Texto a locutar.","response_format":"wav"}' \
  --output out.wav
```

- `voice` debe ser un `profile_id` descubierto vía `GET /v1/audio/voices`
  (los nombres tipo OpenAI son aliases de compatibilidad, no voces reales).
- Verificar el HTTP status y sondear el archivo (ffprobe / cabecera) antes de
  reportarlo como audio: una respuesta de error puede escribirse a `out.wav`.
- Reportar ruta guardada, formato y duración reales. Nunca simular una
  generación exitosa.

## Español / acento regional (p. ej. norteño argentino)

- No hay presets de acento: el acento sale de la **referencia clonada**.
- Para acento norteño/rioplatense: pedir al usuario 5–15 s de audio limpio de
  una voz con ese acento, subirla como referencia de clonación (endpoint de
  perfiles/referencias según `/openapi.json`) y usar ese `profile_id`.
- "Voice design" por descripción textual existe en algunos motores pero no es
  confiable para acentos regionales finos; preferir clonación.
- Clonar solo voces que el usuario esté autorizado a usar.

## Transcripción

```sh
curl --fail-with-body --show-error http://localhost:3900/v1/audio/transcriptions \
  -F file=@clip.wav -F model=whisper-1 -F response_format=verbose_json
```

`verbose_json` para timestamps; `srt`/`vtt` para subtítulos si el schema lo
soporta.

## Hardware de este equipo

- Windows 11 x64, NVIDIA GTX 1650 (CUDA), ~16 GB RAM.
- Los motores pesados (IndexTTS, CosyVoice) pueden activar `torch.compile` y
  dar OOM en <16 GB VRAM: la app tiene toggle "Disable torch.compile" en
  Settings → Performance, o `TORCH_COMPILE_DISABLE=1`.
- Ubicación de datos/modelos: `%APPDATA%\VoiceStudio\` (runtime, modelos,
  proyectos, voces guardadas).

## Aprendizajes de uso real (este equipo)

- Perfiles creados: `23ec9174` (M1), `816b9cee` (M2, muestra limpia),
  `d573a9f3` ("Locutor Comercial", ref limpiada con afftdn+agate).
- Endpoint nativo `POST /generate` (multipart) es más rico que
  `/v1/audio/speech`: acepta `profile_id`, `instruct`, `denoise`,
  `effect_preset`, `speed`, `guidance_scale`.
- `instruct` NO es texto libre: solo tags de la taxonomía
  (gender, age, pitch, style, accent). `POST /design/describe` traduce
  descripción libre a instruct válido. Para estilo comercial probado:
  `male, middle-aged, low pitch`.
- `effect_preset` válidos: broadcast, cinematic, podcast, raw, warm, bright
  (`GET /engines/effects/presets`). `broadcast` va bien para locución.
- Respiraciones audibles: se resuelven en la REFERENCIA (limpiar con
  `afftdn` + `agate` antes de crear el perfil) + `denoise=true` al generar.
  NO usar gate agresivo en la salida: arruina pausas naturales.
- Preferencia del usuario (2026-10-06): tras comparar OmniVoice vs CosyVoice
  3 y varias masterizaciones, prefirió las PRIMERAS versiones (OmniVoice,
  masterización suave) — el post-proceso fino lo hace en Premiere.
  Entregar crudo + masterizado suave y no sobreprocesar.
- CosyVoice 3 instalado como segundo motor (`engine=cosyvoice` en /generate,
  licencia Apache-2.0 — sí permite uso comercial). Su instalador one-click
  fallaba compilando pyworld vendored (sin MSVC): se resolvió reemplazando
  `third_party/PyWorld` por el contenido del wheel PyPI pyworld-0.3.4-cp310 +
  pyproject mínimo con el .pyd como package-data, y pinneando
  `setuptools<81` en el venv (pkg_resources). El código fuente del backend
  vive en `resources\backend` (los parches en runtime\project se revierten
  al arrancar).
- Cadena de masterización validada por el usuario (salida 44.1 kHz):
  `highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=180:t=q:w=1:g=1.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4dB,loudnorm=I=-16:TP=-1.5:LRA=9`
  Guardar crudo + masterizado para que el usuario compare.

## Errores

Leer el body de la respuesta y distinguir: backend caído, modelo no instalado,
capacidad no soportada por el motor, auth (401/403), hardware ocupado.
Corregir la condición reportada; no cambiar a un proveedor cloud ni descargar
modelos sin autorización.
