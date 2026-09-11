# Spell and talent icon selection

Create/Edit Spell and both talent-editor icon fields share `SpellIconPicker`:

- Browse/search the database icon catalog with pagination, including previous uploads.
- Enter or paste an image URL or an existing filename.
- Paste clipboard image data, including the device Paste action.
- Upload PNG, JPEG, GIF or WebP files up to 5 MB.
- Preview the choice and save the spell/talent to apply it.

Uploads use multipart form data with the existing CSRF token. API bytes are stored in PostgreSQL, so redeploying the application does not discard them. Existing filenames remain client assets; uploaded `/api/spell-icons/...` paths resolve against the API host in lists, details and tree renderers.

Deploy the matching server change before the client. The server creates the new table and widens `Spells.Icon` through the existing `APPLY_MIGRATIONS_ON_STARTUP=true` initialization flow. If startup schema changes are disabled, apply the SQL supplied in the server repository.

Browser checks (mock API, touch/428px viewport): paginated catalog selection, URL paste, multipart file upload, clipboard image upload, saved reference, invalid-file rejection, no horizontal page overflow. Client production build passed. Clipboard-button access depends on browser permissions; native paste into the icon field remains available.

Server validation: .NET 10 build passed. Controller checks with EF InMemory verified byte persistence across contexts, public image retrieval, rejected spoofed/oversized uploads, all 71 test records across catalog pages, search, Admin/CSRF attributes, and the 2048-character icon column model. Production database schema application was not executed from this workspace.
