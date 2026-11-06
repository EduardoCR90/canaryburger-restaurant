import type {RichContent} from '../types/blocks';
type RichGroup={list:'ul'|'ol'|undefined;items:RichContent};
/** Agrupa listas consecutivas sin inyectar HTML ni perder el orden editorial. */
export function groupRichText(body:RichContent):RichGroup[] {
 const groups:RichGroup[]=[];
 for (const paragraph of body) {
  const list=paragraph.listItem === 'bullet' ? 'ul' : paragraph.listItem === 'number' ? 'ol' : undefined;
  const previous=groups.at(-1);
  if (list && previous?.list === list) previous.items.push(paragraph);
  else groups.push({list,items:[paragraph]});
 }
 return groups;
}
