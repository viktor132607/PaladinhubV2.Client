# Record types

The spell create/edit form and talent database-piece editor now use a database-backed **Type** select. Open **Manage types** beside it to add a type, rename an existing type, or delete one. Initial choices are `item`, `spell`, and `talent`. Custom names are trimmed, lowercased, limited to 50 characters, and must be unique.

Renaming updates all records using the type. Deleting a used type requires choosing a replacement; records are preserved. Deleted defaults are not reinserted on restart. The talent library filters by the actual stored type, including custom values.

The existing `quality` JSON field and `Spells.Quality` column remain the compatible storage contract. Item rarity in the separate Items database is unchanged. Type `item` categorizes a record; it does not move it into the separate Items table.

Deploy the matching server first. Its Render blueprint enables `APPLY_MIGRATIONS_ON_STARTUP=true`. Installations with startup upgrades disabled must run `docs/spell-icons-upgrade.sql`, then `docs/record-types-upgrade.sql` from the server repository. The upgrade imports existing values and adds a foreign key with cascading renames and restricted deletion.

Validation:
- Next production build and TypeScript passed.
- Browser test with mocked API: defaults, add, rename, duplicate feedback, delete unused, replacement required for used types, reassignment, form save, CSRF headers.
- Chromium touch viewport 428 × 926: expanded management UI has no document overflow; screenshot inspected.
- Server .NET build: zero errors; existing warnings remain.
- PostgreSQL-compatible PGlite execution: legacy-value migration, duplicate rejection, cascading rename, foreign-key protection, reassignment without record loss, repeat upgrades, deleted defaults remaining deleted.

Browser checks use mocked HTTP responses. Physical iPhone/Safari and production database upgrades were not exercised in this workspace.
