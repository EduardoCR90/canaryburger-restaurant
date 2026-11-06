import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";

const index = await readFile("dist/index.html", "utf8");
assert.ok(index.includes("<title>"));
assert.ok(index.includes("<h1"));
assert.ok((await stat("dist/carta/index.html")).isFile());
assert.ok((await stat("dist/restaurante/index.html")).isFile());
assert.ok((await stat("dist/reservas/index.html")).isFile());
