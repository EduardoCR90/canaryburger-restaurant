import type { RestaurantConfigInput } from "@restaurant-platform/astro-template/config";

export const restaurantConfig = {
  "contractVersion": 1,
  "restaurantKey": "canaryburger",
  "site": {
    "url": "https://eduardocr90.github.io/",
    "base": "/canaryburger-restaurant"
  },
  "sanity": {
    "projectId": "lr4la5n6",
    "dataset": "production"
  },
  "requiredSlugs": [
    "inicio",
    "carta",
    "restaurante",
    "reservas"
  ],
  "theme": {
    "preset": "modern"
  },
  "assets": {
    "favicon": "/favicon.svg",
    "socialImage": {
      "path": "/og-default.png",
      "alt": "CanaryBurger · imagen para compartir",
      "type": "image/png",
      "width": 1200,
      "height": 630
    },
    "imageOrigins": []
  },
  "deployment": {
    "provider": "github-pages",
    "reportEndpoint": "https://wanrzgumoamryuybmopa.supabase.co/functions/v1/publications"
  }
} satisfies RestaurantConfigInput;
