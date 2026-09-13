# Point 15.6 — Roles & Permissions client regression audit

Status: final verification candidate. Point 15 is complete only after the matching Server/Client branches are safely published to `main` and both `main` push CI runs are green.

## Final client behavior

- authenticated session state consumes the backend `permissions[]` effective-permission set; role names are not the Client authorization source of truth;
- `/Admin`, every granular admin route, the admin menu and the dashboard use permission-aware guards;
- direct navigation without the required permission routes to `/Error/403` rather than relying only on hidden navigation;
- admin menus and lifecycle/action controls are hidden or disabled according to the current effective permission set;
- the Roles screen supports custom-role create/edit/delete, grouped permission matrix, protected system-role state, assignments, history/restore and audit;
- the Users screen supports searchable users and explicit role assignment/revocation with server errors surfaced to the operator;
- a runtime 403 from `adminRequest` dispatches a permission-refresh signal; `AuthContext` reloads `/api/auth/me`, so route/menu/action state is recalculated from the current server grants and a no-longer-authorized route is redirected by `PermissionRoute`;
- a stale role conflict preserves the local draft and presents an explicit `Load latest` control. The server version replaces the draft only after the operator selects that action;
- the protected system role does not expose controls that the backend will always reject;
- responsive layouts use Bootstrap breakpoint/stacking/table-responsive patterns for narrow and landscape layouts rather than desktop-only fixed widths.

## Catalog alignment

The Client permission constants match the final audited Server catalog. Nine no-op operation IDs were removed from both sides during 15.6: `users.create`, `users.update`, `users.delete`, `talent_pages.delete`, `media.create`, `media.archive`, `spell_icons.delete`, `product_reviews.read`, and `promo_codes.delete`.

`talent_trees.read` remains intentionally Client-visible because it controls access to the Talent Tree Builder while the underlying read data is also consumed by the public guide.

## Regression gate

The final Client branch must pass:

- TypeScript typecheck;
- Vitest suite;
- deterministic Next.js static production export;
- SEO export verification;
- production SEO fail-closed build check;
- existing non-blocking lint/audit debt is reported separately and is not represented as fixed by point 15.

The 15.5 published baseline passed 29/29 tests and generated 102/102 static pages. The final 15.6 head requires a new CI result after the runtime-403 refresh, stale-conflict recovery and permission-catalog cleanup commits.

Known pre-existing Client debt remains outside point 15: 9 non-blocking lint errors and 17 npm audit findings (2 low, 5 moderate, 9 high, 1 critical) at the previous main gate.

GitHub source publication and CI do not prove that Render has completed a production deployment.
