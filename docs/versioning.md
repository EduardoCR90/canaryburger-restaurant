# Versioning and controlled updates

Source: private `EduardoCR90/restaurant-astro-template`. Version 0.1.0 starts the extracted contract. Source tags are immutable. Patch releases preserve behavior; minor releases add compatible capabilities. Breaking changes require a major version, a contract-version change where needed, and migration notes. Never silently follow main in a restaurant build.

Each instance records version, immutable commit and per-file SHA-256 in template.lock.json. Its dependency points to the generated vendor package. Normal builds need no private GitHub token, no cross-repository access and no npm registry publishing.

To update one site manually:

1. Review the template PR, its CI and release notes. Fetch the private source with your own authorized GitHub access and check out the chosen release tag.
2. In the instance run `node scripts/template-distribution.mjs sync /path/to/restaurant-astro-template v0.1.0`. The utility verifies the upstream remote, exact clean commit/tag, package identity, absence of install hooks and existing generated-file integrity. It stops if someone edited generated source.
3. Run `npm install --package-lock-only --ignore-scripts` and `npm ci`. Commit vendor, template.lock.json and package-lock.json together in an instance PR.
4. Run the instance's contract, visual-layout, navigation, image, SEO and build checks. Merge only with CI green. Keep the existing deployment workflow and OIDC correlation contract.

Verify without network: `node scripts/template-distribution.mjs verify`.

Overrides belong outside vendor: instance configuration, editorial fallback data, public assets and explicit local compositions if necessary. Do not edit the vendor package or duplicate shared renderers. Revert an instance PR to roll back its pinned version. No automatic multi-instance update service is added in this iteration.

The generated distribution inherits the visibility of the instance repository. A private upstream does not make source copied into a public instance private. Never distribute credentials, private content or customer exports.

0.1.1 hardens update tooling: an existing generated directory without its manifest is never treated as a fresh installation. Runtime components and CMS contracts are unchanged.
