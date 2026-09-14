# Point 16 — active translation work

The source inventory covers every TS/JS/JSON file under src, including test fixtures and technical strings. It records locations and proposed states; pending records are not claimed as translated. Run npm run inventory:translations after source edits, then npm run verify:translations-inventory. These reports are review material, not runtime dictionaries.

The built-in bilingual catalog currently covers navigation, account menu, language selection, page menu actions and footer. Stable keys have EN/BG values; official WoW specialization names have explicit preservation reasons. The runtime supports missing-key English fallback and intentional empty CMS overrides. Bulgarian remains available when the localization API is offline; html.lang follows the displayed language.

Still required for point 16: review all pending records, translate the remaining public/auth/store/discussion/admin/picker/validation/editorial content, map server errors to stable keys, and verify every route group in both languages. The 32-key catalog is a completed initial group, NOT complete website coverage.

The complete report is versioned as `inventory.json.gz`; regeneration also writes readable `inventory.json`. No records are omitted by compression.

## Verified recovery batches

The interrupted session's uncommitted 1494-key draft was not present after recovery. Do not count that draft as shipped. The current catalog has 97 keys: the initial 32, 34 administrative-navigation entries, and 31 image-picker entries. Administrative links and image-picker labels, local errors and accessibility text are wired to these values. Server messages that are not in this catalog still fall back to their source text.

Editorial overrides now accept stable page-scoped paths, for example `page.42.id.blockA.title` or `page.42.id.blockA.props.text`. Nested identifiers retain their parent path. Public content and the editing preview use the same page ID. Existing source-text keys remain supported, with stable keys taking precedence, including intentionally empty or English values. Names, identifiers, code, media references and routes are not translated by the recursive prose mapper. Blocks without IDs use positional paths (`page.42.0.title`), which do NOT survive reordering; do not claim stable identity for those legacy blocks.

Point 16 remains incomplete: remaining UI and guide prose, server messages, full editorial-key management, source-by-source coverage classification, and live mobile/browser verification are still required. Unit rendering tests are not a substitute for browser interaction tests.
