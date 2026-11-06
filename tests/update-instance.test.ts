import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { updateInstance } from "../tools/update-instance.mjs";
import {
  syncDistribution,
  verifyDistribution,
} from "../tools/template-distribution.mjs";
const support = {
  format: 1,
  template_key: "restaurant-editorial",
  configuration_contract: 1,
  content_contract: "salitre-v1",
  visual_contract: 2,
};
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "instance-update-test-")),
    source = join(root, "source"),
    instance = join(root, "instance");
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  for (const folder of [source, instance]) {
    await mkdir(folder);
    git(folder, "init", "-b", "main");
    git(folder, "config", "user.email", "test@example.test");
    git(folder, "config", "user.name", "Synthetic");
  }
  git(
    source,
    "remote",
    "add",
    "origin",
    "https://github.com/EduardoCR90/restaurant-astro-template.git",
  );
  await mkdir(join(source, "src/lib"), { recursive: true });
  await mkdir(join(source, "src/components"), { recursive: true });
  await writeFile(join(source, "src/lib/config.ts"), "export const version=1;");
  await writeFile(
    join(source, "src/components/RestaurantPage.astro"),
    "<main/>",
  );
  await writeFile(join(source, "README.md"), "Synthetic template");
  await writeFile(join(source, "LICENSE"), "Synthetic");
  const pkg = {
    name: "@restaurant-platform/astro-template",
    version: "0.2.0",
    private: true,
  };
  await writeFile(join(source, "package.json"), JSON.stringify(pkg));
  git(source, "add", ".");
  git(source, "commit", "-m", "Old release");
  git(source, "tag", "v0.2.0");
  await writeFile(
    join(instance, "package.json"),
    JSON.stringify({
      dependencies: { [pkg.name]: "file:vendor/restaurant-template" },
    }),
  );
  await writeFile(join(instance, "package-lock.json"), "{}");
  await writeFile(
    join(instance, "template.instance.json"),
    JSON.stringify(support),
  );
  await writeFile(
    join(instance, "restaurant.config.ts"),
    'export const restaurantKey="synthetic";',
  );
  await writeFile(join(instance, ".gitignore"), "node_modules/\ndist/\n");
  await syncDistribution(instance, source, "v0.2.0");
  git(instance, "add", ".");
  git(instance, "commit", "-m", "Pinned instance");
  await writeFile(
    join(source, "package.json"),
    JSON.stringify({ ...pkg, version: "0.3.0" }),
  );
  await writeFile(
    join(source, "template.release.json"),
    JSON.stringify({
      ...support,
      version: "0.3.0",
      updater_contract: 1,
      minimum_installed_version: "0.2.0",
    }),
  );
  git(source, "add", ".");
  git(source, "commit", "-m", "New release");
  git(source, "tag", "v0.3.0");
  return { root, source, instance, git };
}
test("isolated update runs fixed validation commands before changing the original instance", async () => {
  const f = await fixture();
  try {
    const commands: string[] = [];
    const receipt = await updateInstance(f.instance, f.source, "v0.3.0", {
      run: (command: string, args: string[], cwd: string) => {
        assert.notEqual(cwd, f.instance);
        assert.equal(command, "npm");
        commands.push(args.join(" "));
      },
    });
    assert.equal(receipt.status, "validated-not-deployed");
    assert.equal(receipt.to_version, "0.3.0");
    assert.deepEqual(commands.slice(2), [
      "run template:verify",
      "run check",
      "run test",
      "run build",
      "run check:build",
    ]);
    assert.equal((await verifyDistribution(f.instance)).version, "0.3.0");
    assert.equal(
      await readFile(join(f.instance, "restaurant.config.ts"), "utf8"),
      'export const restaurantKey="synthetic";',
    );
    assert.ok(
      !commands.some((value) => /deploy|publish|migration/.test(value)),
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
test("failed build validation and dirty/edited checkouts leave the instance untouched", async () => {
  const f = await fixture();
  try {
    const before = await readFile(
      join(f.instance, "template.lock.json"),
      "utf8",
    );
    await assert.rejects(
      updateInstance(f.instance, f.source, "v0.3.0", {
        run: (_command: string, args: string[]) => {
          if (args.join(" ") === "run build")
            throw new Error("Synthetic build failure");
        },
      }),
      /build failure/,
    );
    assert.equal(
      await readFile(join(f.instance, "template.lock.json"), "utf8"),
      before,
    );
    assert.equal(f.git(f.instance, "status", "--porcelain"), "");
    await writeFile(join(f.instance, "restaurant.config.ts"), "local edits");
    await assert.rejects(
      updateInstance(f.instance, f.source, "v0.3.0"),
      /clean/,
    );
    assert.equal(
      await readFile(join(f.instance, "restaurant.config.ts"), "utf8"),
      "local edits",
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
