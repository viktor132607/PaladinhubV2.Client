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
