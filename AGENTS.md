# Shared restaurant template conventions

- Read README.md and docs/architecture.md before changing public contracts.
- Preserve Astro static output, strict TypeScript, minimal client JS, semantic HTML, keyboard access and reduced motion.
- All presentation and contracts live here. Restaurant names, editorial fallbacks, photos, project IDs, URLs and branding belong in explicit instance configuration or CMS data.
- Never write Sanity content, embed secrets, or treat CMS preferences as commercial authorization.
- Version the source package with semver. Breaking contracts require a major release and migration notes; instances pin an immutable commit and verify distributed files.
- Keep existing CMS fields, null/inheritance semantics, revision evidence and published-content validation compatible. No automatic conversion of historical pages into blocks.
- Run npm ci, npm run check, npm test, npm run build and npm run check:build. Tests use synthetic data, never live CMS writes.
- Provisioning, new Studio schemas and a visual builder are outside iteration 1.

- Iteration 2: src/types/visual.ts is the portable canonical theme contract. Keep sparse stored overrides, safe renderer fallbacks and legacy rendering. New visual changes must pass preset browser checks and the Salitre baseline comparison; do not modify real CMS content in tests.

- Phase 5 closeout: preserve template.release.json, immutable distribution hashes, instance support checks and isolated update validation. Version installation is confirmed only by matching ready/succeeded OIDC evidence. Provisioning is a strict plan, not an executor; see docs/platform-governance.md.

- Phase 6.2: the GitHub template bootstrap accepts only a hashed public specification, materializes in an empty directory and reports through OIDC. Never add provider/CMS credentials, arbitrary commands or client authority to the specification. Keep repeated dispatches idempotent and verify the exact release before committing.
