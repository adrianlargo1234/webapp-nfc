# Next.js · TypeScript · Tailwind

## Stack

- Next.js 16 App Router (`app/`).
- React 19, TypeScript estricto.
- Tailwind CSS 4 (`@import "tailwindcss"` en `globals.css`).

## Convenciones

- Server Components por defecto; `"use client"` solo para interacción (file input, lightbox, formularios client-side).
- Rutas y componentes en `app/`; utilidades compartidas en `lib/` cuando existan.
- Alias `@/*` → raíz del repo (`tsconfig.json`).
- Antes de usar APIs de Next, consultar `node_modules/next/dist/docs/` (esta versión puede diferir del conocimiento entrenado).
- Textos de UI en español.
- No instalar librerías pesadas sin necesidad; preferir APIs nativas del navegador para captura/subida (`input[type=file]` con `accept` e `capture` cuando aplique).

## Calidad

- Pasar `npm run lint` tras cambios relevantes.
- Tipar props y respuestas de Supabase; evitar `any`.
