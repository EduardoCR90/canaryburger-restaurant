import { z } from 'zod';
export const legacySlugs = ['inicio','carta','restaurante','reservas'] as const;
export const reservedSlugs = ['index','404','admin','dashboard','api','assets','_astro','robots','robots.txt','sitemap','sitemap.xml'];
export const slugSchema = z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Usa letras minúsculas, números y guiones').refine(v => !reservedSlugs.includes(v),'Ruta reservada');
export function routeForSlug(slug:string) { return slug === 'inicio' ? '/' : `/${slug}/`; }
