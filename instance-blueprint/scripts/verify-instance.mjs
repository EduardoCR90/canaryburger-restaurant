import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, lstat } from "node:fs/promises";
import { join } from "node:path";

const digest = (value) => createHash("sha256").update(value).digest("hex");

async function paths(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), "Template distribution cannot contain symlinks");
    if (entry.isDirectory()) result.push(...(await paths(directory, path)));
    else result.push(path);
  }
  return result.sort();
}

const lock = JSON.parse(await readFile("template.lock.json", "utf8"));
const manifest = JSON.parse(await readFile("instance.manifest.json", "utf8"));
assert.equal(lock.format, 1);
assert.equal(manifest.format, 1);
assert.equal(manifest.template.version, lock.version);
assert.equal(manifest.template.source_commit, lock.commit);
assert.ok((await lstat("vendor/restaurant-template")).isDirectory());
assert.deepEqual(await paths("vendor/restaurant-template"), Object.keys(lock.files).sort());
for (const [file, hash] of Object.entries(lock.files))
  assert.equal(digest(await readFile(join("vendor/restaurant-template", file))), hash, file);
console.log(`Instance ${manifest.request_id} · template ${lock.version} verified`);
