import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the generated instance pins its template and public configuration", async () => {
  const manifest = JSON.parse(await readFile("instance.manifest.json", "utf8"));
  const lock = JSON.parse(await readFile("template.lock.json", "utf8"));
  assert.equal(manifest.format, 1);
  assert.equal(manifest.template.version, lock.version);
  assert.equal(manifest.template.source_commit, lock.commit);
  assert.match(manifest.configuration_hash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(manifest).toLowerCase().includes("token"));
});
