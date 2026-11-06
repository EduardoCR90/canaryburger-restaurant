import { test } from "node:test";
import assert from "node:assert/strict";
import { templateReleaseSchema, provisioningSpec } from "../src/types/platform";
import { assertCompatible } from "../tools/update-instance.mjs";
const release = {
  template_key: "restaurant-editorial",
  version: "0.3.0",
  source_commit: "a".repeat(40),
  distribution_hash: "b".repeat(64),
  configuration_contract: 1,
  content_contract: "salitre-v1",
  visual_contract: 2,
};
const id = "00000000-0000-4000-8000-000000000001";
const spec = {
  contract_version: 1,
  request_id: id,
  restaurant: { id, name: "Synthetic", slug: "synthetic" },
  template: release,
  site: {
    repository: "owner/synthetic",
    origin: "https://synthetic.example",
    base: "/",
    custom_domain: "synthetic.example",
  },
  sanity: {
    integration_id: id,
    project_id: "synthetic",
    dataset: "production",
  },
  visual: { preset: "modern" },
  modules: [{ key: "content_management", granted: true, enabled: true }],
  assignments: [{ user_id: id, role: "restaurant_owner" }],
};
test("provisioning is a strict, credential-free specification, not resource creation or authorization", () => {
  assert.deepEqual(provisioningSpec.parse(spec), spec);
  assert.equal(
    provisioningSpec.safeParse({ ...spec, actor_id: id }).success,
    false,
  );
  assert.equal(
    provisioningSpec.safeParse({
      ...spec,
      sanity: { ...spec.sanity, token: "never" },
    }).success,
    false,
  );
  assert.equal(
    provisioningSpec.safeParse({
      ...spec,
      assignments: [{ user_id: id, role: "platform_admin" }],
    }).success,
    false,
  );
  assert.equal(
    provisioningSpec.safeParse({
      ...spec,
      modules: [{ key: "content_management", granted: false, enabled: true }],
    }).success,
    false,
  );
  assert.equal(
    provisioningSpec.safeParse({
      ...spec,
      modules: [spec.modules[0], spec.modules[0]],
    }).success,
    false,
  );
});
test("domain and origin cannot inject URLs, credentials, IP addresses or unrelated hosts", () => {
  for (const domain of [
    "https://example.com",
    "localhost",
    "127.0.0.1",
    "*.example.com",
    "a.example/anything",
    "a.local",
  ])
    assert.equal(
      provisioningSpec.safeParse({
        ...spec,
        site: { ...spec.site, custom_domain: domain },
      }).success,
      false,
    );
  assert.equal(
    provisioningSpec.safeParse({
      ...spec,
      site: { ...spec.site, origin: "https://user:secret@synthetic.example" },
    }).success,
    false,
  );
  assert.equal(
    provisioningSpec.safeParse({
      ...spec,
      site: { ...spec.site, origin: "https://other.example" },
    }).success,
    false,
  );
});
test("release identities require immutable commits, integrity and supported contracts", () => {
  assert.deepEqual(templateReleaseSchema.parse(release), release);
  for (const value of [
    { ...release, source_commit: "main" },
    { ...release, version: "latest" },
    { ...release, visual_contract: 3 },
    { ...release, script: "sh install" },
  ])
    assert.equal(templateReleaseSchema.safeParse(value).success, false);
});
test("updates reject incompatible contracts, downgrades and unreviewed major migrations", () => {
  const meta = {
    ...release,
    format: 1,
    updater_contract: 1,
    minimum_installed_version: "0.2.0",
  };
  assert.doesNotThrow(() =>
    assertCompatible({ version: "0.2.0" }, meta, release),
  );
  for (const invalid of [
    { ...meta, visual_contract: 3 },
    { ...meta, template_key: "other" },
    { ...meta, version: "1.0.0" },
    { ...meta, version: "0.1.0" },
    { ...meta, minimum_installed_version: "0.3.0" },
  ])
    assert.throws(() =>
      assertCompatible({ version: "0.2.0" }, invalid, release),
    );
});
