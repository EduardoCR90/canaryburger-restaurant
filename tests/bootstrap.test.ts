import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("GitHub template preinstalls byte-identical final workflows", async () => {
  for (const workflow of ["deploy.yml", "validate.yml"])
    assert.equal(
      await readFile(`.github/workflows/${workflow}`, "utf8"),
      await readFile(
        `instance-blueprint/.github/workflows/${workflow}`,
        "utf8",
      ),
    );
  const bootstrap = await readFile(
    ".github/workflows/bootstrap-instance.yml",
    "utf8",
  );
  assert.match(bootstrap, /fetch-depth: 0/);
  assert.match(bootstrap, /git log --diff-filter=A/);
  assert.match(bootstrap, /steps\.materialize\.outputs\.source_commit/);
  assert.doesNotMatch(
    bootstrap,
    /INSTANCE_SOURCE_COMMIT: \$\{\{ github\.sha \}\}/,
  );
});

test("instance reporters execute and only expose closed callback diagnostics", async () => {
  const content = await readFile(
    "instance-blueprint/src/lib/content.ts",
    "utf8",
  );
  assert.match(content, /onSnapshot: recordDeploymentEvidence/);

  const deployment = await readFile(
    "instance-blueprint/scripts/report-deployment.mjs",
    "utf8",
  );
  assert.match(deployment, /const \{ runReportCli \}/);
  assert.match(deployment, /await runReportCli\(\)/);

  const provisioning = await readFile(
    "instance-blueprint/scripts/report-provisioning.mjs",
    "utf8",
  );
  assert.match(provisioning, /Callback Astro rechazado/);
  assert.match(provisioning, /diagnóstico no disponible/);
  assert.doesNotMatch(provisioning, /response\.text\(/);
});
