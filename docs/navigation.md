# Navigation — task 7

Admin → Data → Navigation edits public primary and utility menu links, names, URLs, order, new-tab behavior and one level of submenus. Existing V1 labels/paths are seeded once, with initial history snapshots. The V1 navbar/dropdown classes remain; admin, cart and account controls remain available independently of editable links. The guide Add/Delete page shortcuts are preserved.

The public navbar consumes `/api/navigation`; successful edits refresh the current tab's navbar. Archived/deleted links are excluded. If the endpoint is unavailable, the previous built-in navigation remains the fallback. An intentionally empty catalog remains empty. New-tab links include noopener/noreferrer, and URL validation permits only site paths or HTTP(S) destinations. Mobile dropdowns have separate 44px toggles and Escape support.

The catalog supports archive, recoverable deletion, revision history and optimistic version checks. Parent deletion is blocked while undeleted children exist. Cycle/depth/location checks prevent invalid hierarchies; active children must be archived or moved before archiving their parent. The shared catalog lock serializes mutations.

Server implementation follows the updated main architecture: HTTP controller, common contracts and NavigationAdminService using GameDataAssignmentService. The 41 intervening server refactor commits through 9eeaba9 were incorporated before completing this point.

`docs/navigation-upgrade.sql` is an embedded idempotent startup upgrade. Validation: client build/unit tests, complete updated server build, model/authorization/URL checks, PostgreSQL-compatible schema tests, and mocked browser CRUD/recovery, parent protection, external links, existing page shortcuts and 428/926/1440px layouts. Production deployment and physical Safari are not verified.
