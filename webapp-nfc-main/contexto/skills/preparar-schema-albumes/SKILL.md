---
name: preparar-schema-albumes
description: >-
  Schema albums + media (solo fotos) + bucket Storage para Album NFC.
  Usar al implementar el MVP o al aplicar migraciones vía Supabase MCP.
---

# Preparar schema de álbumes

## Objetivo

Persistencia para álbumes por país y fotos, con acceso anónimo abierto. No hay vídeos en el MVP.

## Tablas

### `albums`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `name` | `text` not null | Nombre libre elegido por el usuario |
| `emoji` | `text` not null default `'📷'` | Emoji elegido de la lista curada (`lib/album-emojis.ts`) |
| `country_code` | `text` not null | ISO 3166-1 alpha-2 (ej. `JP`, `IT`) |
| `country_name` | `text` not null | Etiqueta en español, denormalizada |
| `slug` | `text` unique not null | URL-friendly, derivado de `name` |
| `cover_path` | `text` null | Path en Storage de la foto marcada como portada (manual, vía "Usar como portada") |
| `created_at` | `timestamptz` | default `now()` |

### `media`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `album_id` | `uuid` FK → `albums(id)` on delete cascade | |
| `storage_path` | `text` not null | Path en bucket `media` |
| `mime_type` | `text` not null | `image/*` |
| `created_at` | `timestamptz` | default `now()` |

Índice compuesto en `media(album_id, created_at desc)`.

## Storage

- Bucket: `media` (público para lectura).
- Organización de paths: `{album_id}/{uuid}.{ext}`.
- Políticas: `anon` puede `select`/`insert`/`update`/`delete` en objetos del bucket `media`.

## RLS (MVP)

RLS habilitado en `albums` y `media` con políticas permisivas para `anon` (y `authenticated`) en SELECT/INSERT/UPDATE/DELETE.

## Aplicación vía MCP

1. Skill `verificar-mcp-supabase` primero.
2. `apply_migration` (`create_albums_and_media`) con SQL de tablas, índice y RLS.
3. Crear bucket `media` (público) y policies de storage.
4. Verificar con `list_tables` (verbose) y `list_storage_buckets`.
5. `apply_migration` (`add_album_emoji`) para añadir `albums.emoji` en proyectos ya creados antes de esta columna.

## Fuera de alcance de esta skill

- UI Next.js, cliente Supabase en la app (ver `contexto/rules/supabase.md`), seed de países.
