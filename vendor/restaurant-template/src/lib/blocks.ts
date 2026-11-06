import {variantsForBlock} from '../types/visual';
import { blockSchemas, type BlockType, type ContentBlock } from '../types/blocks';
export function resolveBlocks(raw:unknown[] = [], now:Date = new Date(), warn:(message:string)=>void = message => { if (import.meta.env?.DEV) console.warn(message); }):ContentBlock[] {
 return raw.flatMap((value,index) => {
  const type = value && typeof value === 'object' && '_type' in value ? String(value._type) : '';
  if (!Object.hasOwn(blockSchemas,type)) { warn(`[blocks] Tipo desconocido «${type}» en posición ${index}; omitido.`); return []; }
  const raw=value as Record<string,unknown>;
  if(raw.enabled===false)return [];
  const safeVariant=typeof raw.variant==='string'&&variantsForBlock(type).includes(raw.variant)?raw.variant:'editorial';
  const parsed = blockSchemas[type as BlockType].safeParse({...raw,variant:safeVariant});
  if (!parsed.success) { warn(`[blocks] Bloque «${type}» inválido en posición ${index}; revisa sus campos.`); return []; }
  const block = parsed.data;
  if (block._type === 'notice' && ((block.startsAt && now.getTime() < Date.parse(block.startsAt)) || (block.endsAt && now.getTime() >= Date.parse(block.endsAt)))) return [];
  return [block];
 });
}
