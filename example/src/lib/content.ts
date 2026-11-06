import { createContentLoader } from "../../../src/lib/content";
import { restaurantConfig } from "../../restaurant.config";
import { demoContent } from "../../demo";
const loader = createContentLoader({
  configuration: restaurantConfig,
  environment: {
    SITE_URL: import.meta.env.SITE_URL,
    SITE_BASE: import.meta.env.SITE_BASE,
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_API_READ_TOKEN: import.meta.env.SANITY_API_READ_TOKEN,
    SANITY_ALLOW_DEMO_FALLBACK: import.meta.env.SANITY_ALLOW_DEMO_FALLBACK,
    SANITY_USE_MOCK: import.meta.env.SANITY_USE_MOCK ?? "true",
  },
  mockContent: demoContent,
});
export const getContent = loader.getContent;
