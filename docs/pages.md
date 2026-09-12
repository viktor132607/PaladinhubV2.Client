# Pages — task 8

Page Builder now includes History & recovery. All EF-tracked page writes (including legacy editors, the talent builder and both delete paths) record content, metadata, publication status, actor and time. Deletes are recoverable; archive hides a page from ordinary reads; unarchive returns it as a draft. Restoration restores the chosen content, route and publication state after validating its layout and route availability.

A shared transaction lock covers page writes and navigation edits. Deleting a page referenced by an undeleted navigation link returns a conflict. Existing page routes remain reserved while archived/deleted. Metadata editing and publication buttons send the loaded RowVersion, so stale metadata cannot silently replace newer edits. Layout writes retain their existing version checks.

`docs/pages-upgrade.sql` imports a recovery snapshot of each existing page. The audit hooks update PageRevision and ContentPage in one SaveChanges transaction and never physically remove a page. Static V1 pages remain protected by the existing editor rules; history applies to database content pages.

Verified: client/server builds, EF state transitions for create/update/recoverable delete, row-version generation and visibility filter, PostgreSQL-compatible idempotent migration and FK tests, mocked browser archive/unarchive/delete/restore and responsive widths. Production startup upgrades and physical iOS Safari were not executed.
