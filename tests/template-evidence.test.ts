import { test } from "node:test";
import assert from "node:assert/strict";
import {
  templateIdentity,
  sha256,
  distributionHash,
} from "../src/ops/template-evidence.mjs";
const metadata = JSON.stringify({
  format: 1,
  template_key: "restaurant-editorial",
  version: "0.3.0",
  configuration_contract: 1,
  content_contract: "salitre-v1",
  visual_contract: 2,
});
const lock = {
  format: 1,
  repository: "EduardoCR90/restaurant-astro-template",
  version: "0.3.0",
  commit: "a".repeat(40),
  files: {
    "template.release.json": sha256(metadata),
    "src/example.ts": sha256("synthetic"),
  },
};
const files: Record<string, string> = {
  "template.lock.json": JSON.stringify(lock),
  "vendor/restaurant-template/template.release.json": metadata,
  "vendor/restaurant-template/src/example.ts": "synthetic",
};
test("deployment template identity comes from every verified distributed file", async () => {
  const identity = await templateIdentity(async (path: string) => files[path]);
  assert.equal(identity.distribution_hash, distributionHash(lock));
  assert.equal(identity.source_commit, lock.commit);
  assert.equal(identity.version, "0.3.0");
  await assert.rejects(
    templateIdentity(async (path: string) =>
      path.endsWith("example.ts") ? "tampered" : files[path],
    ),
    /integrity/,
  );
  assert.equal(
    distributionHash({
      ...lock,
      files: Object.fromEntries(Object.entries(lock.files).reverse()),
    }),
    distributionHash(lock),
  );
});

test("template reports bind installed identity to the same build evidence", async () => {
  const { reportDeployment } = await import("../src/ops/report-deployment.mjs");
  const template = await templateIdentity(async (path: string) => files[path]);
  const env = {
    DEPLOYMENT_REPORT_URL: "https://platform.example/report",
    TEMPLATE_VERSION_TRACKING: "true",
    GITHUB_RUN_ID: "100",
    GITHUB_RUN_ATTEMPT: "1",
    GITHUB_SHA: "c".repeat(40),
    ACTIONS_ID_TOKEN_REQUEST_URL:
      "https://oidc.actions.githubusercontent.com/token",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "synthetic",
  };
  const evidence = {
    runId: "100",
    attempt: "1",
    sha: env.GITHUB_SHA,
    fingerprints: ["d".repeat(64)],
    template,
  };
  const read = async (path: string) =>
    path === ".publication-build.json" ? JSON.stringify(evidence) : files[path];
  const sent: Record<string, unknown>[] = [];
  const fetcher = async (_url: unknown, options?: RequestInit) => {
    if (options?.body) sent.push(JSON.parse(String(options.body)));
    return new Response(
      JSON.stringify(
        options?.body ? { recorded: true } : { value: "synthetic-identity" },
      ),
    );
  };
  await reportDeployment("ready", env, fetcher, read);
  assert.deepEqual(sent[0].template, template);
  await assert.rejects(
    reportDeployment("succeeded", env, fetcher, async (path: string) =>
      path === ".publication-build.json"
        ? JSON.stringify({
            ...evidence,
            template: { ...template, version: "9.0.0" },
          })
        : files[path],
    ),
    /build no válida/,
  );
  assert.equal(sent.length, 1);
});

test("an empty new dataset can confirm only a versioned bootstrap build", async () => {
  const { reportDeployment } = await import("../src/ops/report-deployment.mjs");
  const template = await templateIdentity(async (path: string) => files[path]);
  const base = {
    DEPLOYMENT_REPORT_URL: "https://platform.example/report",
    TEMPLATE_VERSION_TRACKING: "true",
    GITHUB_RUN_ID: "101",
    GITHUB_RUN_ATTEMPT: "1",
    GITHUB_SHA: "e".repeat(40),
    ACTIONS_ID_TOKEN_REQUEST_URL:
      "https://oidc.actions.githubusercontent.com/token",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "synthetic",
  };
  const evidence = JSON.stringify({
    runId: "101",
    attempt: "1",
    sha: base.GITHUB_SHA,
    fingerprints: [],
    template,
  });
  const read = async (path: string) =>
    path === ".publication-build.json" ? evidence : files[path];
  const fetcher = async (_url: unknown, options?: RequestInit) =>
    new Response(
      JSON.stringify(options?.body ? { recorded: true } : { value: "identity" }),
    );
  await assert.rejects(reportDeployment("ready", base, fetcher, read), /evidencia/);
  await reportDeployment(
    "ready",
    { ...base, ALLOW_EMPTY_PUBLICATION_EVIDENCE: "true" },
    fetcher,
    read,
  );
  await assert.rejects(
    reportDeployment(
      "ready",
      {
        ...base,
        TEMPLATE_VERSION_TRACKING: "false",
        ALLOW_EMPTY_PUBLICATION_EVIDENCE: "true",
      },
      fetcher,
      read,
    ),
    /evidencia/,
  );
});
