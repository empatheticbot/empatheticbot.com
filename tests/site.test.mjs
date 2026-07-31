import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const [index, styles, headers, mainScript, privacy, thanks, notFound, favicon] = await Promise.all([
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/style.css", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/main.js", import.meta.url), "utf8"),
  readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
  readFile(new URL("../public/thanks.html", import.meta.url), "utf8"),
  readFile(new URL("../public/404.html", import.meta.url), "utf8"),
  readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
]);

const socialImagePaths = {
  index: new URL("../public/assets/og-home.png", import.meta.url),
  privacy: new URL("../public/assets/og-privacy.png", import.meta.url),
  thanks: new URL("../public/assets/og-thanks.png", import.meta.url),
  notFound: new URL("../public/assets/og-404.png", import.meta.url),
};

const readPngDimensions = async (path) => {
  const png = await readFile(path);
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

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

describe("launch polish", () => {
  test("uses stationary, pointer-aware shine effects instead of upward hover movement", () => {
    assert.doesNotMatch(styles, /\.(?:button|compare-card|work-card):hover\s*{[^}]*translateY/s);
    assert.match(styles, /\.button:hover\s*{\s*transform: scale/s);
    assert.doesNotMatch(styles, /\.(?:compare-card|work-card):hover\s*{[^}]*transform/s);
    assert.match(mainScript, /style\.setProperty\("--shine-x"/);
    assert.match(mainScript, /style\.setProperty\("--shine-y"/);
    assert.match(mainScript, /const perimeterPoint = \(position\)/);
    assert.match(mainScript, /target \+= Math\.round\(\(state\.current - target\) \/ 4\) \* 4/);
    assert.match(mainScript, /state\.frame = requestAnimationFrame\(animateShine\)/);
  });

  test("uses lightly styled placeholder examples in the inquiry form", () => {
    assert.equal(index.match(/placeholder=/g)?.length, 4);
    assert.doesNotMatch(index, /class="field-example"/);
    assert.match(styles, /input::placeholder,[\s\S]*var\(--ink-soft\) 72%/);
  });

  test("includes Skyglow and keeps the personal site out of selected work", () => {
    assert.match(index, /href="https:\/\/skyglow\.tech\/"/);
    assert.match(index, /href="https:\/\/sledsworth\.com\/about\/"/);
    assert.doesNotMatch(index, /class="work-card reveal" href="https:\/\/sledsworth\.com\//);
    assert.match(
      index,
      /class="work-grid">[\s\S]*skyglow\.tech[\s\S]*movie\.surf[\s\S]*waffle\.how[\s\S]*<\/div>/,
    );
  });

  test("brightens every bot treatment in dark mode", () => {
    assert.match(styles, /#body-gradient stop:first-child\s*{\s*stop-color: #ff7a70;/s);
    assert.match(styles, /#body-gradient stop:last-child\s*{[^}]*stop-opacity: 1;/s);
    assert.match(
      styles,
      /\.wordmark-icon, \.footer-bot, \.thanks-bot, \.error-bot\)\s*{[^}]*drop-shadow/s,
    );
    assert.match(favicon, /@media \(prefers-color-scheme: dark\)/);
    assert.match(favicon, /class="bot-body"/);
  });
});

describe("social previews", () => {
  const pages = [
    ["index", index, "https://empatheticbot.com/", "https://empatheticbot.com/assets/og-home.png"],
    [
      "privacy",
      privacy,
      "https://empatheticbot.com/privacy",
      "https://empatheticbot.com/assets/og-privacy.png",
    ],
    [
      "thanks",
      thanks,
      "https://empatheticbot.com/thanks",
      "https://empatheticbot.com/assets/og-thanks.png",
    ],
    [
      "notFound",
      notFound,
      "https://empatheticbot.com/404",
      "https://empatheticbot.com/assets/og-404.png",
    ],
  ];

  test("every page supplies complete Open Graph and Twitter/X metadata", () => {
    for (const [, page, url, image] of pages) {
      assert.match(page, new RegExp(`<meta property="og:url" content="${url}" \\/>`));
      assert.match(page, /property="og:title"[\s\S]*?content="[^"]+"/);
      assert.match(page, /property="og:description"/);
      assert.match(page, new RegExp(`<meta property="og:image" content="${image}" \\/>`));
      assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
      assert.match(page, /<meta property="og:image:height" content="630" \/>/);
      assert.match(page, /property="og:image:alt"/);
      assert.match(page, /<meta name="twitter:card" content="summary_large_image" \/>/);
      assert.match(page, /name="twitter:title"/);
      assert.match(page, /name="twitter:description"/);
      assert.match(page, /name="twitter:image"/);
      assert.match(page, /name="twitter:image:alt"/);
    }
  });

  test("every social image is a 1200 by 630 PNG", async () => {
    for (const path of Object.values(socialImagePaths)) {
      assert.deepEqual(await readPngDimensions(path), { width: 1200, height: 630 });
    }
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
