import {
  contentSchema,
  type Content,
  type ContentResult,
} from "../types/content";
import { resolveVisualTheme } from "../types/visual";
import { inherit, originalDefaults } from "./editorial";
import { resolvePublishedContent } from "./published-content";
import { createContentClient } from "./sanity.server";
import { restaurantQuery } from "./queries";
import {
  resolveConfiguration,
  environmentFlag,
  type BuildEnvironment,
  type RestaurantConfig,
  type RestaurantConfigInput,
} from "./config";
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function preparePresentation(
  content: Content,
  config: RestaurantConfig,
  raw: unknown = content,
): Content {
  const defaults = {
    composition: inherit(
      originalDefaults.composition,
      config.editorial.composition,
    ),
    editorial: inherit(originalDefaults.editorial, config.editorial.site),
  };
  const rawTheme = record(record(record(raw).settings).theme);
  const theme = resolveVisualTheme(rawTheme, config.theme);
  return {
    ...content,
    settings: {
      ...content.settings,
      theme,
      editorial: inherit(defaults.editorial, content.settings.editorial),
    },
    pages: content.pages.map((p) => ({
      ...p,
      composition: {
        ...inherit(defaults.composition, p.composition),
        sections: {
          ...config.editorial.composition?.sections,
          ...p.composition?.sections,
        },
      },
      blocks: p.blocks?.map((b) => {
        const block = record(b);
        const component = (
          {
            hero: "hero",
            menuSection: "menu",
            galleryBlock: "gallery",
            cards: "featured",
            cta: "cta",
          } as Record<string, "hero" | "menu" | "gallery" | "featured" | "cta">
        )[String(block._type)];
        const variant =
          config.variants[block._type as keyof typeof config.variants] ||
          (component ? theme[component] : undefined);
        return variant && block.variant == null ? { ...block, variant } : b;
      }),
    })),
  };
}
export function createContentLoader(options: {
  configuration: RestaurantConfigInput;
  environment?: BuildEnvironment;
  mockContent?: Content;
  fetchPublished?: (query: string) => Promise<unknown>;
  onSnapshot?: (
    project: string,
    dataset: string,
    raw: unknown,
  ) => Promise<void>;
}) {
  const env = options.environment || {};
  const config = resolveConfiguration(options.configuration, env);
  let snapshot: Promise<ContentResult> | undefined;
  function demo(status: "disabled" | "error"): ContentResult {
    if (!options.mockContent)
      throw new Error(
        "Demo content must be explicitly supplied by the instance",
      );
    return {
      content: contentSchema.parse(options.mockContent),
      source: "demo",
      cmsStatus: status,
      ...(status === "error"
        ? { warning: "Se muestra contenido de demostración temporalmente." }
        : {}),
    };
  }
  function present(result: ContentResult, raw: unknown): ContentResult {
    return {
      ...result,
      content: preparePresentation(
        result.content,
        config,
        result.source === "demo" ? { settings: { theme: {} } } : raw,
      ),
      presentation: config.assets,
    };
  }
  async function load(): Promise<ContentResult> {
    if (environmentFlag(env.SANITY_USE_MOCK)) {
      const result = demo("disabled");
      return present(result, options.mockContent);
    }
    try {
      if (!config.sanity.projectId)
        throw new Error("Configure a Sanity project for CMS mode");
      const raw = await (options.fetchPublished
        ? options.fetchPublished(restaurantQuery)
        : createContentClient({
            projectId: config.sanity.projectId,
            dataset: config.sanity.dataset,
            token: env.SANITY_API_READ_TOKEN,
          }).fetch<unknown>(restaurantQuery));
      await options.onSnapshot?.(
        config.sanity.projectId,
        config.sanity.dataset,
        raw,
      );
      return present(
        resolvePublishedContent(raw, {
          fallback: options.mockContent,
          requiredSlugs: config.requiredSlugs,
          allowSupplementalPages: environmentFlag(
            env.SANITY_ALLOW_DEMO_FALLBACK,
          ),
        }),
        raw,
      );
    } catch {
      if (environmentFlag(env.SANITY_ALLOW_DEMO_FALLBACK)) {
        const result = demo("error");
        return present(result, options.mockContent);
      }
      throw new Error(
        "No se pudo validar Sanity. Revisa conexión, permisos y contenido publicado completo. Se conserva el último despliegue. No se reintenta ni se mezcla contenido demo.",
      );
    }
  }
  return { configuration: config, getContent: () => (snapshot ??= load()) };
}
