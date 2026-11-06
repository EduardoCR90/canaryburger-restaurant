import { z } from "zod";
import {
  contentSchema,
  pageSchema,
  type Content,
  type ContentResult,
} from "../types/content";
const countSchema = z.object({
  publishedDocumentCount: z.number().int().nonnegative(),
});
const supplementalPagesSchema = z.object({ pages: z.array(pageSchema).min(1) });

function progressivePages(raw: unknown, fallback: Content): ContentResult {
  const base = contentSchema.parse(fallback);
  const { pages } = supplementalPagesSchema.parse(raw);
  if (new Set(pages.map((page) => page.slug)).size !== pages.length)
    throw new Error("Los slugs de páginas deben ser únicos.");
  const published = new Map(base.pages.map((page) => [page.slug, page]));
  for (const page of pages) published.set(page.slug, page);
  return {
    content: { ...base, pages: [...published.values()] },
    source: "demo",
    cmsStatus: "partial",
    warning:
      "Contenido de demostración · Las páginas publicadas en el CMS ya están disponibles.",
  };
}
export function resolvePublishedContent(
  raw: unknown,
  options: {
    fallback?: Content;
    requiredSlugs?: string[];
    allowSupplementalPages?: boolean;
  } = {},
): ContentResult {
  const { publishedDocumentCount } = countSchema.parse(raw);
  if (publishedDocumentCount === 0) {
    if (!options.fallback)
      throw new Error(
        "Empty dataset: configure explicit demo content or publish content",
      );
    return {
      content: contentSchema.parse(options.fallback),
      source: "demo",
      cmsStatus: "empty",
      warning:
        "Contenido de demostración · La propuesta definitiva está en preparación.",
    };
  }
  let content: Content;
  try {
    content = contentSchema.parse(raw);
  } catch (error) {
    if (options.allowSupplementalPages && options.fallback)
      return progressivePages(raw, options.fallback);
    throw error;
  }
  for (const slug of options.requiredSlugs || [])
    if (content.pages.filter((p) => p.slug === slug).length !== 1)
      throw new Error("Falta una página requerida por la instancia");
  if (new Set(content.pages.map((p) => p.slug)).size !== content.pages.length)
    throw new Error("Los slugs de páginas deben ser únicos.");
  if (
    content.dishes.some(
      (d) => !content.categories.some((c) => c._id === d.categoryId),
    )
  )
    throw new Error("Publica las categorías referenciadas por los platos.");
  return { content, source: "sanity", cmsStatus: "published" };
}
