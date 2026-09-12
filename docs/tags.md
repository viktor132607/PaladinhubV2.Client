# Tags — task 3

Admin → Data → Tags (`/Admin/Tags`) supports names, descriptions, ordering, archive/unarchive, recoverable deletion, history and revision restoration. Duplicate active names are rejected case-insensitively. Tags assigned to records cannot be deleted until removed; archiving preserves existing assignments but prevents new ones.

All item/spell create/edit forms and the talent database-piece editor support up to 100 distinct tags through a searchable checkbox list and removable selected tags. Existing assignments load on edit; unrelated edits preserve them. Details/deletion pages display tag names.

Database text searches include tag names. A dedicated tag filter (including No tags) combines with category, class and search filters and survives pagination. Tag names are resolved by stable IDs, so renaming updates every displayed reference.

IDs persist in PostgreSQL integer arrays with GIN indexes. API assignment and catalog mutations share a transaction-level lock and validate referenced tags, preventing concurrent delete/assignment races. Direct database writes must honor these validations; array elements do not have individual foreign keys.

The embedded `docs/tags-upgrade.sql` runs with startup upgrades enabled. Otherwise apply it manually after prior upgrades. Existing records receive empty tag arrays without deleting data.

Validation: client build/unit tests, .NET build, schema/query translation and auth/CSRF checks in `tests/CatalogModelChecks`, and mocked browser checks for CRUD/archive/delete/restore, multi-selection, all four record forms, saved class preservation, filtering and mobile/desktop widths. Static-export fallback routes emit existing React hydration notices in the mocked harness; no other browser exceptions occurred. Production data and physical Safari are not touched.
