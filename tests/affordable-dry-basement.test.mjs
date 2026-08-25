import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const page = await readFile(
  new URL("../public/reviews/affordable-dry-basement/index.html", import.meta.url),
  "utf8",
);

const auditAssets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "og-affordable-dry-basement-redesign.png",
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

describe("Affordable Dry Basement outreach review", () => {
  test("declares the dimensions the assets actually have", async () => {
    for (const asset of auditAssets.filter((name) => name.endsWith(".webp"))) {
      const buffer = await readFile(
        new URL(`../public/reviews/affordable-dry-basement/assets/${asset}`, import.meta.url),
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
        new URL(`../public/reviews/affordable-dry-basement/assets/${asset}`, import.meta.url),
      );
      assert.match(page, new RegExp(`/reviews/affordable-dry-basement/assets/${asset}`));
    }

    // One direction, shown at desktop and phone width.
    assert.equal(page.match(/class="review-concept-button/g)?.length, 2);
  });

  test("presents claims with audit scope and measurement caveats", () => {
    assert.match(
      page,
      /not a complete\s+accessibility, security, legal, advertising, or authenticated-system audit/,
    );
    assert.match(page, /Lighthouse 12\.8\.2 with\s+simulated mobile throttling/);
    // Sixteen pages read by hand is what makes the sitemap-wide claim usable.
    assert.match(page, /All sixteen pages in the sitemap were also read by hand/);
    // The rating in the concept is theirs, not a measurement taken here.
    assert.match(
      page,
      /come from the company’s own public listings, not from\s+anything measured here/,
    );
  });

  test("leads with the finding that costs a visitor the most", () => {
    assert.match(page, /<h3>Say where you are\.<\/h3>/);
    assert.match(page, /<strong>United States<\/strong>/);
    assert.match(page, /“Michigan” never appears\. “Westland” appears once,<\/strong>/);
    assert.match(page, /Testimonals/);
  });

  test("keeps the advertising observation a question rather than a claim", () => {
    // An uncaught error is checkable; lost conversions are not, from outside.
    assert.match(page, /worth checking rather\s+than assuming/);
    assert.match(page, /It is worth confirming your conversions are still being\s+recorded/);
  });

  test("labels the concept as exploratory with placeholder review cards", () => {
    assert.match(page, /This is an exploratory concept, not a final design/);
    assert.match(page, /The\s+review cards are placeholders/);
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
    // Booking and payments sit outside the subscription and have to be named here.
    assert.match(page, /a third-party service you would pay for directly/);

    // The pitch stays out of the hero: the page still opens as a review.
    const hero = page.match(/<section class="review-hero">[\s\S]*?<\/section>/)[0];
    assert.doesNotMatch(hero, /\$\d/);
  });

  test("uses the concept for complete social sharing previews", () => {
    const image =
      "https://empatheticbot.com/reviews/affordable-dry-basement/assets/og-affordable-dry-basement-redesign.png";
    assert.match(page, new RegExp(`<meta\\s+property="og:image"\\s+content="${image}"`));
    assert.match(page, new RegExp(`<meta\\s+name="twitter:image"\\s+content="${image}"`));
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /Basement waterproofing in Westland, Michigan/);
  });
});
