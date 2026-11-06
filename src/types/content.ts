import {resolveVisualTheme} from './visual';
import { z } from 'zod';
import {compositionSchema,siteEditorialSchema} from './editorial';
import { editorialImage, httpsUrl } from './blocks';
import { slugSchema } from './routes';
import { themeSchema, moduleSchema } from './restaurant';
export const safeUrl = httpsUrl;
export const imageSchema = editorialImage;
export const seoSchema = z.object({ title: z.string().min(1), description: z.string().min(1), image: imageSchema.nullish() });
export const pageSchema = z.object({
 slug: slugSchema,
 status: z.enum(['published','hidden']).default('published'), noindex:z.boolean().default(false),
 showInNavigation:z.boolean().default(true), navigationOrder:z.number().int().default(0), navigationLabel:z.string().nullish(),
 composition:compositionSchema.nullish(),
 blocks:z.array(z.unknown()).optional(),
 eyebrow: z.string().default(''), title: z.string().min(1), intro: z.string().default(''), image: imageSchema.nullish(), seo: seoSchema,
});
export const dishSchema = z.object({
 _id: z.string().min(1), name: z.string().min(1), description: z.string().min(1), price: z.number().nonnegative(),
 categoryId: z.string().min(1), allergens: z.array(z.string().min(1)).default([]), available: z.boolean(),
 visible:z.boolean().default(true), order:z.number().int().default(0), tags:z.array(z.string().min(1)).default([]),
 featured: z.boolean().default(false), image: imageSchema.nullish(),
});
export const contentSchema = z.object({
 settings: z.object({
  editorial:siteEditorialSchema.nullish(), socialImage:imageSchema.nullish(),
  theme:z.preprocess(value=>resolveVisualTheme(value),themeSchema).default(() => themeSchema.parse({})), modules:z.array(moduleSchema).default([]), logo:imageSchema.nullish(),
  name: z.string().min(1), tagline: z.string().min(1), concept: z.string().min(1), address: z.string().min(1),
  email: z.email(), phone: z.string().min(1), isFictional: z.boolean(),
  reservationUrl: safeUrl.nullish(), hours: z.array(z.object({ days: z.string().min(1), time: z.string().min(1) })),
 }),
 pages: z.array(pageSchema).min(1),
 categories: z.array(z.object({ _id: z.string().min(1), name: z.string().min(1), note: z.string().nullish(), visible:z.boolean().default(true), order:z.number().int().default(0) })),
 dishes: z.array(dishSchema),
 story: z.object({ title: z.string().min(1), body: z.string().min(1), philosophy: z.string().min(1), chefName: z.string().min(1), chefBio: z.string().min(1), image: imageSchema.nullish() }),
 gallery: z.array(imageSchema),
});
export type Content = z.infer<typeof contentSchema>;
export type EditorialImage = z.infer<typeof imageSchema>;
export type Dish = z.infer<typeof dishSchema>;
export type ContentResult = { presentation?: import('../lib/config').PresentationAssets; content: Content; source: 'demo' | 'sanity'; warning?: string; cmsStatus?: 'disabled' | 'empty' | 'partial' | 'published' | 'error' };
