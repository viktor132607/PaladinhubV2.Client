# SEO static-build and publishing policy

PaladinHub V2 is exported as static HTML. Saving SEO data in the database therefore does **not** change already-deployed HTML immediately.

## Build sources

`SEO_BUILD_SOURCE` controls where static generation obtains SEO data:

- `api` — production mode. The build requests `${NEXT_PUBLIC_API_URL}/api/seo/snapshot`. A non-success response, invalid payload or unreachable endpoint is retried three times and then fails the build. Production must not silently replace current database SEO with defaults.
- `fixture` — deterministic offline mode for CI/tests. It uses `src/lib/seo-build-fixture.ts` and does not contact production services.

The repository production configuration uses `SEO_BUILD_SOURCE=api`. CI explicitly overrides it with `fixture`, then separately proves that an unavailable API-backed snapshot causes the build to fail.

## Saved versus published

The backend snapshot has a deterministic `snapshotVersion`. It changes when public SEO entries, their versions, published Page Builder paths, the public static-route registry or its version changes.

Every static export also emits `/seo-build-manifest`. The manifest records:

- `snapshotVersion` and `registryVersion` included in that exact build;
- snapshot and build timestamps;
- build commit when supplied by CI/Render/GitHub;
- public site and SEO snapshot origins;
- `requiresRebuildForChanges: true`;
- whether a deploy hook is actually configured.

To determine publication status, compare the current backend `/api/seo/snapshot` `snapshotVersion` with the deployed `/seo-build-manifest` `snapshotVersion`:

- equal — the deployed build contains the current public SEO snapshot;
- different — the database contains SEO changes that require a new successful client build/deploy.

No deploy hook exists in this repository, so the code does not claim that saving an admin edit automatically deploys it.

## Environment

Production defaults currently use:

- API: `https://paladinhubv2-server.onrender.com`
- site: `https://paladinhubv2-client.onrender.com`

Environment overrides from the actual deployment remain authoritative. Do not replace these hosts based on older examples.

## Locale URLs

The current language selector persists UI language locally and does not create locale-specific public URLs. The static SEO layer therefore does not emit `hreflang`. Add it only together with real locale routes, reciprocal alternate links and locale-specific canonicals.
