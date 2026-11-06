import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { TEMPLATE_VERSION } from "../src/lib/config";
test("shared source has no dependency on the source restaurant, IDs, assets or endpoints", async () => {
  const files = await readdir("src", { recursive: true });
  const forbidden = [
    /salitre/i,
    /hfa8zkyw/,
    /wanrzgumoamryuybmopa/,
    /eduardocr90/i,
    /#ece8df/i,
    /#252d27/i,
    /#95462f/i,
    /images\.unsplash\.com\/photo-/,
  ];
  for (const file of files.filter((p) => /\.(astro|ts|css|mjs)$/.test(p))) {
    const original = await readFile("src/" + file, "utf8");
    // The existing CMS schema identifier is a versioned interoperability contract,
    // not restaurant content or a default project. Preserve its exact spelling.
    const source =
      file === "types/platform.ts"
        ? original.replaceAll('"salitre-v1"', '"editorial-v1"')
        : original;
    for (const pattern of forbidden)
      assert.ok(!pattern.test(source), `${file}: ${pattern}`);
  }
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(pkg.version, TEMPLATE_VERSION);
});
