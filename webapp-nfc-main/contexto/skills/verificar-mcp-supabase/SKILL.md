---
name: verificar-mcp-supabase
description: >-
  Verificar y autenticar el MCP de Supabase de este proyecto (.cursor/mcp.json).
  Usar cuando el usuario conecte Supabase, falle el MCP, o antes de migraciones.
---

# Verificar MCP de Supabase

## Prerrequisitos

1. En `.cursor/mcp.json`, `YOUR_PROJECT_REF` debe estar sustituido por el ref real del proyecto (Dashboard → Settings → General → Reference ID).
2. Features en la URL: `database,storage,docs` (Storage no viene activo por defecto).

## Pasos

1. Abrir **Cursor → Settings → Tools & MCP**.
2. Localizar el server `supabase` de este workspace.
3. Autenticar con **OAuth** en el navegador (cuenta/org del proyecto). No pegar service role en el chat.
4. Confirmar estado conectado / tools disponibles.

## Comprobación

Pedir al agente (o ejecutar vía MCP):

- Listar tablas (`list_tables`) o equivalente.
- Confirmar que hay tools de database y storage.

Si falla: revisar `project_ref`, reiniciar Cursor tras editar `mcp.json`, y reintentar OAuth.

## Seguridad

- No conectar a producción con datos sensibles si se puede evitar.
- No commitear PATs ni headers con Bearer tokens.
- Mantener aprobación manual de tool calls en Cursor.
