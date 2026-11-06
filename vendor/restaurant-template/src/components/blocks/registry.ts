import HeroBlock from './HeroBlock.astro';
import TextBlock from './TextBlock.astro';
import ImageTextBlock from './ImageTextBlock.astro';
import GalleryBlock from './GalleryBlock.astro';
import MenuBlock from './MenuBlock.astro';
import CardsBlock from './CardsBlock.astro';
import CTABlock from './CTABlock.astro';
import FAQBlock from './FAQBlock.astro';
import DividerBlock from './DividerBlock.astro';
import NoticeBlock from './NoticeBlock.astro';
import type {BlockType} from '../../types/blocks';
export const blockRegistry = {
 hero:HeroBlock,
 richText:TextBlock,
 imageText:ImageTextBlock,
 galleryBlock:GalleryBlock,
 menuSection:MenuBlock,
 cards:CardsBlock,
 cta:CTABlock,
 faq:FAQBlock,
 divider:DividerBlock,
 notice:NoticeBlock
} satisfies Record<BlockType,unknown>;
