import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveConfiguration,
  type RestaurantConfigInput,
} from "../src/lib/config";
import { createContentLoader } from "../src/lib/content";
import { demoContent } from "../example/demo";
const config: RestaurantConfigInput = {
  contractVersion: 1,
  restaurantKey: "sample",
  site: { url: "https://sample.example", base: "/sample" },
  sanity: { projectId: "project123", dataset: "production" },
};
test("configuration is explicit, typed, immutable and contains no build token", () => {
  const original = JSON.stringify(config);
  const result = resolveConfiguration(config, {
    SITE_URL: "https://second.example",
    SITE_BASE: "/",
    SANITY_PROJECT_ID: "another",
    SANITY_DATASET: "staging",
    SANITY_API_READ_TOKEN: "private-fixture",
  });
  assert.equal(result.sanity.projectId, "another");
  assert.equal(result.site.base, "/");
  assert.equal(JSON.stringify(config), original);
  assert.ok(!JSON.stringify(result).includes("private-fixture"));
  for (const url of [
    "http://example.test",
    "https://user:password@example.test",
    "https://example.test/path",
  ])
    assert.throws(() => resolveConfiguration({ ...config, site: { url } }));
  for (const base of ["//host", "/../secret", "/x?y=1"])
    assert.throws(() =>
      resolveConfiguration({ ...config, site: { url: config.site.url, base } }),
    );
  assert.throws(() =>
    resolveConfiguration({ ...config, theme: { paper: "red;display:none" } }),
  );
});
test("independent loaders have independent snapshots, identity, design and data", async () => {
  const first = createContentLoader({
    configuration: { ...config, theme: { font: "sans", accent: "#cc3300" } },
    environment: { SANITY_USE_MOCK: "true" },
    mockContent: demoContent,
  });
  const second = createContentLoader({
    configuration: {
      ...config,
      restaurantKey: "second",
      site: { url: "https://second.example" },
      theme: { font: "editorial", accent: "#003366" },
    },
    environment: { SANITY_USE_MOCK: "true" },
    mockContent: {
      ...demoContent,
      settings: { ...demoContent.settings, name: "Otro restaurante" },
    },
  });
  const [a, b] = await Promise.all([first.getContent(), second.getContent()]);
  assert.equal(a.content.settings.theme.accent, "#cc3300");
  assert.equal(b.content.settings.theme.accent, "#003366");
  assert.equal(b.content.settings.name, "Otro restaurante");
  assert.notEqual(a.content.settings.name, b.content.settings.name);
  assert.equal(first.getContent(), first.getContent());
});
test("CMS overrides presentation defaults without writing or migrating content", async () => {
  const raw = {
    ...demoContent,
    publishedDocumentCount: 5,
    settings: {
      ...demoContent.settings,
      theme: { accent: "#112233" },
      editorial: { footer: { link: null } },
    },
    pages: demoContent.pages.map((p) => ({
      ...p,
      blocks: [],
      composition: null,
    })),
  };
  const before = JSON.stringify(raw);
  let calls = 0;
  const loader = createContentLoader({
    configuration: config,
    fetchPublished: async () => {
      calls++;
      return raw;
    },
  });
  const data = await loader.getContent();
  await loader.getContent();
  assert.equal(calls, 1);
  assert.equal(data.source, "sanity");
  assert.equal(data.content.settings.theme.accent, "#112233");
  assert.equal(data.content.settings.editorial?.footer?.link, null);
  assert.equal(JSON.stringify(raw), before);
});
test("strict errors do not mix incomplete CMS with demo; fallback is explicit", async () => {
  const invalid = createContentLoader({
    configuration: config,
    mockContent: demoContent,
    fetchPublished: async () => ({ publishedDocumentCount: 1 }),
  });
  await assert.rejects(invalid.getContent(), /No se pudo validar/);
  const empty = createContentLoader({
    configuration: config,
    mockContent: demoContent,
    fetchPublished: async () => ({ publishedDocumentCount: 0 }),
  });
  assert.equal((await empty.getContent()).cmsStatus, "empty");
  const fallback = createContentLoader({
    configuration: config,
    environment: { SANITY_ALLOW_DEMO_FALLBACK: "true" },
    mockContent: demoContent,
    fetchPublished: async () => {
      throw Error("private response");
    },
  });
  assert.equal((await fallback.getContent()).cmsStatus, "error");
  await assert.rejects(
    createContentLoader({
      configuration: config,
      environment: { SANITY_USE_MOCK: "true" },
    }).getContent(),
  );
});

test("explicit fallback exposes valid CMS pages while base editorial documents are pending", async () => {
  const custom = {
    ...demoContent.pages[0],
    slug: "page-test-one",
    title: "Page test One",
    navigationOrder: 20,
  };
  const loader = createContentLoader({
    configuration: config,
    environment: { SANITY_ALLOW_DEMO_FALLBACK: "true" },
    mockContent: demoContent,
    fetchPublished: async () => ({
      publishedDocumentCount: 1,
      settings: null,
      pages: [custom],
      categories: [],
      dishes: [],
      story: null,
      gallery: [],
    }),
  });

  const result = await loader.getContent();

  assert.equal(result.source, "demo");
  assert.equal(result.cmsStatus, "partial");
  assert.equal(result.content.pages.length, demoContent.pages.length + 1);
  assert.equal(result.content.pages.at(-1)?.title, "Page test One");
  assert.match(result.warning || "", /CMS/);
});
