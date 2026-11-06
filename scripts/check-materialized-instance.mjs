import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { materializeInstance } from "../tools/materialize-instance.mjs";
import {
  distributionHash,
  syncDistribution,
} from "../tools/template-distribution.mjs";

const source = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), "restaurant-instance-check-"));
const probe = join(temporary, "probe");
const instance = join(temporary, "instance");
try {
  await import("node:fs/promises").then(({ mkdir, writeFile }) =>
    mkdir(probe, { recursive: true }).then(async () => {
      await writeFile(
        join(probe, "package.json"),
        JSON.stringify({
          dependencies: {
            "@restaurant-platform/astro-template":
              "file:vendor/restaurant-template",
          },
        }),
      );
      await writeFile(
        join(probe, "template.instance.json"),
        JSON.stringify({
          format: 1,
          template_key: "restaurant-editorial",
          configuration_contract: 1,
          content_contract: "salitre-v1",
          visual_contract: 2,
        }),
      );
    }),
  );
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const lock = await syncDistribution(probe, source, "HEAD", {
    snapshotCommit: commit,
  });
  const specification = {
    contract_version: 1,
    request_id: "11111111-1111-4111-8111-111111111111",
    restaurant: { name: "Restaurante sintético", slug: "restaurant-synthetic" },
    template: {
      template_key: "restaurant-editorial",
      version: lock.version,
      source_commit: lock.commit,
      distribution_hash: distributionHash(lock),
      configuration_contract: 1,
      content_contract: "salitre-v1",
      visual_contract: 2,
    },
    site: {
      repository: "example-owner/restaurant-synthetic",
      origin: "https://example-owner.github.io/",
      base: "/restaurant-synthetic",
    },
    sanity: { project_id: "synthetic1", dataset: "production" },
    visual: { preset: "elegant" },
    modules: [{ key: "content_management", granted: true, enabled: true }],
    deployment: {
      publication_endpoint:
        "https://example.supabase.co/functions/v1/publications",
      provisioning_endpoint:
        "https://example.supabase.co/functions/v1/astro-provisioning",
    },
  };
  const bytes = Buffer.from(JSON.stringify(specification));
  await materializeInstance(
    instance,
    source,
    specification,
    createHash("sha256").update(bytes).digest("hex"),
  );
  execFileSync(
    "npm",
    [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    { cwd: instance, stdio: "inherit" },
  );
  execFileSync("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: instance,
    stdio: "inherit",
  });
  for (const script of ["verify", "check", "test", "build", "check:build"])
    execFileSync("npm", ["run", script], {
      cwd: instance,
      stdio: "inherit",
      env: {
        ...process.env,
        SANITY_USE_MOCK: "true",
        SANITY_ALLOW_DEMO_FALLBACK: "true",
        ASTRO_TELEMETRY_DISABLED: "1",
      },
    });
  const manifest = JSON.parse(
    await readFile(join(instance, "instance.manifest.json"), "utf8"),
  );
  if (
    manifest.template.distribution_hash !==
    specification.template.distribution_hash
  )
    throw new Error("Distribution identity changed");
  for (const workflow of [
    "bootstrap-instance.yml",
    "deploy.yml",
    "validate.yml",
  ])
    assert.equal(
      await readFile(join(instance, ".github/workflows", workflow), "utf8"),
      await readFile(join(source, ".github/workflows", workflow), "utf8"),
      `Generated workflow ${workflow} must already exist unchanged in the GitHub template`,
    );
  assert.match(
    await readFile(join(instance, "scripts/report-deployment.mjs"), "utf8"),
    /await runReportCli\(\)/,
  );
  assert.match(
    await readFile(join(instance, "src/lib/content.ts"), "utf8"),
    /onSnapshot: recordDeploymentEvidence/,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
