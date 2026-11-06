# Instance configuration contract · version 1

Each independent site supplies `RestaurantConfigInput`, validated by `resolveConfiguration`. The minimal example is `example/restaurant.config.ts`.

- `restaurantKey`: stable non-secret site identity; never an authorization claim.
- `site.url`: HTTPS origin without credentials/path/query; `site.base`: root or a safe project subpath.
- `sanity.projectId/dataset`: the instance's own project. No implicit source project. CMS mode requires projectId; the dataset defaults to production as a convention, not permission.
- `theme`: colors, serif/sans choice, secondary font, spacing scales, content/reading widths, button style/shape and existing card style. Values are validated before generating CSS; no free CSS snippets.
- `assets`: instance-owned favicon/social fallback plus type/dimensions/alt, optional image preconnect origins. A CMS SEO image takes precedence.
- `editorial`: explicit fallback copy for historical compositions and global texts. Missing fields inherit; null links hide; headings are atomic. The loader resolves these only in memory, without CMS writes.
- `requiredSlugs`: optional strict legacy-route requirements per instance. Generic sites are not required to carry four historical pages.
- `variants`: initial per-block defaults (editorial/compact); explicit CMS variants retain precedence. Further variants belong to iteration 2.
- `deployment`: provider and optional public report endpoint. It is configuration, not a secret or a trigger. OIDC is requested only by authorized Actions jobs.

Build overrides: SITE_URL, SITE_BASE, SANITY_PROJECT_ID, SANITY_DATASET. SANITY_API_READ_TOKEN is passed only to the server loader and never enters resolved configuration. SANITY_USE_MOCK and SANITY_ALLOW_DEMO_FALLBACK accept only true/false. Demo content must be explicitly supplied by the instance; failures never silently mix CMS and demo.

Each loader owns its snapshot promise. There is no global tenant state. Multiple loaders with different configurations cannot reuse each other's content or caches. CMS theme values override configuration where explicitly supplied; demo appearance uses instance configuration.

This is the input contract for future provisioning. This iteration does not create Sanity projects, users, datasets, webhooks or deployments for new restaurants.

At an Astro server entry point, access each import.meta.env property explicitly, as in example/src/lib/content.ts. Passing the entire import.meta.env object drops private build variables in recent Astro versions; never compensate by exposing them through PUBLIC_.
