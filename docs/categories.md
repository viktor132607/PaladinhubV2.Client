# Categories and subcategories — task 1

Open **Admin → Data → Categories** (`/Admin/Categories`). Create top-level categories or nested subcategories, edit names/descriptions/order, archive, delete unused categories, and restore earlier versions from change history. Search and Active/Archived/Deleted/All filters include the whole catalog.

The picker is available in every item/spell create/edit form and the talent database-piece editor. Details and deletion confirmation pages show the category path. The database has a category column and filter: selecting a parent includes every descendant; Uncategorized selects records without a category. Paging and search retain the category filter.

Deletion is recoverable. Categories with assigned items/spells or undeleted children cannot be deleted. Archiving preserves existing assignments, blocks new assignments, and requires active children to be archived or moved first. Restoration revalidates parent existence, sibling uniqueness and hierarchy. Restoring a child whose parent was deleted requires restoring the parent first.

Every category mutation records an actor, timestamp, version and snapshot. Version checks reject stale edits; a transaction-level advisory lock serializes hierarchy changes and record assignments to prevent cycles and assignment/deletion races. Existing records start uncategorized and are preserved by the upgrade.

Server startup applies its embedded `docs/categories-upgrade.sql` when `APPLY_MIGRATIONS_ON_STARTUP=true` (already configured in the Render blueprint). If disabled, apply that SQL before deploying the new client. No production database was modified directly during development.

Validation: .NET build passed; Next production build generated 84 routes; 13 unit tests passed. PostgreSQL-compatible PGlite checked repeat upgrades, preserved records, root/sibling name uniqueness, foreign keys, stable references on rename, unique revision versions and restoration conflicts. Browser checks use mocked HTTP: category creation/rename/archive/deletion/restoration, parent exclusion, deletion guards, all four item/spell forms, filtering, CSRF and 428/926/1440px layouts. Physical Safari and production database execution are not covered by these local checks.

This completes task 1 only. The remaining requested CRUD areas are classes/specializations, tags, patches/versions, item rarity, media library, navigation, pages, reusable blocks, talent-tree templates, translations, banners, footer/contacts, SEO, and roles/permissions. Each requires its own checked commit in main.
