import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const page = await readFile(
  new URL("../public/reviews/hazzouri/index.html", import.meta.url),
  "utf8",
);

const auditAssets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "concept-2-desktop.webp",
  "concept-2-mobile.webp",
  "concept-3-desktop.webp",
  "concept-3-mobile.webp",
  "og-hazzouri-redesign.png",
];

describe("Hazzouri outreach review", () => {
  test("includes the captured evidence and every responsive concept", async () => {
    for (const asset of auditAssets) {
      await access(new URL(`../public/reviews/hazzouri/assets/${asset}`, import.meta.url));
      assert.match(page, new RegExp(`/reviews/hazzouri/assets/${asset}`));
    }

    assert.equal(page.match(/class="review-concept-button/g)?.length, 6);
  });

  test("presents claims with audit scope and measurement caveats", () => {
    assert.match(
      page,
      /not\s+a complete accessibility, security, legal, tax-content, or authenticated-system audit/,
    );
    // The findings lean on a throttled mobile run; the conditions have to travel with them.
    assert.match(page, /Lighthouse’s mobile\s+profile/);
    assert.match(page, /throttled connection of roughly 1\.6 Mbps/);
    // Stability is the one number the site already wins on; say so rather than bury it.
    assert.match(page, /That is a real strength and a\s+preservation goal/);
  });

  test("states that nothing was submitted or accessed beyond a visitor's view", () => {
    assert.match(page, /No form was submitted/);
  });

  test("ends with a useful, low-pressure next step", () => {
    assert.match(page, /<h2>I hope this is useful\.<\/h2>/);
    assert.match(page, />\s*Talk through the review<\/a\s*>/);
    assert.match(page, /you’re welcome to\s+take this list to anyone/);
    assert.doesNotMatch(page, /limited time|act now|discount|follow up/i);
  });

  test("uses the cover card for complete social sharing previews", () => {
    const image = "https://empatheticbot.com/reviews/hazzouri/assets/og-hazzouri-redesign.png";
    assert.match(page, new RegExp(`<meta\\s+property="og:image"\\s+content="${image}"`));
    assert.match(page, new RegExp(`<meta\\s+name="twitter:image"\\s+content="${image}"`));
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /A clearer front door for Hazzouri Accounting/);
  });
});
