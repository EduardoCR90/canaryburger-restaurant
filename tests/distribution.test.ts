import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  syncDistribution,
  verifyDistribution,
} from "../tools/template-distribution.mjs";
test("versioned distribution verifies immutable source and refuses edited generated files", async () => {
  const root = await mkdtemp(join(resolve("."), ".test-work-"));
  try {
    const source = join(root, "upstream"),
      instance = join(root, "instance");
    await mkdir(join(source, "src/lib"), { recursive: true });
    await mkdir(join(source, "src/components"));
    await mkdir(instance);
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", source, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    git("init", "-b", "main");
    git("config", "user.name", "Synthetic test");
    git("config", "user.email", "test@example.test");
    git(
      "remote",
      "add",
      "origin",
      "https://github.com/EduardoCR90/restaurant-astro-template.git",
    );
    await writeFile(
      join(source, "package.json"),
      JSON.stringify({
        name: "@restaurant-platform/astro-template",
        version: "0.1.0",
        private: true,
      }),
    );
    await writeFile(
      join(source, "src/lib/config.ts"),
      "export const version=1;",
    );
    await writeFile(
      join(source, "src/components/RestaurantPage.astro"),
      "<main><slot/></main>",
    );
    await writeFile(join(source, "README.md"), "Synthetic upstream");
    await writeFile(join(source, "LICENSE"), "Test fixture");
    git("add", ".");
    git("commit", "-m", "Synthetic release");
    git("tag", "v0.1.0");
    await writeFile(
      join(instance, "package.json"),
      JSON.stringify({
        dependencies: {
          "@restaurant-platform/astro-template":
            "file:vendor/restaurant-template",
        },
      }),
    );
    const lock = await syncDistribution(instance, source, "v0.1.0");
    assert.equal(lock.commit, git("rev-parse", "HEAD"));
    assert.equal(lock.version, "0.1.0");
    await verifyDistribution(instance);
    const changed = join(
      instance,
      "vendor/restaurant-template/src/lib/config.ts",
    );
    await writeFile(changed, "local changes");
    await assert.rejects(
      verifyDistribution(instance),
      /Generated file changed/,
    );
    await assert.rejects(syncDistribution(instance, source, "v0.1.0"));
    assert.equal(await readFile(changed, "utf8"), "local changes");
    await rm(join(instance, "template.lock.json"));
    await assert.rejects(syncDistribution(instance, source, "v0.1.0"));
    assert.equal(await readFile(changed, "utf8"), "local changes");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
