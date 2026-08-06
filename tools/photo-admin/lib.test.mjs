import test from "node:test";
import assert from "node:assert/strict";
import {
  envStatus,
  extensionFor,
  makeObjectKey,
  normalizePublicUrl,
  parseTags,
  slugify,
} from "./lib.mjs";

test("slugify creates stable ASCII slugs", () => {
  assert.equal(slugify("Light Through Blinds"), "light-through-blinds");
  assert.equal(slugify("一场雨", "photo-20260806"), "photo-20260806");
});

test("object keys are grouped by year and month", () => {
  assert.equal(
    makeObjectKey({ slug: "rain", date: "2026-08-06", suffix: "a1b2c3d4", extension: ".webp" }),
    "photos/2026/08/rain-a1b2c3d4.webp"
  );
});

test("image metadata helpers normalize input", () => {
  assert.equal(extensionFor("portrait.jpeg", "image/jpeg"), ".jpg");
  assert.deepEqual(parseTags("night, rain,  memory "), ["night", "rain", "memory"]);
  assert.equal(normalizePublicUrl("https://media.zhanbo.art///"), "https://media.zhanbo.art");
});

test("environment status never exposes values", () => {
  const status = envStatus({ CLOUDFLARE_ACCOUNT_ID: "secret-account-id" });
  assert.equal(status.configured, false);
  assert.ok(status.missing.includes("CLOUDFLARE_R2_BUCKET"));
  assert.equal(JSON.stringify(status).includes("secret-account-id"), false);
});
