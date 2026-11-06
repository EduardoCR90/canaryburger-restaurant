import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("instance.manifest.json", "utf8"));
process.env.DEPLOYMENT_REPORT_URL = manifest.deployment.publication_endpoint;
process.env.PUBLICATION_TRACKING = "true";
process.env.TEMPLATE_VERSION_TRACKING = "true";
process.env.ALLOW_EMPTY_PUBLICATION_EVIDENCE = "true";
const { runReportCli } =
  await import("../vendor/restaurant-template/src/ops/report-deployment.mjs");
await runReportCli();
