import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function readBuiltPage(path) {
  return readFile(new URL(`../dist/public/${path}`, import.meta.url), "utf8");
}

function canonicalHref(html) {
  const canonicalTag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i);
  assert.ok(canonicalTag, "page must contain a canonical link");

  const href = canonicalTag[0].match(/\bhref=["']([^"']+)["']/i);
  assert.ok(href, "canonical link must contain an href");
  return href[1];
}

test("certificate verification route is prerendered with its own canonical", async () => {
  const html = await readBuiltPage("verify/index.html");

  assert.equal(canonicalHref(html), "https://www.paedsresus.com/verify");
  assert.match(html, /<title>Verify certificate — Paeds Resus<\/title>/);
  assert.match(html, /Verify Certificate/);
  assert.match(html, /CERT-2026-001234/);
  assert.match(html, /John Doe/);
});

test("homepage canonical remains unchanged", async () => {
  const html = await readBuiltPage("index.html");

  assert.equal(canonicalHref(html), "https://www.paedsresus.com/");
});
