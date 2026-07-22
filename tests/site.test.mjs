import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const [index, styles, headers, mainScript, privacy] = await Promise.all([
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/style.css", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/main.js", import.meta.url), "utf8"),
  readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
]);

describe("progressive enhancement", () => {
  test("reveal content is visible unless JavaScript explicitly enables the animation", () => {
    assert.doesNotMatch(styles, /(?:^|})\s*\.reveal\s*\{[^}]*opacity:\s*0/s);
    assert.match(styles, /\.reveal-enabled \.reveal\s*\{[^}]*opacity:\s*0/s);
  });

  test("the portrait is served as a local asset", () => {
    assert.match(index, /src="assets\/steve-ledsworth\.jpg"/);
    assert.doesNotMatch(index, /src="https:\/\/sledsworth\.com\/[^" ]+avatar/);
  });
});

describe("security policy", () => {
  test("allows the current inline structured data and no other inline script", () => {
    const structuredData = index.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    assert.ok(structuredData);
    const hash = `sha256-${createHash("sha256").update(structuredData).digest("base64")}`;
    assert.match(headers, new RegExp(hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});

describe("Turnstile accessibility and privacy", () => {
  test("only puts the Turnstile iframe in the tab order for an interactive challenge", () => {
    assert.match(index, /class="turnstile-wrap turnstile-pending" inert/);
    assert.match(index, /data-before-interactive-callback="handleTurnstileInteractive"/);
    assert.match(index, /data-after-interactive-callback="handleTurnstileInteractiveEnd"/);
    assert.match(mainScript, /handleTurnstileInteractive[\s\S]*turnstileWrap\.inert = false/);
    assert.match(mainScript, /handleTurnstileInteractiveEnd[\s\S]*turnstileWrap\.inert = true/);
  });

  test("links to Cloudflare's Turnstile privacy disclosure", () => {
    assert.match(privacy, /Cloudflare Turnstile/);
    assert.match(privacy, /https:\/\/www\.cloudflare\.com\/turnstile-privacy-policy\//);
  });
});
