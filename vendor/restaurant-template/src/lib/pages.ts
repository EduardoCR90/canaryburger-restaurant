import type { Content } from '../types/content';
import { routeForSlug } from '../types/routes';
const legacyLabels:Record<string,string> = {inicio:'Inicio',carta:'La carta',restaurante:'La casa',reservas:'Reservas'};
export function getPublishedPages(content:Content) { return content.pages.filter(p => p.status === 'published'); }
export function getPageBySlug(content:Content, slug:string) { return getPublishedPages(content).find(p => p.slug === slug); }
export function getNavigation(content:Content) {
 return getPublishedPages(content).filter(p => p.showInNavigation).sort((a,b) => a.navigationOrder-b.navigationOrder).map(p => ({href:routeForSlug(p.slug),label:p.navigationLabel || legacyLabels[p.slug] || p.title}));
}
export function getMenu(content:Content, categoryIds:string[] = [], dishIds:string[] = []) {
 const categories = content.categories.filter(c => c.visible && (!categoryIds.length || categoryIds.includes(c._id))).sort((a,b) => a.order-b.order);
 const dishes = content.dishes.filter(d => d.visible && categories.some(c => c._id === d.categoryId) && (!dishIds.length || dishIds.includes(d._id))).sort((a,b) => a.order-b.order);
 return {categories,dishes};
}

export function getHomeHref(content:Content):string|undefined {
 const pages=getPublishedPages(content);
 const home=pages.find(p=>p.slug === 'inicio') || pages[0];
 return home ? routeForSlug(home.slug) : undefined;
}
