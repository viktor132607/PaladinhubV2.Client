# Routing architecture

PaladinHubV2 uses one client-side routing table: `src/App.tsx`.

- `src/router/nextCompat.tsx` supplies the small React Router-compatible API used by the migrated components.
- Migrated components import the compatibility API directly from `@/router/nextCompat`; no `react-router-dom` package or TypeScript alias is required.
- Files under `src/app/**/page.tsx` are only Next.js static-export entry points and delegate to `App.tsx`; they do not define a second route table.
- Do not add another `createBrowserRouter`, route table, or Next page-specific rendering path.
