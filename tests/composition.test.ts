import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBlocks } from "../src/lib/blocks";
import { getNavigation, getMenu } from "../src/lib/pages";
import { preparePresentation } from "../src/lib/content";
import { resolveConfiguration } from "../src/lib/config";
import { demoContent } from "../example/demo";
import { pathFor } from "../src/lib/paths";
test("CMS blocks retain order, identity, variants and data without a builder", () => {
  const raw = [
    { _type: "hero", _key: "a", title: "Primero" },
    { _type: "divider", _key: "b" },
    { _type: "richText", _key: "c", body: [] },
  ];
  const config = resolveConfiguration({
    contractVersion: 1,
    restaurantKey: "example",
    site: { url: "https://example.test" },
    sanity: {},
    variants: { hero: "compact" },
  });
  const data = preparePresentation(
    { ...demoContent, pages: [{ ...demoContent.pages[0], blocks: raw }] },
    config,
  );
  const blocks = resolveBlocks(data.pages[0].blocks);
  assert.deepEqual(
    blocks.map((b) => [b._key, b._type]),
    [
      ["a", "hero"],
      ["b", "divider"],
      ["c", "richText"],
    ],
  );
  assert.equal(blocks[0].variant, "compact");
  assert.equal(raw[0].title, "Primero");
  assert.ok(!("variant" in raw[0]));
});
test("navigation, categories and resource paths are instance independent", () => {
  assert.equal(
    pathFor("/favicon.svg", "/another-restaurant"),
    "/another-restaurant/favicon.svg",
  );
  assert.equal(pathFor("/carta/", "/"), "/carta/");
  assert.equal(getNavigation(demoContent)[0].href, "/");
  assert.equal(getMenu(demoContent).dishes.length, 1);
});
