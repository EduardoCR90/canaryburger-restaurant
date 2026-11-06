import {sectionFlagsSchema} from './visual';
import { z } from "zod";
import { linkSchema } from "./blocks";
export const headingSchema = z
  .object({
    before: z.string().max(20000).nullish(),
    emphasis: z.string().max(20000).nullish(),
    after: z.string().max(20000).nullish(),
  })
  .refine(
    (v) => !![v.before, v.emphasis, v.after].some((t) => t?.trim()),
    "El titular debe contener texto",
  );
export const compositionSchema = z.object({
 sections:sectionFlagsSchema.nullish(),
  hero: z
    .object({
      caption: z.string().trim().min(1).max(20000).nullish(),
      coordinates: z.string().trim().min(1).max(20000).nullish(),
      sideNote: z.string().trim().min(1).max(20000).nullish(),
      link: linkSchema.nullish(),
    })
    .nullish(),
  essence: z
    .object({
      eyebrow: z.string().trim().min(1).max(20000).nullish(),
      heading: headingSchema.nullish(),
      link: linkSchema.nullish(),
    })
    .nullish(),
  featured: z
    .object({
      eyebrow: z.string().trim().min(1).max(20000).nullish(),
      heading: headingSchema.nullish(),
      link: linkSchema.nullish(),
      empty: z.string().trim().min(1).max(20000).nullish(),
    })
    .nullish(),
  storyPreview: z
    .object({
      eyebrow: z.string().trim().min(1).max(20000).nullish(),
      link: linkSchema.nullish(),
    })
    .nullish(),
  story: z
    .object({ eyebrow: z.string().trim().min(1).max(20000).nullish() })
    .nullish(),
  chef: z
    .object({ eyebrow: z.string().trim().min(1).max(20000).nullish() })
    .nullish(),
  gallery: z
    .object({
      eyebrow: z.string().trim().min(1).max(20000).nullish(),
      heading: headingSchema.nullish(),
      empty: z.string().trim().min(1).max(20000).nullish(),
    })
    .nullish(),
  contact: z
    .object({
      eyebrow: z.string().trim().min(1).max(20000).nullish(),
      heading: headingSchema.nullish(),
      providerLabel: z.string().trim().min(1).max(20000).nullish(),
      hoursTitle: z.string().trim().min(1).max(20000).nullish(),
      addressTitle: z.string().trim().min(1).max(20000).nullish(),
      unavailable: z.string().trim().min(1).max(20000).nullish(),
    })
    .nullish(),
});
export const siteEditorialSchema = z.object({
  signature: z.string().trim().min(1).max(20000).nullish(),
  footer: z
    .object({
      line: z.string().trim().min(1).max(20000).nullish(),
      link: linkSchema.nullish(),
      backToTop: z.string().trim().min(1).max(20000).nullish(),
    })
    .nullish(),
  reservation: z
    .object({
      eyebrow: z.string().trim().min(1).max(20000).nullish(),
      heading: headingSchema.nullish(),
      link: linkSchema.nullish(),
    })
    .nullish(),
  menu: z
    .object({
      emptyCategory: z.string().trim().min(1).max(20000).nullish(),
      emptyMenu: z.string().trim().min(1).max(20000).nullish(),
      disclaimer: z.string().trim().min(1).max(20000).nullish(),
      noAllergens: z.string().trim().min(1).max(20000).nullish(),
      unavailable: z.string().trim().min(1).max(20000).nullish(),
    })
    .nullish(),
});
export type EditorialHeading = z.infer<typeof headingSchema>;
