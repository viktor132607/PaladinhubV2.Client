# Audit corrections — 2026-09-14

SEO controls check each operation permission. Media selection and upload use their own permissions. The editor supports library selection, clipboard images/URLs and file upload, inherited metadata preview and deployed-manifest comparison. Saving requests a rebuild rather than claiming immediate publication.

Navbar and product actions use effective permissions. Role history supports stored PascalCase snapshots and recovery of tombstoned roles.

The build fetches and validates one public snapshot before launching Next workers. All generated metadata, sitemap and manifest consume that immutable payload. Invalid or unavailable snapshots stop API builds; fixture mode remains explicit. Nested schema and duplicate targets are validated. Canonical aliases do not create duplicate sitemap URLs. Product/discussion detail paths are exported from the public snapshot.

The Render API origin matches the production environment and CI configuration.

Validation: TypeScript, Vitest, production fixture export and SEO artifact verification; negative API build verifies fail-closed behavior. PostgreSQL/HTTP integration verification belongs to server CI. Browser acceptance is separate from these checks.
