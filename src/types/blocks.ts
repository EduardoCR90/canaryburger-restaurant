import {variantOptions} from './visual';
import { z } from 'zod';
// Contratos de presentación: sin assets, referencias ni cliente Sanity.
export const httpsUrl = z.url().refine(v => v.startsWith('https://'), 'Se requiere HTTPS');
export const editorialImage = z.object({url:httpsUrl, alt:z.string().trim().min(1)});
export const linkSchema = z.object({label:z.string().min(1), href:z.union([httpsUrl,z.string().regex(/^\/(?!\/)[a-z0-9/#?=&%._-]*$/i,'Usa HTTPS o una ruta interna')])});
const common = { _key:z.string().optional(),enabled:z.boolean().optional(), title:z.string().optional(), variant:z.enum(['editorial','compact']).default('editorial'), alignment:z.enum(['left','center']).default('left') };
const text = z.object({_type:z.literal('block'),_key:z.string().optional(),style:z.enum(['normal','h2','h3','blockquote']).default('normal'),listItem:z.enum(['bullet','number']).optional(),children:z.array(z.object({_type:z.literal('span'),text:z.string(),marks:z.array(z.string()).default([])})),markDefs:z.array(z.object({_key:z.string(),_type:z.literal('link'),href:linkSchema.shape.href})).default([])});
export const richContent = z.array(text);
export const blockSchemas = {
 hero: z.object({...common,_type:z.literal('hero'),variant:z.enum(variantOptions.hero).default('editorial'),title:z.string().min(1),subtitle:z.string().optional(),image:editorialImage.nullish(),cta:linkSchema.nullish()}),
 richText: z.object({...common,_type:z.literal('richText'),body:richContent,width:z.enum(['reading','wide']).default('reading')}),
 imageText: z.object({...common,_type:z.literal('imageText'),image:editorialImage,body:z.string().min(1),position:z.enum(['left','right']).default('left'),cta:linkSchema.nullish()}),
 galleryBlock: z.object({...common,_type:z.literal('galleryBlock'),variant:z.enum(variantOptions.gallery).default('editorial'),images:z.array(editorialImage).min(1)}),
 menuSection: z.object({...common,_type:z.literal('menuSection'),featuredOnly:z.boolean().optional(),variant:z.enum(variantOptions.menu).default('editorial'),categoryIds:z.array(z.string()).default([]),dishIds:z.array(z.string()).default([])}),
 cards: z.object({...common,_type:z.literal('cards'),variant:z.enum(variantOptions.featured).default('editorial'),items:z.array(z.object({title:z.string().min(1),description:z.string().optional(),image:editorialImage.nullish(),link:linkSchema.nullish()})).min(1)}),
 cta: z.object({...common,_type:z.literal('cta'),variant:z.enum(variantOptions.cta).default('editorial'),title:z.string().min(1),description:z.string().optional(),cta:linkSchema,image:editorialImage.nullish()}),
 faq: z.object({...common,_type:z.literal('faq'),items:z.array(z.object({question:z.string().min(1),answer:z.string().min(1)})).min(1)}),
 divider: z.object({...common,_type:z.literal('divider'),spacing:z.enum(['small','medium','large']).default('medium'),line:z.boolean().default(true)}),
 notice: z.object({...common,_type:z.literal('notice'),text:z.string().min(1),cta:linkSchema.nullish(),startsAt:z.iso.datetime({offset:true}).nullish(),endsAt:z.iso.datetime({offset:true}).nullish()}).refine(v => !v.startsAt || !v.endsAt || Date.parse(v.startsAt)<=Date.parse(v.endsAt), 'La fecha final debe ser posterior'),
};
export type BlockType = keyof typeof blockSchemas;
export type ContentBlock = z.infer<(typeof blockSchemas)[BlockType]>;
export type BlockOf<T extends BlockType> = Extract<ContentBlock,{_type:T}>;
export type RichContent = z.infer<typeof richContent>;
