import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const [index, styles, headers, mainScript, privacy, thankYou, happyBot] = await Promise.all([
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/style.css", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/main.js", import.meta.url), "utf8"),
  readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
  readFile(new URL("../public/thank-you.html", import.meta.url), "utf8"),
  readFile(new URL("../public/assets/happy-bot.svg", import.meta.url), "utf8"),
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
    assert.match(index, /data-execution="execute"/);
    assert.match(index, /data-callback="handleTurnstileSuccess"/);
    assert.match(index, /data-before-interactive-callback="handleTurnstileInteractive"/);
    assert.match(index, /data-after-interactive-callback="handleTurnstileInteractiveEnd"/);
    assert.match(mainScript, /handleTurnstileInteractive[\s\S]*turnstileWrap\.inert = false/);
    assert.match(mainScript, /window\.turnstile\.execute\("#contact-turnstile"\)/);
  });

  test("uses Turnstile test keys only on local and isolated test hosts", () => {
    assert.match(mainScript, /empatheticbot-com-test\.empatheticbot\.workers\.dev/);
    assert.match(mainScript, /turnstileTestHostnames\.has\(window\.location\.hostname\)/);
  });

  test("links to Cloudflare's Turnstile privacy disclosure", () => {
    assert.match(privacy, /Cloudflare Turnstile/);
    assert.match(privacy, /https:\/\/www\.cloudflare\.com\/turnstile-privacy-policy\//);
  });
});

describe("contact confirmation", () => {
  test("redirects to next steps only after the contact API succeeds", () => {
    assert.match(
      mainScript,
      /if \(!response\.ok \|\| !result\?\.ok\)[\s\S]*window\.location\.assign\("\/thank-you"\)/,
    );
  });

  test("provides an accessible, private confirmation page with a happy bot", () => {
    assert.match(thankYou, /<meta name="robots" content="noindex"/);
    assert.match(thankYou, /<h1 id="thanks-heading">Thanks — your message is on its way\.<\/h1>/);
    assert.match(thankYou, /<h2>What happens next<\/h2>/);
    assert.match(thankYou, /src="\/assets\/happy-bot\.svg"/);
    assert.match(thankYou, /alt="The empatheticbot mascot smiling"/);
    assert.match(happyBot, /M7\.6,19\.6 Q11,14\.6 14\.4,19\.6/);
  });
});
