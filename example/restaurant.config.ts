import type { RestaurantConfigInput } from "../src/lib/config";
export const restaurantConfig = {
  contractVersion: 1,
  restaurantKey: "example-restaurant",
  site: { url: "https://restaurant.example", base: "/" },
  sanity: { dataset: "production" },
  theme: {
    name: "neutral",
    paper: "#f7f7f5",
    ink: "#222222",
    accent: "#555555",
  },
  deployment: { provider: "static" },
} satisfies RestaurantConfigInput;
