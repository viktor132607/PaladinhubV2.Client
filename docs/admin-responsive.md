# Admin responsive coverage

Target: iPhone 13 Pro Max, 428 × 926 CSS pixels (portrait) and 926 × 428 (landscape). Desktop checked at 1440 × 1000.

## Complete page inventory

All 17 admin page components were included, including aliases and shared controls:

| Area | Components |
| --- | --- |
| Database | Database (Spells and Items) |
| Items | CreateItem, EditItem, ItemDetails, DeleteItem |
| Spells | CreateSpell, EditSpell, SpellDetails, DeleteSpell |
| Page Builder | PageBuilderIndex, CreatePage (create/edit), DeletePage (both aliases), TalentTrees |
| Products | CreateProduct, EditProduct (both `/Admin/Products` and `/Products` routes) |
| Promo codes | PromoCodes, CreatePromoCode |

Shared coverage: primary navigation, touch guide dropdowns, account menu, secondary navigation, promo dropdown, collapsible admin sidebar, footer, BuilderNavigation, TreeEditor, TreeView, rendered block previews, and the unused legacy EditOverlay component.

## Implementation

- Compared V1 `Areas/Admin/Views/Shared/_LayoutAdmin.cshtml`, `Areas/Admin/Views/Database/Index.cshtml`, and `wwwroot/css/site.css` before changing the V2 layout. Retained its dark/gold appearance.
- Narrow navigation collapses; all links remain reachable. Guide menus open by tap and include Overview. The secondary promo dropdown is no longer clipped by a horizontal scrolling container.
- Database, page list, and promo records become labelled mobile cards with every field and action retained. Desktop tables retain their columns. Pagination wraps.
- Inputs use 16px text on phones to avoid focus zoom; controls have touch-sized targets. Content wraps without forcing the page wider.
- Product image rows wrap their URL and controls. Both product route families use the same admin layout.
- Talent sources stack above the editor on narrow screens. Individual trees and previews retain local horizontal scrolling, so nodes keep usable sizes. Nested editor panels have smaller phone padding.
- Viewport safe areas and dynamic viewport height are supported. Pinch zoom remains enabled.

## Validation

- `npm run typecheck`: passed.
- `npm run build`: passed; all 83 static pages generated.
- Chromium with mobile/touch emulation and mocked admin API responses: 26 route/data variants × 3 viewport sizes = 78 layout checks, no document overflow.
- Five additional checks: expanded primary navigation, secondary promo dropdown, all eight page block models, active talent editing, and the icon picker. No document overflow. Sidebar opening and touch guide opening/closing also verified.
- Tested long names, descriptions, URLs, populated record cards, image gallery controls, and 30-page pagination. Inspected phone screenshots.

Limits: browser emulation, not a physical iPhone/Safari test; no live data mutations. Static-export navigation emitted React hydration warning #418 during the test (the compatibility router initializes `/` on the server and the actual URL in the browser); this work does not change that router. Mock image URLs are intentionally unavailable. The unused legacy overlay was inspected in source, not mounted by an admin route.
