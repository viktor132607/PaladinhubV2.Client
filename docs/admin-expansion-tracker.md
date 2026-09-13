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
