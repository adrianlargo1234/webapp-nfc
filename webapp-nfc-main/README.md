# Album NFC

WebApp para abrir al escanear una pegatina NFC: álbumes compartidos por países con fotos. Sin login; todo el contenido es público y editable por cualquiera.

Stack: **Next.js 16** (App Router) · **TypeScript** · **Tailwind CSS** · **Supabase** (Postgres + Storage).

## Setup

```bash
npm install
cp .env.example .env.local
```

Rellena `.env.local` con la URL y la anon key de tu proyecto Supabase (Dashboard → Project Settings → API).

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Supabase MCP (Cursor)

1. Edita `.cursor/mcp.json` y sustituye `YOUR_PROJECT_REF` por el ref de tu proyecto.
2. En Cursor: **Settings → Tools & MCP** → autentica Supabase (OAuth).
3. Comprueba que aparecen herramientas como `list_tables` y `apply_migration`.

## Contexto para agentes

Lee `AGENTS.md` y la carpeta `contexto/` (rules y skills del proyecto).

## Scripts

| Comando         | Descripción              |
| --------------- | ------------------------ |
| `npm run dev`   | Servidor de desarrollo   |
| `npm run build` | Build de producción      |
| `npm run start` | Servir build             |
| `npm run lint`  | ESLint                   |
