import { createClient } from "@sanity/client";
export function createContentClient(config: {
  projectId: string;
  dataset: string;
  token?: string;
}) {
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    token: config.token || undefined,
    apiVersion: "2025-02-19",
    perspective: "published",
    useCdn: false,
    timeout: 15000,
    maxRetries: 0,
  });
}
