import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
export function distributionHash(lock) {
  return sha256(
    JSON.stringify({
      repository: lock.repository,
      version: lock.version,
      commit: lock.commit,
      files: Object.fromEntries(
        Object.entries(lock.files).sort(([a], [b]) =>
          a < b ? -1 : a > b ? 1 : 0,
        ),
      ),
    }),
  );
}
/** @param {(path: string, encoding?: 'utf8') => Promise<string | Uint8Array>} [read] */
export async function templateIdentity(read = readFile) {
  const lock = JSON.parse(await read("template.lock.json", "utf8"));
  if (
    lock.format !== 1 ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(lock.repository) ||
    !/^[a-f0-9]{40}$/.test(lock.commit)
  )
    throw new Error("Invalid template lock");
  for (const [file, hash] of Object.entries(lock.files)) {
    if (
      !/^[A-Za-z0-9_./-]+$/.test(file) ||
      file.startsWith("/") ||
      file.split("/").includes("..") ||
      !/^[a-f0-9]{64}$/.test(hash)
    )
      throw new Error("Invalid distributed file");
    if (sha256(await read("vendor/restaurant-template/" + file)) !== hash)
      throw new Error("Template integrity mismatch");
  }
  const release = JSON.parse(
    await read("vendor/restaurant-template/template.release.json", "utf8"),
  );
  if (
    !lock.files["template.release.json"] ||
    release.version !== lock.version ||
    release.format !== 1
  )
    throw new Error("Release mismatch");
  return {
    template_key: release.template_key,
    version: release.version,
    source_commit: lock.commit,
    distribution_hash: distributionHash(lock),
    configuration_contract: release.configuration_contract,
    content_contract: release.content_contract,
    visual_contract: release.visual_contract,
  };
}
