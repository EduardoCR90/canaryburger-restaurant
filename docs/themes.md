# Visual themes and composition · 0.2.0

Optional `settings.theme.preset` selects Elegant, Modern or Casual. Presets provide colors, fonts, spacing/widths, buttons and component layouts. Explicit token overrides take precedence. Without a preset, the instance's existing configuration and explicit CMS fields remain authoritative; no defaults are written to Sanity.

Layouts use existing components, not copies per theme:

| Component       | Supported layouts                           |
| --------------- | ------------------------------------------- |
| Hero            | editorial, compact, split, cover            |
| Menu/categories | editorial, compact, grid                    |
| Featured dishes | editorial, compact, grid                    |
| Gallery         | editorial, compact, grid/scrollable compact |
| CTA             | editorial, compact, split                   |
| Header          | editorial, centered, compact                |
| Footer          | editorial, columns, minimal                 |

The public renderer uses a safe editorial fallback for unknown variants. The portable stored-content contract rejects unsupported choices, invalid colors and unsafe/out-of-range tokens before a write. Preset text/background contrast is tested. Custom colors are accompanied by an editor contrast warning.

`src/types/visual.ts` is the canonical portable contract. Dashboard/Edge and Studio distribute that exact file with a release/commit/SHA manifest; they do not import Astro into the backend or maintain independent preset models. Studio remains the authoritative registry of document/field types; the additions are optional and preserve the existing IDs and references.

Existing blocks retain order, keys and data. `enabled:false` omits a block; a nonempty list containing only hidden blocks stays a block composition and does not reactivate the historical layout. `menuSection.featuredOnly` reuses the menu block for featured, visible and available dishes. An explicit block variant overrides its preset default.

Historical pages keep their layouts. Optional `page.composition.sections` flags hide individual sections without conversion or deleting their content. Hidden home heroes retain one visually hidden h1. Empty block lists still use the historical composition; adding the first block or deleting the last requires a clear confirmation in the editor.

The dashboard uses the existing save-draft/publish/discard/revision and deployment flow. It does not perform CSS injection, client CMS calls or deployment dispatch. All writes still use authenticated tenant authorization. During rolling deployment, the API advertises visual contract 2; new controls wait for that capability. Older clients cannot save documents whose new visual fields they would drop. This is protocol negotiation, not an authorization grant.

Tests use only synthetic documents and photos. Browser checks build all three presets at mobile/desktop widths and verify differing layouts, visibility, overflow and JS errors. Salitre compares its four legacy pages against the pinned pre-variant build in the same browser, including geometry/styles and screenshot pixels.

Deployment order: release template → update the instance → deploy the compatible backend/editor → deploy the updated Studio schemas if desired. No data migration, new secrets, webhook or SQL changes are needed. Provisioning and definitive fleet/version management remain the following iterations.
