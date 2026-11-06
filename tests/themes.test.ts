import { test } from "node:test";
import assert from "node:assert/strict";
import {
  themePresets,
  resolveVisualTheme,
  storedThemeSchema,
  selectPreset,
  resolveVariant,
  contrastRatio,
} from "../src/types/visual";
import { resolveConfiguration } from "../src/lib/config";
import { resolveBlocks } from "../src/lib/blocks";
import { preparePresentation } from "../src/lib/content";
import { demoContent } from "../example/demo";
test("three presets resolve independently, permit overrides, and keep legacy defaults", () => {
  for (const preset of ["elegant", "modern", "casual"] as const) {
    const resolved = resolveVisualTheme({ preset, accent: "#123456" });
    assert.equal(resolved.preset, preset);
    assert.equal(resolved.accent, "#123456");
    assert.equal(resolved.hero, themePresets[preset].hero);
    assert.ok(contrastRatio(resolved.paper, resolved.ink) >= 4.5);
    const config = resolveConfiguration({
      contractVersion: 1,
      restaurantKey: "test",
      site: { url: "https://test.example" },
      sanity: {},
      theme: { preset },
    });
    assert.equal(config.theme.hero, themePresets[preset].hero);
    assert.equal(config.theme.paper, themePresets[preset].paper);
  }
  const legacy = resolveVisualTheme(
    {},
    { name: "legacy", paper: "#ece8df", ink: "#252d27", accent: "#95462f" },
  );
  assert.equal(legacy.preset, undefined);
  assert.equal(legacy.paper, "#ece8df");
  assert.equal(legacy.header, "editorial");
  assert.deepEqual(storedThemeSchema.parse({ preset: "modern" }), {
    preset: "modern",
  });
});
test("preset replacement preserves unmanaged metadata; invalid CSS and backend options fail closed", () => {
  assert.deepEqual(
    selectPreset(
      {
        _type: "restaurantTheme",
        paper: "#123456",
        hero: "cover",
        future: "keep",
      },
      "modern",
    ),
    { _type: "restaurantTheme", future: "keep", preset: "modern" },
  );
  for (const input of [
    { paper: "red;display:none" },
    { contentMax: 99999 },
    { font: "url(https://attacker.test)" },
    { preset: "unknown" },
    { header: "arbitrary" },
  ])
    assert.equal(storedThemeSchema.safeParse(input).success, false);
  assert.equal(resolveVariant("hero", "unknown"), "editorial");
  assert.equal(resolveVisualTheme({ hero: "unknown" }).hero, "editorial");
});
test("block visibility and ordering preserve original data; unsupported variants use safe presentation", () => {
  const blocks = [
    { _type: "hero", title: "First", _key: "a", variant: "unknown" },
    { _type: "notice", text: "Hidden", _key: "b", enabled: false },
    { _type: "divider", _key: "c" },
  ];
  const before = JSON.stringify(blocks);
  const resolved = resolveBlocks(blocks);
  assert.deepEqual(
    resolved.map((b) => b._key),
    ["a", "c"],
  );
  assert.equal(resolved[0].variant, "editorial");
  assert.equal(JSON.stringify(blocks), before);
});
test("CMS theme and section flags survive adaptation without converting historical pages", () => {
  const config = resolveConfiguration({
    contractVersion: 1,
    restaurantKey: "test",
    site: { url: "https://test.example" },
    sanity: {},
    theme: { paper: "#f7f7f5" },
  });
  const raw = {
    ...demoContent,
    settings: { ...demoContent.settings, theme: { preset: "casual" } },
  };
  const content = preparePresentation(
    {
      ...demoContent,
      pages: [
        {
          ...demoContent.pages[0],
          blocks: [],
          composition: { sections: { featured: false } },
        },
      ],
    },
    config,
    raw,
  );
  assert.equal(content.settings.theme.menu, "grid");
  assert.equal(content.pages[0].composition?.sections?.featured, false);
  assert.deepEqual(content.pages[0].blocks, []);
});
