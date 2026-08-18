# Supabase — convenciones del MVP

## Uso

- Postgres para metadatos (álbumes y fotos).
- Storage para binarios (solo imágenes).
- Cliente en la app con **anon key** (`NEXT_PUBLIC_*`). Sin service role en el frontend.
- Sin Auth de Supabase en el MVP: acceso abierto intencional.

## Schema (aplicado)

Tablas:

- `albums`: `id` (uuid), `name` (texto libre), `emoji` (curado, not null, default `'📷'`), `country_code` (ISO 3166-1 alpha-2), `country_name` (etiqueta ES denormalizada), `slug` (unique), `cover_path` (nullable — foto marcada manualmente como portada), `created_at`.
- `media`: `id` (uuid), `album_id` (fk → albums, cascade), `storage_path`, `mime_type`, `created_at`. Sin columna `type`: solo imágenes.

Bucket: `media` (lectura pública; escritura/borrado abiertos en el MVP). Paths: `{album_id}/{uuid}.{ext}`.

Detalle SQL y pasos: skill `contexto/skills/preparar-schema-albumes/`.

## Políticas (MVP abierto)

- RLS habilitado con políticas que permiten `SELECT` / `INSERT` / `UPDATE` / `DELETE` anónimos en `albums` y `media`.
- Storage: objetos legibles públicamente; upload/update/delete permitidos al rol `anon` en el bucket `media`.
- Documentar el riesgo de abuso; no fingir seguridad multi-usuario.

## Secretos y MCP

- Variables en `.env.local` (ver `.env.example`). Nunca commitear keys.
- MCP del proyecto en `.cursor/mcp.json` con `project_ref` y features `database,storage,docs`.
- Migraciones vía MCP (`apply_migration`); usar `list_tables` antes de tocar el schema.

## Cliente

- `@supabase/supabase-js` + `@supabase/ssr` (`lib/supabase/client.ts` para browser, `lib/supabase/server.ts` para Server Components/Actions).
- Tipos manuales en `lib/types.ts` (`Album`, `Media`) alineados al schema.
- Upload de fotos: directo desde el cliente al bucket `media` (mejor UX en móvil), luego insertar la fila en `media` vía Server Action.
