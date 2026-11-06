import assert from "node:assert/strict";
import {
  mkdtemp,
  cp,
  symlink,
  readFile,
  writeFile,
  rm,
  mkdir,
} from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, join, extname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const root = resolve(".");
const temporary = await mkdtemp(join(root, ".test-work-presets-"));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
await mkdir("review", { recursive: true });
const expected = {
  elegant: { hero: "block", gallery: "grid", cta: "block" },
  modern: { hero: "grid", gallery: "grid", cta: "grid" },
  casual: { hero: "grid", gallery: "flex", cta: "flex" },
};
try {
  for (const preset of Object.keys(expected)) {
    const directory = join(temporary, preset);
    await mkdir(directory);
    for (const path of [
      "src",
      "example",
      "astro.config.mjs",
      "package.json",
      "tsconfig.json",
    ])
      await cp(join(root, path), join(directory, path), { recursive: true });
    await symlink(
      join(root, "node_modules"),
      join(directory, "node_modules"),
      "dir",
    );
    await writeFile(
      join(directory, "example/restaurant.config.ts"),
      `export const restaurantConfig={contractVersion:1,restaurantKey:'${preset}',site:{url:'https://${preset}.example',base:'/preview'},sanity:{},theme:{preset:'${preset}'}};`,
    );
    const image = {
      url: "https://images.example.test/fixture.jpg",
      alt: "Imagen de prueba",
    };
    const blocks = [
      { _type: "hero", title: "Una mesa con carácter", image },
      { _type: "menuSection" },
      { _type: "galleryBlock", images: [image, image, image] },
      {
        _type: "cta",
        title: "Nos vemos pronto",
        cta: { label: "Contacto", href: "/reservas/" },
      },
      { _type: "notice", text: "HIDDEN_CONTENT", enabled: false },
    ];
    const original = await readFile(join(directory, "example/demo.ts"), "utf8");
    await writeFile(
      join(directory, "example/demo.ts"),
      original.replace(
        /export const demoContent\s*=\s*contentSchema\.parse/,
        "const original=contentSchema.parse",
      ) +
        `\nexport const demoContent={...original,pages:original.pages.map((p,i)=>i?p:{...p,blocks:${JSON.stringify(blocks)}})};`,
    );
    await run(
      process.execPath,
      [
        join(root, "node_modules/astro/bin/astro.mjs"),
        "build",
        "--root",
        directory,
      ],
      {
        cwd: directory,
        env: {
          ...process.env,
          ASTRO_TELEMETRY_DISABLED: "1",
          SANITY_USE_MOCK: "true",
          SITE_URL: `https://${preset}.example`,
          SITE_BASE: "/preview",
        },
        maxBuffer: 2000000,
      },
    );
    const server = createServer(async (req, res) => {
      try {
        const pathname = new URL(req.url, "http://local").pathname;
        const relative = pathname.replace(/^\/preview\/?/, "");
        const path = resolve(
          directory,
          "dist",
          relative,
          relative.endsWith("/") || !relative ? "index.html" : "",
        );
        assert.ok(path.startsWith(join(directory, "dist") + "/"));
        const body = await readFile(path);
        res.writeHead(200, {
          "Content-Type":
            {
              ".html": "text/html",
              ".js": "text/javascript",
              ".css": "text/css",
              ".svg": "image/svg+xml",
              ".png": "image/png",
            }[extname(path)] || "application/octet-stream",
        });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    try {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        });
        await context.route("https://**/*", (route) =>
          route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100"><rect width="1600" height="1100" fill="#ddd"/></svg>',
          }),
        );
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/preview/`, {
          waitUntil: "load",
        });
        assert.equal(
          await page.locator("html").getAttribute("data-preset"),
          preset,
        );
        assert.equal(await page.getByText("HIDDEN_CONTENT").count(), 0);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${preset} ${width}: overflow`,
        );
        if (width === 1440) {
          const styles = await page.evaluate(() =>
            Object.fromEntries(
              [
                ["hero", ".block-hero"],
                ["gallery", ".gallery-composition"],
                ["cta", ".reservation-band"],
              ].map(([key, selector]) => [
                key,
                getComputedStyle(document.querySelector(selector)).display,
              ]),
            ),
          );
          assert.deepEqual(styles, expected[preset]);
        }
        await page.screenshot({
          path: `review/${preset}-${width}.png`,
          fullPage: true,
        });
        assert.deepEqual(errors, []);
        await context.close();
      }
    } finally {
      await new Promise((r) => server.close(r));
    }
  }
  console.log(
    "Three different preset layouts verified in mobile/desktop builds; no JS errors, hidden content or page overflow.",
  );
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
