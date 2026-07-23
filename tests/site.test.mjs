import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const [index, styles, headers, mainScript, privacy, thanks, notFound] = await Promise.all([
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/style.css", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/main.js", import.meta.url), "utf8"),
  readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
  readFile(new URL("../public/thanks.html", import.meta.url), "utf8"),
  readFile(new URL("../public/404.html", import.meta.url), "utf8"),
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

describe("404 animation", () => {
  test("starts the staged bot and 404 together without mutating animation timestamps", () => {
    assert.match(
      mainScript,
      /errorPage\.classList\.add\("is-playing"\)[\s\S]*stage\?\.classList\.add\("is-playing"\)/,
    );
    assert.doesNotMatch(mainScript, /\.startTime\s*=/);
  });

  test("measures the returning 404 against the rounded head instead of the antenna", () => {
    assert.match(notFound, /class="error-bot-head"/);
    assert.match(mainScript, /querySelector\("\.error-bot-head"\)/);
    assert.match(styles, /66\.7%\s*\{\s*transform: translateY\(var\(--bonk\)\)/s);
    assert.match(styles, /68\.2%\s*\{\s*transform: translateY\(var\(--bonk\)\)/s);
  });

  test("returns the finished 404 to normal document scrolling", () => {
    assert.match(
      mainScript,
      /addEventListener\([\s\S]*"animationend"[\s\S]*classList\.replace\(\s*"has-fall-stage",\s*"fall-complete"[\s\S]*stage\.remove\(\)/,
    );
    assert.match(
      styles,
      /\.error-page\.fall-complete \.error-code\s*\{[^}]*visibility:\s*visible;[^}]*animation:\s*none;/s,
    );
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
      /if \(!response\.ok \|\| !result\?\.ok\)[\s\S]*window\.location\.replace\("\/thanks"\)/,
    );
  });

  test("leaves no spent form for the Back button to return to", () => {
    assert.doesNotMatch(mainScript, /window\.location\.assign\("\/thanks"\)/);
  });

  test("provides an accessible, private confirmation page with a happy bot", () => {
    assert.match(thanks, /<meta name="robots" content="noindex"/);
    assert.match(thanks, /<h1 id="thanks-heading">Thanks — your message is on its way\.<\/h1>/);
    assert.match(thanks, /<h2>What happens next<\/h2>/);
    assert.match(thanks, /<link rel="canonical" href="https:\/\/empatheticbot\.com\/thanks" \/>/);
    assert.match(thanks, /aria-label="The empatheticbot mascot, smiling"/);
    // Inline, so the heart beats and the antenna pulses as on every other page.
    assert.match(thanks, /class="thanks-bot"/);
    assert.match(thanks, /M7\.6,19\.6 Q11,14\.6 14\.4,19\.6/);
  });
});

describe("shared chrome", () => {
  test("every page carries the same footer", () => {
    const footer = (page) => page.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1];
    const home = footer(index);
    assert.ok(home);
    for (const page of [privacy, thanks, notFound]) {
      assert.equal(footer(page), home);
    }
  });
});
