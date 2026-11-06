import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  cp,
  rename,
  rm,
  mkdtemp,
  lstat,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { distributionHash } from "../src/ops/template-evidence.mjs";
export { distributionHash };
const repository = "EduardoCR90/restaurant-astro-template";
const packageName = "@restaurant-platform/astro-template";
const digest = (value) => createHash("sha256").update(value).digest("hex");
async function verifySupport(root, release) {
  const support = JSON.parse(
    await readFile(join(root, "template.instance.json"), "utf8"),
  );
  assert.equal(support.format, 1);
  assert.equal(release.format, 1);
  for (const key of [
    "template_key",
    "configuration_contract",
    "content_contract",
    "visual_contract",
  ])
    assert.equal(
      release[key],
      support[key],
      `Instance does not support ${key}`,
    );
}
async function paths(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(join(directory, prefix), {
    withFileTypes: true,
  })) {
    if (entry.name === "node_modules") continue;
    const path = prefix ? prefix + "/" + entry.name : entry.name;
    assert.ok(!entry.isSymbolicLink(), "Distribution cannot contain symlinks");
    if (entry.isDirectory()) result.push(...(await paths(directory, path)));
    else result.push(path);
  }
  return result.sort();
}
export async function verifyDistribution(root) {
  const lock = JSON.parse(
    await readFile(join(root, "template.lock.json"), "utf8"),
  );
  assert.equal(lock.format, 1);
  assert.equal(lock.repository, repository);
  assert.match(lock.commit, /^[a-f0-9]{40}$/);
  assert.match(lock.version, /^\d+\.\d+\.\d+$/);
  const distribution = join(root, "vendor/restaurant-template");
  assert.ok(
    (await lstat(distribution)).isDirectory(),
    "Distribution must be a real directory",
  );
  assert.deepEqual(
    await paths(distribution),
    Object.keys(lock.files).sort(),
    "Unexpected or missing generated files",
  );
  for (const [path, hash] of Object.entries(lock.files))
    assert.equal(
      digest(await readFile(join(distribution, path))),
      hash,
      `Generated file changed: ${path}`,
    );
  const pkg = JSON.parse(
    await readFile(join(distribution, "package.json"), "utf8"),
  );
  assert.equal(pkg.name, packageName);
  assert.equal(pkg.version, lock.version);
  if (lock.files["template.release.json"]) {
    const release = JSON.parse(
      await readFile(join(distribution, "template.release.json"), "utf8"),
    );
    assert.equal(release.version, lock.version);
    assert.equal(release.format, 1);
    await verifySupport(root, release);
  }
  const app = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  assert.equal(
    app.dependencies[packageName],
    "file:vendor/restaurant-template",
  );
  return lock;
}
export async function syncDistribution(root, source, ref, options = {}) {
  if (options.snapshotCommit) {
    assert.equal(ref, "HEAD");
    assert.match(options.snapshotCommit, /^[a-f0-9]{40}$/);
  } else
    assert.match(
      ref,
      /^(?:v\d+\.\d+\.\d+|[a-f0-9]{40})$/,
      "Use a release tag or immutable commit",
    );
  const git = (...args) =>
    execFileSync("git", ["-C", source, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const treeCommit = git("rev-parse", "HEAD");
  let commit;
  if (options.snapshotCommit) commit = options.snapshotCommit;
  else {
    assert.equal(
      git("remote", "get-url", "origin"),
      `https://github.com/${repository}.git`,
      "Wrong upstream repository",
    );
    commit = git("rev-parse", "--verify", ref + "^{commit}");
    assert.equal(treeCommit, commit, "Check out the requested release first");
  }
  assert.equal(
    git(
      "status",
      "--porcelain",
      "--untracked-files=all",
      "--",
      "src",
      "package.json",
      "LICENSE",
      "README.md",
      "template.release.json",
    ),
    "",
    "Upstream source must be clean",
  );
  const pkg = JSON.parse(await readFile(join(source, "package.json"), "utf8"));
  assert.equal(pkg.name, packageName);
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  if (ref.startsWith("v")) assert.equal(ref, "v" + pkg.version);
  for (const hook of ["preinstall", "install", "postinstall", "prepare"])
    assert.ok(!pkg.scripts?.[hook], "No install lifecycle hooks allowed");
  const files = git(
    "ls-tree",
    "-r",
    "--name-only",
    treeCommit,
    "src",
    "package.json",
    "LICENSE",
    "README.md",
    "template.release.json",
  )
    .split("\n")
    .filter(Boolean)
    .sort();
  assert.ok(
    files.includes("src/lib/config.ts") &&
      files.includes("src/components/RestaurantPage.astro"),
    "Incomplete template",
  );
  if (files.includes("template.release.json")) {
    const release = JSON.parse(
      await readFile(join(source, "template.release.json"), "utf8"),
    );
    assert.equal(release.version, pkg.version);
    await verifySupport(root, release);
  }
  const destination = join(root, "vendor/restaurant-template");
  let existing;
  try {
    existing = await lstat(destination);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing) {
    assert.ok(existing.isDirectory(), "Distribution must be a real directory");
    // A missing manifest is an error for an existing distribution, not a first install.
    await verifyDistribution(root);
  }
  await mkdir(join(root, "vendor"), { recursive: true });
  const temporary = await mkdtemp(join(root, "vendor/.template-update-"));
  const hashes = {};
  try {
    for (const path of files) {
      assert.ok(!path.split("/").includes("..") && !path.startsWith("/"));
      assert.ok((await lstat(join(source, path))).isFile());
      await mkdir(join(temporary, path, ".."), { recursive: true });
      await cp(join(source, path), join(temporary, path));
      hashes[path] = digest(await readFile(join(temporary, path)));
    }
    const backup = destination + ".previous";
    let previous = false;
    try {
      await rename(destination, backup);
      previous = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    try {
      await rename(temporary, destination);
    } catch (error) {
      if (previous) await rename(backup, destination);
      throw error;
    }
    await writeFile(
      join(root, "template.lock.json"),
      JSON.stringify(
        { format: 1, repository, version: pkg.version, commit, files: hashes },
        null,
        2,
      ) + "\n",
    );
    if (previous) await rm(backup, { recursive: true });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  return verifyDistribution(root);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [action, source, ref] = process.argv.slice(2);
    const result =
      action === "verify"
        ? await verifyDistribution(process.cwd())
        : action === "sync" && source && ref
          ? await syncDistribution(process.cwd(), resolve(source), ref)
          : assert.fail(
              "Usage: template-distribution.mjs verify | sync SOURCE TAG_OR_SHA",
            );
    console.log(
      `Template ${result.version} · ${result.commit} · ${Object.keys(result.files).length} verified files`,
    );
  } catch {
    console.error(
      "Template distribution validation failed. No automatic overwrite of edited generated files. Review source, release and integrity.",
    );
    process.exitCode = 1;
  }
}
