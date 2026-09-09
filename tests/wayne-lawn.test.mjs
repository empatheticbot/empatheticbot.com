import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const page = await readFile(
  new URL("../public/reviews/wayne-lawn/index.html", import.meta.url),
  "utf8",
);
const assets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "og-wayne-lawn-redesign.png",
];

function imageSize(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8 ");
  return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
}

describe("Wayne Lawn outreach review", () => {
  test("declares the dimensions the assets actually have", async () => {
    for (const asset of assets.filter((name) => name.endsWith(".webp"))) {
      const buffer = await readFile(
        new URL(`../public/reviews/wayne-lawn/assets/${asset}`, import.meta.url),
      );
      const expected = imageSize(buffer);
      const tag = page.match(new RegExp(`src="[^"]*${asset}"[^>]*?>`, "s"))?.[0] ?? "";
      assert.equal(Number(tag.match(/width="(\d+)"/)?.[1]), expected.width, `${asset} width`);
      assert.equal(Number(tag.match(/height="(\d+)"/)?.[1]), expected.height, `${asset} height`);
    }
  });

  test("includes current evidence, responsive concepts, and complete sharing metadata", async () => {
    for (const asset of assets) {
      await access(new URL(`../public/reviews/wayne-lawn/assets/${asset}`, import.meta.url));
      assert.match(page, new RegExp(`/reviews/wayne-lawn/assets/${asset}`));
    }
    assert.equal(page.match(/class="review-concept-button/g)?.length, 2);
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /The right machine, backed by people who keep it running/);
  });

  test("leads with the customer-path finding and preserves the measured evidence", () => {
    assert.match(page, /<h3>Put shopping and service ahead of the campaign carousel\.<\/h3>/);
    assert.match(page, /257 results, 24 at a time, across eleven pages/);
    assert.match(page, /tel:\[site_info_phone\]/);
    assert.match(page, /fourteen images have no useful alternative text/);
    assert.match(page, /forty-five links have no text/);
  });

  test("states scope, uncertainty, and concept limits", () => {
    assert.match(
      page,
      /not a complete accessibility, security, legal, financing, inventory, warranty, or authenticated-system audit/,
    );
    assert.match(page, /DOM counts can include hidden carousel clones/);
    assert.match(page, /This is an exploratory concept, not a final design/);
    assert.match(page, /does not claim any item is in stock or invent final pricing/);
    assert.match(page, /Automated signals are useful for prioritization, not certification/);
  });

  test("keeps the offer after the roadmap and ends with a low-pressure next step", () => {
    assert.ok(page.indexOf("review-offer") > page.indexOf("review-roadmap"));
    assert.match(page, /<span>\$200<\/span> per month/);
    assert.match(page, /\$2,400 commitment, billed as twelve monthly payments/);
    assert.match(page, /No setup fee/);
    assert.match(page, /third-party services you would pay for directly/);
    assert.match(page, /<h2>I hope this is useful\.<\/h2>/);
    assert.match(page, />Talk through the review<\/a>/);
    const hero = page.match(/<section class="review-hero">[\s\S]*?<\/section>/)?.[0] ?? "";
    assert.doesNotMatch(hero, /\$\d/);
  });
});
