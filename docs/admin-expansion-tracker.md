# PaladinHub V2 admin expansion tracker

Baseline after point 11: `496aa0ddc3fb5484e7e40851f0a9652a8f2501e8`.

## Point 12 — banners and messages
Status: implementation candidate; complete only after CI and remote-main verification.

Implemented:
- public banner zones above navbar, below navbar and above page content;
- page-aware API refresh and exact next-period-change timer;
- version-scoped dismissal in localStorage so edited banners reappear;
- stable localization keys with English source fallback;
- responsive banner styling that does not cover navbar/content;
- admin search/status filters, full editor, local-time inputs with UTC storage note, preview, history/restore actions;
- image URL, media-library selection, upload and clipboard-paste workflows.

Verification gate:
- client typecheck/tests/static export CI;
- responsive browser checks at 428×926, 926×428 and desktop where browser automation is available;
- exact diff and fresh remote-main comparison before fast-forward;
- do not treat CI/main publication as production deployment evidence.

Commit: recorded after verified publication to `main`.

## Review after the incomplete banner implementation

Found and corrected: API requests were executing DDL; banner data logic lived in the controller; deleted banners could bypass revision recovery through unarchive; unsafe backslash URLs were accepted; media usage was absent from admin counts; editing schedule dates shifted local time; image browsing loaded only the first media page; the static banner route was missing; below-navbar banners could overlap the fixed navbar. Restored readable baseline layouts while preserving every existing route and the banner additions.

Verification: server/API build; 9 banner validation/controller/boundary tests; client static build and 17 tests; actual upgrade SQL executed twice in PGlite with media deletion-trigger checks; mocked-browser UTC/local-time round trip, CSRF/version submission, dismissal/new-version display and 428×926/926×428/1440×926 dimensions. Public request DDL removed; schema now uses the existing startup migration gate. Production deployment and full PostgreSQL/Npgsql CRUD integration are not claimed.

Remaining sequence: 13 footer, 14 SEO, 15 roles/permissions, complete translation inventory/coverage, then unit tests for all remaining controllers. These are not marked complete.

## Point 13 — footer and contacts

Implemented versioned entries with section FKs, typed links and contacts, ordering/moving, archive and revision restore. Section deletion is blocked while entries remain. Added responsive admin editor, public data rendering, intentional-empty vs failure fallback, copyright year replacement, and stable translation keys. Default V1/V2 copyright is seeded once. Verification: client/server builds, 11 focused tests, actual SQL idempotency/preservation/FK checks in PGlite. Browser checks passed: section/contact CRUD, history restore, typed mailto links, empty-response versus outage fallback, and portrait/landscape/desktop dimensions. Explicit form-label associations were corrected after the browser checks caught ambiguous labels.

Banner fixes published: Server `d66019fa7ebc73f689b2eaa9bc6baaab2c1d2acb`; Client `527684ff7c2f235c21fe16b5ade9dbd23d19dbae`.

## Point 14 — SEO admin and static publishing

Status: verified implementation; ready for coordinated publication after the final branch CI remains green.

Implemented:
- responsive `/Admin/Seo` editor with global defaults, static/database targets, media selection, lifecycle/history/restore, stale-version handling and SEO preview;
- build-time public SEO snapshot resolution for home, static public routes and published Page Builder routes;
- exported title, description, canonical, Open Graph, Twitter and robots directives in actual prerendered HTML;
- generated `sitemap.xml` limited to canonical public indexable routes and `robots.txt` blocking private/admin/account/cart/checkout areas;
- deterministic repository fixture for tests/CI, including a published Page Builder route and a route-specific `noindex` case;
- production `SEO_BUILD_SOURCE=api` policy with three bounded retries and explicit build failure when the validated SEO snapshot is unavailable or invalid; no silent production fallback;
- static `/seo-build-manifest` recording the exact snapshot/registry version included in that build, the build commit and whether another rebuild is required for database changes;
- current Render API/site origins in production examples, while deployment environment overrides remain authoritative;
- no deploy hook is claimed because none is configured in the repository;
- no `hreflang` is emitted because the current language selector does not provide real locale-specific public URLs.

Verification evidence:
- Client CI run 22 completed successfully;
- typecheck succeeded;
- unit suite: 24 total, 24 passed;
- deterministic Next static export generated 99 pages;
- actual exported HTML verified canonical, Open Graph, Twitter, Page Builder metadata, private/admin `noindex` and a public route-specific `noindex` case;
- exported sitemap includes the published Page Builder fixture and excludes aliases, private routes and the fixture `noindex` route;
- exported `robots.txt` and `/seo-build-manifest` passed post-build assertions;
- a second CI build intentionally pointed the API-backed SEO source at an unreachable endpoint and correctly failed after three attempts with `SEO build failed`, proving fail-closed production behavior.

The existing repository lint debt remains non-blocking and unchanged by point 14. Main publication is source-control publication only; it is not proof that Render has deployed the resulting commits. Final server/client publication SHAs are recorded after the coordinated fast-forward.
