import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { templateIdentity } from "./template-evidence.mjs";
export function fingerprint(
  project: string,
  dataset: string,
  id: string,
  revision: string,
) {
  return createHash("sha256")
    .update(JSON.stringify([project, dataset, id, revision]))
    .digest("hex");
}
export function evidence(project: string, dataset: string, raw: unknown) {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("publicationRevisions" in raw) ||
    !Array.isArray(raw.publicationRevisions)
  )
    throw new Error("Falta evidencia de las revisiones de build");
  if (raw.publicationRevisions.length > 10000)
    throw new Error("Límite de evidencia superado");
  return [
    ...new Set(
      raw.publicationRevisions.map((doc: unknown) => {
        if (
          typeof doc !== "object" ||
          doc === null ||
          !("_id" in doc) ||
          !("_rev" in doc) ||
          typeof doc._id !== "string" ||
          typeof doc._rev !== "string" ||
          doc._id.startsWith("drafts.") ||
          doc._id.startsWith("versions.")
        )
          throw new Error("Revisión de build inválida");
        return fingerprint(project, dataset, doc._id, doc._rev);
      }),
    ),
  ].sort();
}
export async function recordDeploymentEvidence(
  project: string,
  dataset: string,
  raw: unknown,
) {
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.PUBLICATION_TRACKING !== "true"
  )
    return;
  await writeFile(
    ".publication-build.json",
    JSON.stringify({
      runId: process.env.GITHUB_RUN_ID,
      attempt: process.env.GITHUB_RUN_ATTEMPT,
      sha: process.env.GITHUB_SHA,
      fingerprints: evidence(project, dataset, raw),
      ...(process.env.TEMPLATE_VERSION_TRACKING === "true"
        ? { template: await templateIdentity() }
        : {}),
    }),
    { mode: 0o600 },
  );
}
