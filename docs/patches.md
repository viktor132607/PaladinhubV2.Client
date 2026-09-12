# Patches / game versions — task 4

Admin → Data → Patches manages version labels (for example, a patch number), descriptions, ordering, archive, soft deletion and revision recovery. No game version is assumed or seeded. Names are unique case-insensitively among undeleted entries; archived versions remain visible on existing records.

Every item/spell can reference one patch, or Any patch. The choice is available on all four create/edit forms and in the talent database-piece editor. Details and delete confirmations show the saved patch. Database patch filtering composes with class, category, tags and text search, retaining choices across pagination.

Used patches cannot be deleted. Archive blocks new assignments but preserves existing ones. Changes and restores use optimistic versions and the same transaction lock as record saves. Foreign keys protect stored assignments. History includes actor, action, time and previous snapshots.

`docs/patches-upgrade.sql` is embedded in the API startup upgrades; existing rows receive NULL (Any patch). Run with startup upgrades enabled, or apply the script after earlier catalog upgrades.

Validation: production client build; server model/query and authorization checks; mocked browser CRUD, archive, deletion/recovery, four-form assignment/preservation and database filters at mobile/desktop widths. Physical iOS Safari and production deployment are not verified.
