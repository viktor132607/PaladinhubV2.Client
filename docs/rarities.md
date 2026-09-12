# Item rarities — task 5

Admin → Data → Item rarities manages rarity names, descriptions, six-digit hex colors, ordering, archive, soft deletion and revision recovery. Eight starter rarities are inserted only when the catalog is empty; renaming/deleting them does not recreate defaults on restart. Existing custom Quality names are imported, linked by ID, and given an initial recovery snapshot.

Item create/edit forms replace the Quality text field with a rarity selector. Details, deletion confirmation and database results resolve the assigned rarity; the database has a dedicated rarity filter. This does not change spell/talent record types.

The backend validates new assignments, keeps archived assignments on unrelated edits, prevents deletion of used rarities and serializes edits with item saves. Rename/restore updates the legacy Item.Quality text in the same transaction so existing preset queries keep working. Existing saved preset filters that explicitly name the old rarity must be updated separately.

`docs/rarities-upgrade.sql` adds nullable foreign keys, imports legacy values, preserves unclassified records and validates catalog colors and names. Fresh seed items also receive rarity IDs. Startup upgrades must be enabled or the script applied manually after previous upgrades.

Validation: client and server builds, catalog model/query/authorization checks, PostgreSQL-compatible PGlite migration checks (idempotency, custom values, uniqueness, colors, foreign keys, renamed defaults), mocked browser management/recovery, item form assignment and filters at mobile/desktop widths. The static-export harness emits existing hydration notices; physical iOS and production deployment are not verified.
