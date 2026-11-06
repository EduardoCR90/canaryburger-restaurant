# Architecture

The package distributes Astro components, layouts, content contracts and pure adapters. It never owns restaurant content, credentials, schemas or account authorization. Each independent Astro instance supplies typed configuration, its content loader and public assets. Historical compositions remain available beside CMS blocks; neither requires a visual builder.

An instance may explicitly enable demo fallback while its newly created dataset is incomplete. In that state, individually valid published pages override or extend only the fallback page collection; the remaining editorial base stays unchanged and visibly marked as demo. Invalid pages, duplicate slugs and partial CMS data without that explicit flag still fail the build validation.

Versioned source is distributed with a pinned commit and a file integrity manifest. Instances consume a file dependency so private source access is not needed at build time. The update tool replaces generated distribution files; restaurant overrides stay outside the package.
