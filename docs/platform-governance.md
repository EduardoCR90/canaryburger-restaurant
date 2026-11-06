# Platform governance · template 0.4.2

## Version authority

Every instance retains `template.lock.json`: immutable source commit, version and SHA-256 of every distributed file. `template.release.json` adds the template key and supported configuration/content/visual contracts. `template.instance.json` declares the contracts supported by that instance. Existing document fields, legacy compositions and visual contract 2 remain unchanged.

The platform catalog contains reviewed release identities (including the aggregate distribution hash). Per-restaurant metadata separates a **selected** release from an **installed** release. Only the registered main deployment workflow, authenticated with GitHub OIDC, can report the exact ready/successful build and confirm installation. Selecting or validating an update never reports deployment success. Old callbacks cannot roll back a newer verified run. No CMS content is stored in this registry.

## Safe reusable update

An operator authenticated as Super Admin checks out the approved source release and a clean instance branch, then runs:

```sh
node /path/to/restaurant-astro-template/tools/update-instance.mjs /path/to/restaurant-astro-template v0.3.0
```

The updater verifies the existing generated files, trusted upstream and immutable ref, release/template/contracts, minimum version and downgrade/major-version policy. It prepares an isolated temporary Git worktree, updates only the generated package and lockfiles, installs dependencies without lifecycle hooks, and runs `template:verify`, `check`, `test`, `build`, `check:build` with explicit synthetic/demo mode. A failed check leaves the instance unchanged. Unrelated local edits are never overwritten. Only after success is the patch applied to the original branch, with a `template.update.json` receipt (`validated-not-deployed`).

Review/commit that patch in the instance PR. CI repeats its normal contract, navigation and visual checks; the existing production workflow validates the real published CMS snapshot before deployment. The receipt is an audit aid, not authorization or a substitute for CI/OIDC. No deployment, CMS write, bootstrap or migration is executed by the updater. Rollback requires a reviewed PR and the same validation, rather than an automatic downgrade flag.

The tool is deliberately callable by a future privileged worker. Phase 5 does not create resources or add a fleet auto-updater. A private source checkout needs an authorized GitHub identity; do not put a personal token in the instance or its browser.

## Automated instance bootstrap

Version 0.4.0 added a central bootstrap without changing the renderer contracts. Version 0.4.1 preinstalls the exact final workflows, preserves the original manifest commit across safe retries and executes the deployment reporter explicitly. The SaaS creates a repository from this GitHub template and dispatches the copied `bootstrap-instance.yml` with a strict public specification and its SHA-256. The specification contains the restaurant display configuration, dedicated Sanity project/dataset, module snapshot, provisional Pages URL, approved release identity and callback endpoints. It never contains a CMS token, GitHub token, Supabase key or customer credential.

The bootstrap verifies the selected release against the checked-out source commit, materializes into an empty temporary directory, vendors the package with per-file hashes, installs without lifecycle scripts and runs verify/check/test/build/check:build before committing. A repeated dispatch accepts only the same request and specification hash. After the push it reports the exact instance manifest and commit through GitHub OIDC. The backend independently checks repository ID, workflow path, manifest hash and Pages configuration before registering the deployment.

The generated repository uses the official Astro and GitHub Pages actions. An empty new dataset may report a successful template build with no editorial fingerprints only when `ALLOW_EMPTY_PUBLICATION_EVIDENCE=true`, template identity is present and the registered workflow passes OIDC. This confirms the installed code, not any unpublished CMS content; later document publications still require matching revision fingerprints.

GitHub template generation currently uses the template repository's default branch. The backend therefore requires its exact HEAD to equal the approved release commit before creating a repository. Older releases remain valid for controlled updates, but a new instance starts only from the approved release currently published on `main`.

## Definitive SaaS boundary

Super Admin is the active global administrator recorded in the platform database. Restaurant owner/manager means client Admin, never Super Admin. JWT metadata or UI flags cannot grant this role.

Client Admin may edit content, images, prices, categories, SEO and editorial text, save/publish/withdraw drafts and inspect deployment/template versions. Existing block keys/types/layout settings and global theme/logo are preserved; ordering and `enabled` flags are editorial. The client cannot add/remove/retype presentation blocks, change layout/alignment/spacing/presets/branding, activate modules, select releases or create websites/restaurants. Super Admin retains those operations after normal tenant authorization. A client cannot publish, restore or discard a design-changing draft created by a privileged session.

The dashboard and Edge enforce the same distinction. PostgreSQL blocks direct module updates for every authenticated client; only the audited privileged RPC can activate an entitled module. Existing module values and integrations are not changed during migration. Sanity project credentials remain backend-only. Direct Sanity/Studio roles are external to SaaS authorization: customer accounts should use only the dashboard and must not receive independent project write credentials.

## Phase 6 input contract

`src/types/platform.ts` exports strict release, website-state and `provisioningSpec` contracts. A plan includes a request UUID, restaurant UUID/name/slug, approved immutable release, validated visual overrides, module grants/activation, user assignments, dedicated Sanity integration/project/dataset and repository/HTTPS origin/base/optional custom hostname. It contains no tokens, arbitrary scripts or authorization booleans. The current legacy content-contract identifier remains `salitre-v1` for compatibility.

Validation does not prove ownership or authorize creation. The future executor must re-resolve the active Super Admin, catalog identity, integration ownership/exclusivity and user memberships in the server, verify domain ownership and resource-name availability, persist idempotent progress and verify resulting builds/deployments. Custom domain fields in phase 5 are metadata only: no DNS, CNAME, credentials, restaurant creation or provisioning executor is introduced.

## Validation

Tests exercise strict plans and domain inputs, immutable distribution hashes, compatible/incompatible updates, fixed validation commands, failed-build isolation, a fully materialized synthetic instance, byte-identical preinstalled workflows and untouched instance configuration. Version 0.4.2 adds only the explicit progressive-page fallback for newly provisioned datasets; Salitre remains on its existing release and retains its navigation, SEO and base-path behavior. Backend tests cover direct SQL bypass, role/tenant isolation, visual-field forgery, privileged drafts and successful-build-only installation tracking.
