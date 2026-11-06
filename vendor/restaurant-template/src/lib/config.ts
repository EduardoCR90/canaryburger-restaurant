import { resolveVisualTheme, variantDefaultsSchema } from "../types/visual";
import { z } from "zod";
import { themeSchema } from "../types/restaurant";
import { compositionSchema, siteEditorialSchema } from "../types/editorial";
export const TEMPLATE_VERSION = "0.4.2";
const localAsset = z
  .string()
  .regex(/^\/(?!\/)[a-zA-Z0-9/_\-.]+$/)
  .refine((v) => !v.split("/").includes(".."));
const baseSchema = z
  .string()
  .regex(/^\/(?:[a-zA-Z0-9_-]+\/?)*$/)
  .transform((v) => (v === "/" ? "/" : v.replace(/\/$/, "")));
const https = z
  .url()
  .refine(
    (v) =>
      new URL(v).protocol === "https:" &&
      !new URL(v).username &&
      !new URL(v).password,
  );
const assetsSchema = z.object({
  favicon: localAsset.default("/favicon.svg"),
  socialImage: z
    .object({
      path: localAsset.default("/og-default.png"),
      alt: z.string().min(1).default("{name}"),
      type: z
        .enum(["image/jpeg", "image/png", "image/svg+xml"])
        .default("image/png"),
      width: z.number().int().positive().default(1200),
      height: z.number().int().positive().default(630),
    })
    .default(() => ({
      path: "/og-default.png",
      alt: "{name}",
      type: "image/png" as const,
      width: 1200,
      height: 630,
    })),
  imageOrigins: z
    .array(https.refine((v) => new URL(v).origin === v))
    .default([]),
});
export type PresentationAssets = z.infer<typeof assetsSchema>;
export const restaurantConfiguration = z.object({
  contractVersion: z.literal(1),
  restaurantKey: z.string().regex(/^[a-z0-9-]{1,100}$/),
  site: z.object({
    url: https.refine(
      (v) =>
        new URL(v).pathname === "/" && !new URL(v).search && !new URL(v).hash,
    ),
    base: baseSchema.default("/"),
  }),
  sanity: z.object({
    projectId: z
      .string()
      .regex(/^[a-z0-9]{1,32}$/)
      .optional(),
    dataset: z
      .string()
      .regex(/^[a-z0-9_-]{1,64}$/)
      .default("production"),
  }),
  theme: themeSchema.default(() => themeSchema.parse({})),
  assets: assetsSchema.default(() => assetsSchema.parse({})),
  editorial: z
    .object({
      composition: compositionSchema.optional(),
      site: siteEditorialSchema.optional(),
    })
    .default({}),
  requiredSlugs: z
    .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
    .default([]),
  variants: variantDefaultsSchema.default({}),
  deployment: z
    .object({
      provider: z.enum(["github-pages", "static"]),
      reportEndpoint: https.optional(),
    })
    .default({ provider: "static" }),
});
export type RestaurantConfigInput = z.input<typeof restaurantConfiguration>;
export type RestaurantConfig = z.infer<typeof restaurantConfiguration>;
export type BuildEnvironment = {
  SITE_URL?: string;
  SITE_BASE?: string;
  SANITY_PROJECT_ID?: string;
  SANITY_DATASET?: string;
  SANITY_USE_MOCK?: string;
  SANITY_ALLOW_DEMO_FALLBACK?: string;
  SANITY_API_READ_TOKEN?: string;
};
export function resolveConfiguration(
  input: RestaurantConfigInput,
  env: BuildEnvironment = {},
) {
  // Parse on each call, without mutation or a global tenant cache. Secrets never enter this object.
  const result = restaurantConfiguration.parse({
    ...input,
    site: {
      ...input.site,
      ...(env.SITE_URL ? { url: env.SITE_URL } : {}),
      ...(env.SITE_BASE ? { base: env.SITE_BASE } : {}),
    },
    sanity: {
      ...input.sanity,
      ...(env.SANITY_PROJECT_ID ? { projectId: env.SANITY_PROJECT_ID } : {}),
      ...(env.SANITY_DATASET ? { dataset: env.SANITY_DATASET } : {}),
    },
  });
  result.theme = resolveVisualTheme(input.theme);
  return result;
}
export function environmentFlag(value: string | undefined) {
  if (value === undefined || value === "false") return false;
  if (value === "true") return true;
  throw new Error("Boolean build variables must be true or false");
}
