import { createContentLoader } from "@restaurant-platform/astro-template/content";
import { recordDeploymentEvidence } from "@restaurant-platform/astro-template/ops/evidence";
import { restaurantConfig } from "../../restaurant.config";
import { demoContent } from "../instance/demo";

const loader = createContentLoader({
  configuration: restaurantConfig,
  environment: {
    SITE_URL: import.meta.env.SITE_URL,
    SITE_BASE: import.meta.env.SITE_BASE,
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_API_READ_TOKEN: import.meta.env.SANITY_API_READ_TOKEN,
    SANITY_ALLOW_DEMO_FALLBACK:
      import.meta.env.SANITY_ALLOW_DEMO_FALLBACK ?? "true",
    SANITY_USE_MOCK: import.meta.env.SANITY_USE_MOCK ?? "false",
  },
  mockContent: demoContent,
  onSnapshot: recordDeploymentEvidence,
});

export const getContent = loader.getContent;
