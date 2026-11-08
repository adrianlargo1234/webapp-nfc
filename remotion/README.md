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

## Voz sintética (sin grabar)

`npm run video:tts` lee cada `say` de `video.json` con espeak-ng + MBROLA (`apt-get install espeak-ng mbrola mbrola-es4`), crea `public/video/voz.mp3`, `captions.json` y `captions.srt`, y ajusta la `duration` de cada escena a su frase. Voz y velocidad: `TTS_VOICE=mb-es4 TTS_SPEED=165`.

En `captions.json` una palabra escrita `*así*` se resalta siempre (también puedes editar a mano los subtítulos de Whisper).

## Skills de YouTube

En `.claude/skills/` están las 11 skills de [youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill) (MIT, commit a2feb21). Para este vídeo se usaron:

- `/yt-script`: gancho elegido con `hookscore.py` (61, WORKABLE, fórmula The Insider). Puntúa en inglés, así que se evalúa la traducción.
- `/yt-package`: título «Tus fotos de Japón, pegadas a la nevera» + portada «IMÁN = ÁLBUM» (94/100).
- `/yt-edit`: `python3 .claude/skills/yt-edit/deadair.py public/video/captions.srt` → 0 silencios que cortar.
