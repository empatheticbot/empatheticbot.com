import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const page = await readFile(
  new URL("../public/reviews/integrity-landscape/index.html", import.meta.url),
  "utf8",
);

const auditAssets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "og-integrity-landscape-redesign.png",
];

// Enough of the PNG and simple-lossy WebP headers to read a size. Chrome ignores
// <meta name="viewport"> outside device emulation, so a narrow window silently
// captures a squeezed desktop layout at a different height than the markup claims.
function imageSize(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  const riff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const vp8 = buffer.subarray(12, 16).toString("ascii") === "VP8 ";
  assert.ok(riff && vp8, "expected a PNG or simple lossy WebP");

  return {
    width: buffer.readUInt16LE(26) & 0x3fff,
    height: buffer.readUInt16LE(28) & 0x3fff,
  };
}

describe("Integrity Landscape outreach review", () => {
  test("declares the dimensions the assets actually have", async () => {
    for (const asset of auditAssets.filter((name) => name.endsWith(".webp"))) {
      const buffer = await readFile(
        new URL(`../public/reviews/integrity-landscape/assets/${asset}`, import.meta.url),
      );
      const { width, height } = imageSize(buffer);
      const tag = page.match(new RegExp(`src="[^"]*${asset}"[^>]*?>`, "s"))?.[0] ?? "";

      assert.equal(Number(tag.match(/width="(\d+)"/)?.[1]), width, `${asset} width`);
      assert.equal(Number(tag.match(/height="(\d+)"/)?.[1]), height, `${asset} height`);
    }
  });

  test("includes the captured evidence and the responsive concept", async () => {
    for (const asset of auditAssets) {
      await access(
        new URL(`../public/reviews/integrity-landscape/assets/${asset}`, import.meta.url),
      );
      assert.match(page, new RegExp(`/reviews/integrity-landscape/assets/${asset}`));
    }

    // One direction, shown at desktop and phone width.
    assert.equal(page.match(/class="review-concept-button/g)?.length, 2);
  });

  test("presents claims with audit scope and measurement caveats", () => {
    assert.match(
      page,
      /not a complete\s+accessibility, security, legal, or authenticated-system audit/,
    );
    assert.match(page, /Lighthouse 12\.8\.2 with\s+simulated mobile throttling/);
    // The 17-missing-descriptions claim is only usable because all 112 were read.
    assert.match(page, /All 112 pages in the sitemap were also fetched and read/);
    // Photo dates are inferred, and the page has to say so.
    assert.match(page, /Photograph dates are\s+inferred from filenames/);
  });

  test("leads with the finding that costs a visitor the most", () => {
    assert.match(page, /<h3>Let people zoom in\.<\/h3>/);
    assert.match(page, /width=1160, maximum-scale=1\.0/);
    assert.match(page, /maximum-scale=1\.0, user-scalable=no/);
    // The two sites diverging is the finding the evidence images carry.
    assert.match(page, /<strong>no photographs of finished work at all<\/strong>/);
    assert.match(page, /Disallow: \/index\.php\?view=mobile/);
  });

  test("shows the two sites as two sites, not one page at two widths", () => {
    assert.match(page, /These are not the same page at two widths/);
    assert.match(page, /<figcaption>The separate mobile site at 390 pixels wide<\/figcaption>/);
  });

  test("credits the maintenance before naming what drifted", () => {
    // This is the best-kept site in the batch; the framing section has to lead.
    const framing = page.indexOf('class="review-section review-framing"');
    const findings = page.indexOf('id="findings"');
    assert.ok(framing > -1 && findings > framing);
    assert.match(page, /<h2>Somebody has been looking after this\.<\/h2>/);
  });

  test("labels the concept as exploratory and says which words are mine", () => {
    assert.match(page, /This is an exploratory concept, not a final design/);
    assert.match(
      page,
      /The captions on the gallery images are mine and would be yours to\s+correct/,
    );
  });

  test("ends with a useful, low-pressure next step", () => {
    assert.match(page, /<h2>I hope this is useful\.<\/h2>/);
    assert.match(page, />\s*Talk through the review<\/a\s*>/);
    assert.doesNotMatch(page, /There’s no pitch attached to this/);
  });

  test("names the price and its limits without displacing the review", () => {
    assert.match(page, /<span>\$200<\/span> per month/);
    assert.match(page, /\$2,400 commitment, billed as twelve monthly/);
    assert.match(page, /No setup fee/);
    // The photography the concept implies is not inside the subscription.
    assert.match(page, /that is a photographer you would pay directly/);

    // The pitch stays out of the hero: the page still opens as a review.
    const hero = page.match(/<section class="review-hero">[\s\S]*?<\/section>/)[0];
    assert.doesNotMatch(hero, /\$\d/);
  });

  test("uses the concept for complete social sharing previews", () => {
    const image =
      "https://empatheticbot.com/reviews/integrity-landscape/assets/og-integrity-landscape-redesign.png";
    assert.match(page, new RegExp(`<meta\\s+property="og:image"\\s+content="${image}"`));
    assert.match(page, new RegExp(`<meta\\s+name="twitter:image"\\s+content="${image}"`));
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /Thirty-seven years of yards you can walk through/);
  });
});
