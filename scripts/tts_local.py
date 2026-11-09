#!/usr/bin/env python3
"""Voces gratis sin cuenta para scripts/tts.mjs.

Lee por stdin un JSON {"engine": "edge"|"kokoro", "voice": ..., "rate": ..., "items": [{"text", "out"}]}
y escribe cada audio en su "out". Devuelve por stdout [{"words": [[inicio, fin], ...] | null}, ...].

  edge    pip install edge-tts          Voces neuronales de Microsoft Edge ("Leer en voz alta").
                                        Da el tiempo exacto de cada palabra. Servicio no oficial.
  kokoro  pip install kokoro soundfile  Modelo abierto (Apache 2.0) que corre en tu ordenador.
                                        Necesita espeak-ng instalado para el español.
"""
import asyncio
import json
import sys

TICKS = 10_000_000  # edge-tts mide en unidades de 100 ns


async def edge(job):
    import edge_tts

    results = []
    for item in job["items"]:
        communicate = edge_tts.Communicate(
            item["text"], job["voice"], rate=job["rate"], boundary="WordBoundary"
        )
        words = []
        with open(item["out"], "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    start = chunk["offset"] / TICKS
                    words.append([start, start + chunk["duration"] / TICKS])
        results.append({"words": words})
    return results


def kokoro(job):
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    pipeline = KPipeline(lang_code="e")  # español
    speed = float(job["rate"])
    results = []
    for item in job["items"]:
        parts = [r.audio.numpy() for r in pipeline(item["text"], voice=job["voice"], speed=speed) if r.audio is not None]
        sf.write(item["out"], np.concatenate(parts), 24000)
        results.append({"words": None})  # Kokoro no da tiempos por palabra en español
    return results


def main():
    job = json.load(sys.stdin)
    if job["engine"] == "edge":
        out = asyncio.run(edge(job))
    elif job["engine"] == "kokoro":
        out = kokoro(job)
    else:
        raise SystemExit(f"motor desconocido: {job['engine']}")
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
