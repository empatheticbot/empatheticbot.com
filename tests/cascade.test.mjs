import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const [page, script, headers] = await Promise.all([
  readFile(new URL("../public/reviews/cascade/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/reviews/cascade/review.js", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
]);

const auditAssets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "concept-2-desktop.webp",
  "concept-2-mobile.webp",
  "concept-3-desktop.webp",
  "concept-3-mobile.webp",
  "og-cascade-redesign.png",
];

describe("Cascade outreach review", () => {
  test("keeps the prospect-specific page out of search indexes", () => {
    assert.match(page, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(headers, /\/reviews\/\*\s+X-Robots-Tag: noindex, nofollow/);
  });

  test("includes the captured evidence and every responsive concept", async () => {
    for (const asset of auditAssets) {
      await access(new URL(`../public/reviews/cascade/assets/${asset}`, import.meta.url));
      assert.match(page, new RegExp(`/reviews/cascade/assets/${asset}`));
    }
  });

  test("presents claims with audit scope and measurement caveats", () => {
    assert.match(page, /Automated scores are a useful signal, not a certification/);
    assert.match(page, /About this review:/);
    assert.match(
      page,
      /not a complete accessibility,\s+security, legal, clinical-content, or authenticated-system audit/,
    );
    assert.match(page, /Performance\s+is a preservation goal, not the primary redesign argument/);
  });

  test("ends with a useful, low-pressure next step", () => {
    assert.match(page, /<h2>I hope this is useful\.<\/h2>/);
    assert.match(page, />\s*Talk through the review<\/a\s*>/);
    assert.doesNotMatch(page, /There’s no pitch attached to this/);
    assert.doesNotMatch(page, /interested in building out a freelance business/);
  });

  test("opens the concept images in an accessible native dialog", () => {
    assert.equal(page.match(/class="cascade-concept-button/g)?.length, 6);
    assert.match(
      page,
      /<dialog class="cascade-lightbox" aria-labelledby="cascade-lightbox-title">/,
    );
    assert.match(page, /class="cascade-lightbox-close" aria-label="Close image"/);
    assert.match(script, /cascadeLightbox\.showModal\(\)/);
    assert.match(script, /cascadeLightbox\.close\(\)/);
  });

  test("uses Direction 1 for complete social sharing previews", () => {
    const image = "https://empatheticbot.com/reviews/cascade/assets/og-cascade-redesign.png";
    assert.match(page, new RegExp(`<meta\\s+property="og:image"\\s+content="${image}"`));
    assert.match(page, new RegExp(`<meta\\s+name="twitter:image"\\s+content="${image}"`));
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /A trusted partner in your care/);
  });
});
