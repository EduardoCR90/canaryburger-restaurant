import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  cp,
  symlink,
  readFile,
  writeFile,
  rm,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
test(
  "independent build renders generic components, composition and a different identity",
  { timeout: 60000 },
  async () => {
    const root = resolve("."),
      dir = await mkdtemp(join(root, ".test-work-"));
    try {
      for (const path of [
        "src",
        "example",
        "astro.config.mjs",
        "package.json",
        "tsconfig.json",
      ])
        await cp(join(root, path), join(dir, path), { recursive: true });
      await symlink(
        join(root, "node_modules"),
        join(dir, "node_modules"),
        "dir",
      );
      const image = {
        url: "https://images.example.test/fixture.jpg",
        alt: "Imagen sintética",
      };
      const blocks = [
        { _type: "hero", title: "Hero genérico", image },
        {
          _type: "richText",
          body: [
            {
              _type: "block",
              style: "normal",
              children: [
                {
                  _type: "span",
                  text: "Texto compartido seguro <script>",
                  marks: [],
                },
              ],
              markDefs: [],
            },
          ],
        },
        {
          _type: "imageText",
          title: "Imagen y texto",
          image,
          body: "Información de ejemplo",
        },
        { _type: "galleryBlock", images: [image] },
        { _type: "menuSection" },
        { _type: "cards", items: [{ title: "Información adicional", image }] },
        {
          _type: "cta",
          title: "Llamada a la acción",
          cta: { label: "Contacto", href: "/reservas/" },
        },
        {
          _type: "faq",
          items: [
            {
              question: "¿Cómo funciona?",
              answer: "Contenido de demostración.",
            },
          ],
        },
        { _type: "divider" },
        { _type: "notice", text: "Aviso público" },
      ];
      const demo = await readFile(join(dir, "example/demo.ts"), "utf8");
      await writeFile(
        join(dir, "example/demo.ts"),
        demo.replace(
          /export const demoContent\s*=\s*contentSchema\.parse/,
          "const initialContent=contentSchema.parse",
        ) +
          `\nexport const demoContent={...initialContent,settings:{...initialContent.settings,name:'Segunda identidad'},pages:initialContent.pages.map((p,i)=>i?p:{...p,blocks:${JSON.stringify(blocks)}})};`,
      );
      const config = await readFile(
        join(dir, "example/restaurant.config.ts"),
        "utf8",
      );
      await writeFile(
        join(dir, "example/restaurant.config.ts"),
        config
          .replace(/font:\s*['"]editorial['"]/, "font:'sans'")
          .replace(
            /accent:\s*['"]#555555['"]/,
            "accent:'#113355',font:'sans',button:'outline'",
          ),
      );
      await run(
        process.execPath,
        [
          join(root, "node_modules/astro/bin/astro.mjs"),
          "build",
          "--root",
          dir,
        ],
        {
          cwd: dir,
          env: {
            ...process.env,
            ASTRO_TELEMETRY_DISABLED: "1",
            SANITY_USE_MOCK: "true",
            SITE_URL: "https://independent.example",
            SITE_BASE: "/independent",
          },
          maxBuffer: 2000000,
        },
      );
      const html = await readFile(join(dir, "dist/index.html"), "utf8");
      for (const label of [
        "Segunda identidad",
        "Hero genérico",
        "Imagen y texto",
        "Información adicional",
        "Llamada a la acción",
        "Aviso público",
        "¿Cómo funciona?",
        "Plato de ejemplo",
      ])
        assert.ok(html.includes(label), label);
      assert.ok(html.includes("&lt;script&gt;"));
      assert.ok(html.includes("<details"));
      assert.ok(html.includes('alt="Imagen sintética"'));
      assert.ok(html.includes("https://independent.example/independent/"));
      assert.ok(html.includes("/independent/favicon.svg"));
      assert.ok(html.includes("--rust:#113355"));
      assert.ok(html.includes('data-button="outline"'));
      assert.ok(!html.toLowerCase().includes("salitre"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);
