# Point 16 — active translation work

The source inventory covers every TS/JS/JSON file under src, including test fixtures and technical strings. It records locations and proposed states; pending records are not claimed as translated. Run npm run inventory:translations after source edits, then npm run verify:translations-inventory. These reports are review material, not runtime dictionaries.

The built-in bilingual catalog currently covers navigation, account menu, language selection, page menu actions and footer. Stable keys have EN/BG values; official WoW specialization names have explicit preservation reasons. The runtime supports missing-key English fallback and intentional empty CMS overrides. Bulgarian remains available when the localization API is offline; html.lang follows the displayed language.

Still required for point 16: review all pending records, translate the remaining public/auth/store/discussion/admin/picker/validation/editorial content, map server errors to stable keys, and verify every route group in both languages. The 32-key catalog is a completed initial group, NOT complete website coverage.

The complete report is versioned as `inventory.json.gz`; regeneration also writes readable `inventory.json`. No records are omitted by compression.
