import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  verifyDistribution,
  syncDistribution,
  distributionHash,
} from "./template-distribution.mjs";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const checks = ["template:verify", "check", "test", "build", "check:build"];
const semver = (value) => {
  assert.match(value, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  return value.split(".").map(Number);
};
export function assertCompatible(installed, release, support) {
  assert.equal(release.format, 1);
  assert.equal(release.updater_contract, 1);
  assert.equal(release.template_key, support.template_key);
  for (const key of [
    "configuration_contract",
    "content_contract",
    "visual_contract",
  ])
    assert.equal(release[key], support[key], `Incompatible ${key}`);
  const old = semver(installed.version),
    next = semver(release.version),
    minimum = semver(release.minimum_installed_version);
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  assert.ok(
    compare(old, minimum) >= 0,
    "Installed version requires an intermediate migration",
  );
  assert.ok(
    compare(next, old) >= 0,
    "Automatic downgrades are not allowed; review a rollback PR",
  );
  assert.equal(next[0], old[0], "Major updates require a reviewed migration");
}
export async function updateInstance(root, source, ref, options = {}) {
  root = resolve(root);
  source = resolve(source);
  const git = (cwd, ...args) =>
    execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const clean = () => {
    assert.equal(
      git(root, "status", "--porcelain", "--untracked-files=all"),
      "",
      "Instance must be clean",
    );
  };
  clean();
  const initialHead = git(root, "rev-parse", "HEAD");
  const installed = await verifyDistribution(root);
  const support = JSON.parse(
    await readFile(join(root, "template.instance.json"), "utf8"),
  );
  assert.equal(support.format, 1);
  const release = JSON.parse(
    await readFile(join(source, "template.release.json"), "utf8"),
  );
  assertCompatible(installed, release, support);
  const temporary = await mkdtemp(
    join(tmpdir(), "restaurant-template-update-"),
  );
  const candidate = join(temporary, "candidate");
  // The fixed runner is injectable only for isolated tests, never via environment/HTTP.
  const run =
    options.run ||
    ((command, args, cwd) =>
      execFileSync(command, args, {
        cwd,
        stdio: "inherit",
        timeout: 120000,
        env: {
          ...process.env,
          ASTRO_TELEMETRY_DISABLED: "1",
          SANITY_USE_MOCK: "true",
          SANITY_ALLOW_DEMO_FALLBACK: "false",
          SANITY_API_READ_TOKEN: "",
        },
      }));
  let worktree = false;
  try {
    git(root, "worktree", "add", "--detach", candidate, initialHead);
    worktree = true;
    const next = await syncDistribution(candidate, source, ref);
    assert.equal(next.version, release.version);
    run(
      "npm",
      [
        "install",
        "--package-lock-only",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
      ],
      candidate,
    );
    run(
      "npm",
      ["ci", "--ignore-scripts", "--no-audit", "--no-fund"],
      candidate,
    );
    for (const check of checks) run("npm", ["run", check], candidate);
    await verifyDistribution(candidate);
    const changed = git(candidate, "diff", "--name-only")
      .split("\n")
      .filter(Boolean);
    assert.ok(
      changed.every(
        (path) =>
          path.startsWith("vendor/restaurant-template/") ||
          ["template.lock.json", "package-lock.json"].includes(path),
      ),
      "Validation changed instance-owned files",
    );
    // Include newly distributed tracked files without admitting unrelated generated files.
    git(
      candidate,
      "add",
      "--",
      "vendor/restaurant-template",
      "template.lock.json",
      "package-lock.json",
    );
    const patch = execFileSync(
      "git",
      ["-C", candidate, "diff", "--cached", "--binary"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 20 * 1024 * 1024,
      },
    );
    clean();
    assert.equal(
      git(root, "rev-parse", "HEAD"),
      initialHead,
      "Instance changed during validation",
    );
    if (patch) {
      const patchPath = join(temporary, "validated.patch");
      await writeFile(patchPath, patch, { mode: 0o600 });
      git(root, "apply", "--check", patchPath);
      git(root, "apply", patchPath);
    }
    const receipt = {
      format: 1,
      template_key: release.template_key,
      from_version: installed.version,
      from_commit: installed.commit,
      to_version: next.version,
      to_commit: next.commit,
      source_instance_commit: initialHead,
      distribution_hash: distributionHash(next),
      package_lock_hash: hash(await readFile(join(root, "package-lock.json"))),
      checks,
      status: "validated-not-deployed",
    };
    await writeFile(
      join(root, "template.update.json"),
      JSON.stringify(receipt, null, 2) + "\n",
    );
    return receipt;
  } finally {
    if (worktree) git(root, "worktree", "remove", "--force", candidate);
    await rm(temporary, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [source, ref] = process.argv.slice(2);
    assert.ok(
      source && ref,
      "Usage: node update-instance.mjs SOURCE TAG_OR_SHA",
    );
    console.log(
      JSON.stringify(await updateInstance(process.cwd(), source, ref)),
    );
  } catch {
    console.error(
      "Update stopped: integrity, compatibility, clean checkout or build validation failed. No deployment was attempted.",
    );
    process.exitCode = 1;
  }
}
