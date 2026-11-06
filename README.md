# Restaurant Astro Template

Private shared source package for independent restaurant websites. Extracted from the working editorial implementation; no restaurant data, credentials, source-project IDs, private photographs or branding are embedded in the runtime.

## Local example

Node 22.22+ and npm:

```sh
npm ci
cp .env.example .env
npm run dev
npm run check
npm test
npm run build
npm run check:build
```

The example runs without Sanity credentials and uses neutral synthetic content. For CMS mode explicitly configure the instance project/dataset and `SANITY_USE_MOCK=false`. Never use PUBLIC_ variables for tokens. There is no Studio embedded in this package and no CMS write path.

## Architecture

- `src/components/`: extracted page compositions, navigation, footer, photography, menu and ten block renderers.
- `src/layouts/`: shared HTML, SEO/Open Graph, accessibility and native Astro transitions.
- `src/types/`: runtime Zod contracts, TypeScript types and theme tokens.
- `src/lib/`: configuration, pure content adapters, published-only GROQ, navigation, menu, safe links and renderer resolution.
- `src/ops/`: revision evidence and OIDC reports; the endpoint is supplied by the instance.
- `example/`: independent Astro application and neutral demo assets, not distributed as restaurant content.
- `tools/template-distribution.mjs`: controlled source distribution and integrity verification.

[Architecture](docs/architecture.md) · [Configuration contract](docs/configuration.md) · [Versioning and updates](docs/versioning.md).

Existing logical page compositions continue to work when their CMS blocks are absent. Explicit CMS blocks determine order/data/variant without converting historical documents. No visual builder, provisioning or alternative CMS schemas are introduced.

## Distribution

Package: `@restaurant-platform/astro-template`, current version `0.4.2`. Private Git source is the authority; no public npm publishing or credentials in restaurant builds. Version 0.4.2 exposes individually valid CMS pages during the explicit demo fallback used while a new restaurant's base editorial documents are still pending. It preserves the bootstrap recovery and deployment reporting guarantees of 0.4.1.

Instances install `file:vendor/restaurant-template`, generated from an immutable upstream commit. `template.lock.json` records version, repository, commit and every distributed file's SHA-256. CI checks this manifest; edits to generated code stop updates rather than being overwritten. This is a controlled package distribution, not an independently maintained fork. Restaurant overrides stay in configuration, CMS and local assets.

The shared contract is compatible with the existing Studio/dashboard models. CMS changes remain coordinated with their authoritative schemas; layout and content contracts are versioned explicitly.

## Visual themes and composition

[Presets, variants, optional visibility and safe rollout](docs/themes.md). Elegant, Modern and Casual are configurable through the existing dashboard/CMS contract. Legacy instances without a preset retain their design.

## Platform governance

[Controlled instance updates, permissions boundary and provisioning contracts](docs/platform-governance.md). Version 0.4.2 preserves the visual/content contracts of 0.4.0.

## Instance bootstrap

The repository can be configured as a private GitHub template. A newly generated repository initially contains the bootstrap workflow and this immutable release. The platform dispatches `.github/workflows/bootstrap-instance.yml` with a public, hashed specification. The workflow materializes a minimal independent Astro application, vendors the exact verified package release, runs its checks and reports the resulting commit through GitHub OIDC. It never receives Sanity write tokens, GitHub credentials from the platform or arbitrary scripts.

The final instance keeps only its public configuration, version/integrity manifests, generated package distribution and standard Pages workflows. Those workflows already exist byte-for-byte in the GitHub template before bootstrap, so the Actions token never needs to create or replace workflow files. Future updates still use the controlled package updater; restaurant content and visual overrides remain outside the shared package.
