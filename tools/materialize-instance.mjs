import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  distributionHash,
  syncDistribution,
  verifyDistribution,
} from "./template-distribution.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const repository = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const endpoint = /^https:\/\/[^/\s]+(?:\/[^\s]*)?$/;
const modules = new Set([
  "content_management",
  "reservations",
  "staff_scheduling",
  "qr_menu",
  "events",
  "analytics",
]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

function strictKeys(value, keys, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `Unexpected ${label} field`);
}

function validateSpecification(value) {
  strictKeys(
    value,
    ["contract_version", "request_id", "restaurant", "template", "site", "sanity", "visual", "modules", "deployment"],
    "specification",
  );
  assert.equal(value.contract_version, 1);
  assert.match(value.request_id, /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i);
  strictKeys(value.restaurant, ["name", "slug"], "restaurant");
  assert.ok(value.restaurant.name.trim().length > 0 && value.restaurant.name.length <= 120);
  assert.match(value.restaurant.slug, slug);
  strictKeys(
    value.template,
    ["template_key", "version", "source_commit", "distribution_hash", "configuration_contract", "content_contract", "visual_contract"],
    "template",
  );
  assert.match(value.template.template_key, slug);
  assert.match(value.template.version, /^\d+\.\d+\.\d+$/);
  assert.match(value.template.source_commit, /^[a-f0-9]{40}$/);
  assert.match(value.template.distribution_hash, /^[a-f0-9]{64}$/);
  assert.equal(value.template.configuration_contract, 1);
  assert.equal(value.template.content_contract, "salitre-v1");
  assert.equal(value.template.visual_contract, 2);
  strictKeys(value.site, ["repository", "origin", "base"], "site");
  assert.match(value.site.repository, repository);
  const [owner, name] = value.site.repository.split("/");
  const origin = new URL(value.site.origin);
  assert.equal(origin.protocol, "https:");
  assert.equal(origin.username + origin.password + origin.search + origin.hash, "");
  assert.equal(origin.pathname, "/");
  assert.equal(origin.hostname.toLowerCase(), `${owner.toLowerCase()}.github.io`);
  assert.equal(value.site.base, `/${name}`);
  strictKeys(value.sanity, ["project_id", "dataset"], "sanity");
  assert.match(value.sanity.project_id, /^[a-z0-9]{1,32}$/);
  assert.match(value.sanity.dataset, /^[a-z0-9_-]{1,64}$/);
  assert.ok(value.visual && typeof value.visual === "object" && !Array.isArray(value.visual));
  assert.ok(JSON.stringify(value.visual).length <= 20000);
  assert.ok(Array.isArray(value.modules) && value.modules.length <= modules.size);
  assert.equal(new Set(value.modules.map((item) => item.key)).size, value.modules.length);
  for (const item of value.modules) {
    strictKeys(item, ["key", "granted", "enabled"], "module");
    assert.ok(modules.has(item.key));
    assert.equal(typeof item.granted, "boolean");
    assert.equal(typeof item.enabled, "boolean");
    assert.ok(!item.enabled || item.granted);
  }
  strictKeys(value.deployment, ["publication_endpoint", "provisioning_endpoint"], "deployment");
  assert.match(value.deployment.publication_endpoint, endpoint);
  assert.match(value.deployment.provisioning_endpoint, endpoint);
  assert.ok(JSON.stringify(value).length <= 60000);
  return value;
}

async function copyBlueprint(source, target) {
  const blueprint = join(source, "instance-blueprint");
  for (const entry of await readdir(blueprint, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), "Blueprint cannot contain symlinks");
    await cp(join(blueprint, entry.name), join(target, entry.name), {
      recursive: true,
      errorOnExist: true,
    });
  }
  await mkdir(join(target, "public"), { recursive: true });
  await cp(join(source, "example/public/favicon.svg"), join(target, "public/favicon.svg"));
  await cp(join(source, "example/public/og-default.png"), join(target, "public/og-default.png"));
  await mkdir(join(target, ".github/workflows"), { recursive: true });
  await cp(
    join(source, ".github/workflows/bootstrap-instance.yml"),
    join(target, ".github/workflows/bootstrap-instance.yml"),
  );
}

export async function materializeInstance(root, source, rawSpecification, expectedHash) {
  root = resolve(root);
  source = resolve(source);
  const specification = validateSpecification(rawSpecification);
  const specificationBytes = Buffer.from(JSON.stringify(specification));
  assert.equal(sha256(specificationBytes), expectedHash, "Specification hash mismatch");
  await mkdir(root, { recursive: true });
  assert.deepEqual(await readdir(root), [], "Instance target must be empty");
  await copyBlueprint(source, root);

  const packageName = specification.restaurant.slug + "-website";
  await writeFile(
    join(root, "package.json"),
    JSON.stringify(
      {
        name: packageName,
        version: "1.0.0",
        private: true,
        type: "module",
        engines: { node: ">=22.22.0" },
        scripts: {
          dev: "astro dev",
          check: "astro check",
          test: "node --test tests/*.test.mjs",
          build: "astro build",
          preview: "astro preview",
          verify: "node scripts/verify-instance.mjs",
          "check:build": "node scripts/check-build.mjs",
        },
        dependencies: {
          "@restaurant-platform/astro-template": "file:vendor/restaurant-template",
          "@sanity/client": "^7.11.0",
          astro: "^7.4.1",
          zod: "^4.6.7",
        },
        devDependencies: {
          "@astrojs/check": "^0.9.4",
          "@types/node": "^22.0.0",
          typescript: "^5.9.2",
        },
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    join(root, "template.instance.json"),
    JSON.stringify(
      {
        format: 1,
        template_key: specification.template.template_key,
        configuration_contract: specification.template.configuration_contract,
        content_contract: specification.template.content_contract,
        visual_contract: specification.template.visual_contract,
      },
      null,
      2,
    ) + "\n",
  );
  const lock = await syncDistribution(root, source, "HEAD", {
    snapshotCommit: specification.template.source_commit,
  });
  assert.equal(lock.version, specification.template.version);
  assert.equal(distributionHash(lock), specification.template.distribution_hash);

  const config = {
    contractVersion: 1,
    restaurantKey: specification.restaurant.slug,
    site: { url: specification.site.origin, base: specification.site.base },
    sanity: {
      projectId: specification.sanity.project_id,
      dataset: specification.sanity.dataset,
    },
    requiredSlugs: ["inicio", "carta", "restaurante", "reservas"],
    theme: specification.visual,
    assets: {
      favicon: "/favicon.svg",
      socialImage: {
        path: "/og-default.png",
        alt: `${specification.restaurant.name} · imagen para compartir`,
        type: "image/png",
        width: 1200,
        height: 630,
      },
      imageOrigins: [],
    },
    deployment: {
      provider: "github-pages",
      reportEndpoint: specification.deployment.publication_endpoint,
    },
  };
  await writeFile(
    join(root, "restaurant.config.ts"),
    `import type { RestaurantConfigInput } from "@restaurant-platform/astro-template/config";\n\nexport const restaurantConfig = ${JSON.stringify(config, null, 2)} satisfies RestaurantConfigInput;\n`,
  );
  await writeFile(
    join(root, "astro.config.mjs"),
    `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n  site: ${JSON.stringify(specification.site.origin)},\n  base: ${JSON.stringify(specification.site.base)},\n  output: "static",\n  trailingSlash: "always",\n  prefetch: { prefetchAll: false, defaultStrategy: "hover" },\n});\n`,
  );
  await writeFile(
    join(root, "tsconfig.json"),
    JSON.stringify({ extends: "astro/tsconfigs/strict" }, null, 2) + "\n",
  );
  await writeFile(
    join(root, "src/env.d.ts"),
    '/// <reference types="astro/client" />\n',
  );
  await writeFile(
    join(root, "instance.platform.json"),
    JSON.stringify(
      {
        format: 1,
        restaurant: { name: specification.restaurant.name, slug: specification.restaurant.slug },
        modules: specification.modules,
      },
      null,
      2,
    ) + "\n",
  );
  const manifest = canonical({
    format: 1,
    request_id: specification.request_id,
    specification_hash: expectedHash,
    configuration_hash: sha256(JSON.stringify(canonical(config))),
    repository: specification.site.repository,
    template: specification.template,
    sanity: specification.sanity,
    deployment: specification.deployment,
  });
  await writeFile(join(root, "instance.manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(
    join(root, "README.md"),
    `# ${specification.restaurant.name}\n\nInstancia Astro aprovisionada desde \`${specification.template.template_key}\` ${specification.template.version}. El contenido se lee de Sanity y el código compartido se actualiza mediante releases verificadas.\n\n\`npm ci && npm run verify && npm run check && npm test && npm run build && npm run check:build\`\n`,
  );
  await verifyDistribution(root);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [root, source, specificationPath, expectedHash] = process.argv.slice(2);
    assert.ok(root && source && specificationPath && expectedHash, "Usage: materialize-instance ROOT SOURCE SPEC HASH");
    const specification = JSON.parse(await readFile(resolve(specificationPath), "utf8"));
    const manifest = await materializeInstance(root, source, specification, expectedHash);
    console.log(`Instance ${manifest.request_id} materialized`);
  } catch {
    console.error("Instance materialization stopped by contract, integrity or filesystem validation.");
    process.exitCode = 1;
  }
}
