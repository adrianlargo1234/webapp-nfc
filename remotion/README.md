# Vídeos para TikTok con Remotion

Plantilla vertical (1080×1920, 30 fps): título arriba con una palabra en cursiva naranja, una tarjeta animada en el centro y subtítulos palabra a palabra con palabras resaltadas.

## Uso rápido

```bash
npm run video:studio      # editor en el navegador con vista previa
npm run video:render      # exporta out/tiktok.mp4
```

Todo el contenido está en `remotion/video.json`.

## Escenas

Cada escena dura `duration` segundos, una detrás de otra:

| Campo | Qué hace |
| --- | --- |
| `title` | Título de arriba. Lo que va entre `*asteriscos*` sale en cursiva naranja. |
| `step` | (opcional) Número en un círculo naranja junto al título. |
| `visual` | Lo que se ve en el centro (ver abajo). |
| `stamp` | (opcional) Sello girado encima, p. ej. `"GRATIS"`. |
| `say` | Lo que dice la voz. Lo que va entre `*asteriscos*` se resalta en los subtítulos. |

Si dos escenas seguidas tienen el mismo `title` o el mismo `visual`, no se vuelven a animar: así puedes cambiar los subtítulos sin que la imagen salte.

Tipos de `visual`:

- `{ "type": "icon", "emoji": "🧲", "strike": true, "badge": "texto" }`: emoji grande, opcionalmente tachado y con píldora.
- `{ "type": "list", "header": "CABECERA", "items": ["…"] }`: tarjeta con filas que van apareciendo.
- `{ "type": "grid", "items": [{ "emoji": "🇯🇵", "label": "Japón" }] }`: mosaicos.
- `{ "type": "bars", "header": "CABECERA", "bars": [{ "label": "X", "value": 80 }] }`: barras 0–100.
- `{ "type": "image", "src": "video/captura.png", "url": "albumnfc.app" }`: captura de `public/` en una ventana de navegador.
- `{ "type": "cover", "text": "TEXTO GRANDE", "caption": "debajo", "emoji": "✈️" }`: portada naranja.

## Con tu voz y Whisper

1. Una sola vez: `npm run whisper:install` (compila whisper.cpp y baja el modelo; `WHISPER_MODEL=small` para uno más ligero).
2. `npm run video:transcribe -- ~/Desktop/voz.mp3`
   - copia el audio a `public/video/`, crea `public/video/captions.json` con el tiempo de cada palabra y lo enlaza en `video.json`;
   - imprime cada palabra con su segundo: úsalo para ajustar la `duration` de las escenas.
3. Para resaltar palabras de la transcripción, añádelas a `"highlight"` en `video.json` (o ponlas entre asteriscos en `say`).
4. `npm run video:render`.

Sin audio (`"audio": null`), los subtítulos se generan a partir de `say`, repartidos en la duración de cada escena.

Las fuentes (Poppins, Instrument Serif y JetBrains Mono, licencia OFL) están en `public/video/fonts`, así que se renderiza sin conexión.

## Voz con IA barata (Azure Speech, recomendado)

Voces neuronales de Microsoft con capa gratuita mensual (de sobra para estos vídeos) y tiempo exacto de cada palabra, así que los subtítulos salen sin Whisper.

1. En portal.azure.com → *Crear un recurso* → **Speech** (Servicios de IA de Azure). Plan de tarifa **Free F0**, región p. ej. *West Europe*.
2. En el recurso → *Claves y punto de conexión*: copia la **Clave 1** y la **Ubicación/Región** a `.env.local` (no se sube a git):
   ```
   AZURE_SPEECH_KEY=tu_clave
   AZURE_SPEECH_REGION=westeurope
   ```
3. `npm run video:tts` y `npm run video:render`.

Voz por defecto: `es-ES-AlvaroNeural` (masculina, España) a `+12%` de velocidad. Para cambiarla: `AZURE_SPEECH_VOICE` (escúchalas en la *Voice Gallery* de Speech Studio; p. ej. `es-ES-ElviraNeural`, o las multilingües `…MultilingualNeural`, más expresivas), `AZURE_SPEECH_RATE` (`+20%` para más ritmo), `AZURE_SPEECH_PITCH` y `AZURE_SPEECH_STYLE` (solo si la voz admite estilos).

## Voz con IA premium (ElevenLabs)

1. Saca tu API key en elevenlabs.io → Profile → API Keys y ponla en `.env.local` (no se sube a git):
   ```
   ELEVENLABS_API_KEY=tu_clave
   ELEVENLABS_VOICE_ID=id_de_la_voz   # opcional
   ```
2. Elige la voz en la Voice Library: filtra por idioma **Spanish**, acento **Spain** y estilo *social media* / *narrative*, añádela a "My Voices" y copia su ID. Sin `ELEVENLABS_VOICE_ID` usa "Adam" (masculina, con algo de acento inglés).
3. `npm run video:tts` y `npm run video:render` (si también tienes clave de Azure, fuerza ElevenLabs con `TTS_ENGINE=elevenlabs`).

El script pide cada escena con el texto de la anterior y la siguiente como contexto (la entonación fluye), usa los tiempos por letra que devuelve ElevenLabs para los subtítulos (exactos, sin Whisper) y ajusta la `duration` de cada escena. Ajustes: `ELEVENLABS_SPEED` (1.1 por defecto, máx. 1.2), `ELEVENLABS_MODEL` (`eleven_multilingual_v2`; `eleven_v3` es más expresivo). Este vídeo gasta unos 500 caracteres; `ELEVENLABS_MODEL=eleven_flash_v2_5` gasta la mitad de créditos.

Sin clave, `npm run video:tts` usa SVOX Pico en local (`apt-get install libttspico-utils`): sirve para probar, pero suena robótica.

En `captions.json` una palabra escrita `*así*` se resalta siempre (también puedes editar a mano los subtítulos de Whisper).

## Skills de YouTube

En `.claude/skills/` están las 11 skills de [youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill) (MIT, commit a2feb21). Para este vídeo se usaron:

- `/yt-script`: gancho elegido con `hookscore.py` (61, WORKABLE, fórmula The Insider). Puntúa en inglés, así que se evalúa la traducción.
- `/yt-package`: título «Tus fotos de Japón, pegadas a la nevera» + portada «IMÁN = ÁLBUM» (94/100).
- `/yt-edit`: `python3 .claude/skills/yt-edit/deadair.py public/video/captions.srt` → 0 silencios que cortar.
