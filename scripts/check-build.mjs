import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
const base = (process.env.SITE_BASE || "/").replace(/\/$/, "") + "/";
for (const route of ["", "reservas/"]) {
  const html = await readFile(`dist/${route}index.html`, "utf8");
  assert.ok(html.includes("<h1"));
  assert.ok(
    html.includes("ClientRouter") ||
      html.includes("astro-view-transitions-enabled"),
  );
  assert.ok(html.includes("Restaurante de ejemplo"));
  assert.ok(
    html.includes(
      `https://${new URL(process.env.SITE_URL || "https://restaurant.example").host}${base}${route}`,
    ),
  );
  assert.ok(
    !html.includes("hfa8zkyw") && !html.toLowerCase().includes("salitre"),
  );
}
await access("dist/favicon.svg");
await access("dist/og-default.png");
console.log("Independent static example and base-path assets verified.");
