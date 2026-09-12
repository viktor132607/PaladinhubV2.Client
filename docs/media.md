# Media library — task 6

Admin → Data → Media library lists uploaded images with preview, size, usage count, search and pagination. Upload from a file or paste an image; edit the name, alt text and description; copy the stable image URL; archive, soft-delete or restore metadata revisions. Metadata history never duplicates binary content. Existing uploads receive an initial recovery snapshot.

The shared image picker continues to support database browsing, clipboard images/URLs and file uploads. It is now available for both item icons, as well as spells/talents. Item legacy filenames and uploaded API paths resolve correctly. The picker includes existing item assets and excludes archived/deleted uploads. Item icon columns now accept URLs up to 2048 characters.

Usage protection covers spells, both item icons, product images, content-page layouts and discussion posts/comments. Spell/item assignments share the catalog transaction lock, reject new references to unavailable media, and preserve existing archived references. Other content still stores URL strings; concurrent writes from those systems are not serialized by this new API. Soft deletion preserves the actual image and its stable URL, so existing pages and caches do not break. There is no permanent binary deletion or replacement under an immutable URL.

Alt text is stored in the library and used in its previews; existing page-specific alt text is not overwritten automatically. Existing static/external images remain browsable from record pickers; metadata CRUD applies to uploaded files stored in the database.

`docs/media-upgrade.sql` is an embedded startup upgrade. Validation includes client/server builds, model/query/auth checks, PostgreSQL-compatible migration checks (idempotency, byte preservation and metadata-only history), and mocked browser upload/edit/archive/delete/recovery, used-image protection, item primary selection/second-icon upload and mobile widths. Physical Safari and production deployment are not verified.
