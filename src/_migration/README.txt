PaladinHub V1 -> V2 FE migration package

- The current V2 src/ and public/ were preserved.
- V1 images were copied to public/images/ and favicon.ico to public/.
- V1 CSS was copied to src/styles/ without automatic imports.
- Every mapped Razor view has a target .tsx file.
- Existing V2 .tsx files were preserved; the corresponding original Razor source was appended as // comments.
- Missing .tsx targets were created as valid React stubs returning null, with original Razor source appended as // comments.
- Exact unmodified Razor sources are also stored under src/_migration/v1-razor/.
- Raw V1 JavaScript is stored under src/_migration/v1-js/ as .txt and is not executed.
- Razor/C# behavior has intentionally NOT been converted yet.

POINT 6: All migration stubs were converted to renderable React/TypeScript.
Dynamic API data and endpoint wiring remain separate migration steps.
