import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, evaluate } from "groq-js";
import { restaurantQuery } from "../src/lib/queries";
import { resolvePublishedContent } from "../src/lib/published-content";
import { demoContent } from "../example/demo";
test("existing CMS documents and references adapt through the real shared GROQ query", async () => {
  const documents = [
    {
      ...demoContent.settings,
      _id: "restaurant-settings",
      _type: "settings",
      _rev: "settings-rev",
    },
    {
      ...demoContent.story,
      _id: "restaurant-story",
      _type: "story",
      _rev: "story-rev",
    },
    {
      _id: "restaurant-gallery",
      _type: "gallery",
      _rev: "gallery-rev",
      images: [],
    },
    ...demoContent.pages.map((p) => ({
      ...p,
      _id: "page-" + p.slug,
      _rev: "page-rev",
      _type: "page",
      slug: { current: p.slug },
    })),
    ...demoContent.categories.map((c) => ({
      ...c,
      _type: "category",
      _rev: "category-rev",
    })),
    ...demoContent.dishes.map((d) => ({
      ...d,
      _type: "dish",
      _rev: "dish-rev",
      category: { _type: "reference", _ref: d.categoryId },
    })),
  ];
  const result = await (
    await evaluate(parse(restaurantQuery), { dataset: documents })
  ).get();
  const data = resolvePublishedContent(result);
  assert.equal(data.source, "sanity");
  assert.equal(
    data.content.dishes[0].categoryId,
    demoContent.categories[0]._id,
  );
  assert.equal(data.content.pages[0].slug, "inicio");
  assert.equal(result.publicationRevisions.length, documents.length);
});
