import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const page = await readFile(
  new URL("../public/reviews/jump-party/index.html", import.meta.url),
  "utf8",
);
const assets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "og-jump-party-redesign.png",
];

function imageSize(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8 ");
  return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
}

describe("Jump Party outreach review", () => {
  test("declares the dimensions the assets actually have", async () => {
    for (const asset of assets.filter((name) => name.endsWith(".webp"))) {
      const buffer = await readFile(
        new URL(`../public/reviews/jump-party/assets/${asset}`, import.meta.url),
      );
      const expected = imageSize(buffer);
      const tag = page.match(new RegExp(`src="[^"]*${asset}"[^>]*?>`, "s"))?.[0] ?? "";
      assert.equal(Number(tag.match(/width="(\d+)"/)?.[1]), expected.width, `${asset} width`);
      assert.equal(Number(tag.match(/height="(\d+)"/)?.[1]), expected.height, `${asset} height`);
    }
  });

  test("includes current evidence, responsive concepts, and complete sharing metadata", async () => {
    for (const asset of assets) {
      await access(new URL(`../public/reviews/jump-party/assets/${asset}`, import.meta.url));
      assert.match(page, new RegExp(`/reviews/jump-party/assets/${asset}`));
    }
    assert.equal(page.match(/class="review-concept-button/g)?.length, 2);
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /Jump Party redesign concept headed Make the party easy/);
  });

  test("leads with the observed landing defect and measured mobile state", () => {
    assert.match(page, /<h3>Stop the homepage from jumping past the party\.<\/h3>/);
    assert.match(page, /9,528 on a page 14,104 pixels tall/);
    assert.match(page, /homepage measured 415 pixels wide/);
    assert.match(page, /twenty-five pixels of\s+horizontal overflow/);
    assert.match(page, /Copyright © 2020/);
  });

  test("states scope, uncertainty, and concept limits", () => {
    assert.match(page, /exact script responsible needs isolated testing/);
    assert.match(
      page,
      /not a complete accessibility, security, legal, rental-safety, insurance, advertising, payment, or authenticated-system audit/,
    );
    assert.match(page, /This is an exploratory concept, not a final design/);
    assert.match(page, /review figure comes from the company’s own public widget/);
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
