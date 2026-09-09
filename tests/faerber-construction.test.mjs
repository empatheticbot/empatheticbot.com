import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const page = await readFile(
  new URL("../public/reviews/faerber-construction/index.html", import.meta.url),
  "utf8",
);
const assets = [
  "current-desktop.webp",
  "current-mobile.webp",
  "concept-1-desktop.webp",
  "concept-1-mobile.webp",
  "og-faerber-construction-redesign.png",
];

function imageSize(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8 ");
  return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
}

describe("Faerber Construction outreach review", () => {
  test("declares the dimensions the assets actually have", async () => {
    for (const asset of assets.filter((name) => name.endsWith(".webp"))) {
      const buffer = await readFile(
        new URL(`../public/reviews/faerber-construction/assets/${asset}`, import.meta.url),
      );
      const expected = imageSize(buffer);
      const tag = page.match(new RegExp(`src="[^"]*${asset}"[^>]*?>`, "s"))?.[0] ?? "";
      assert.equal(Number(tag.match(/width="(\d+)"/)?.[1]), expected.width, `${asset} width`);
      assert.equal(Number(tag.match(/height="(\d+)"/)?.[1]), expected.height, `${asset} height`);
    }
  });

  test("includes current evidence, responsive concepts, and sharing metadata", async () => {
    for (const asset of assets) {
      await access(
        new URL(`../public/reviews/faerber-construction/assets/${asset}`, import.meta.url),
      );
      assert.match(page, new RegExp(`/reviews/faerber-construction/assets/${asset}`));
    }
    assert.equal(page.match(/class="review-concept-button/g)?.length, 2);
    assert.match(page, /<meta property="og:image:width" content="1200" \/>/);
    assert.match(page, /<meta property="og:image:height" content="630" \/>/);
    assert.match(page, /Make the next part of your home feel right/);
  });

  test("leads with the measured first-screen and inquiry problems", () => {
    assert.match(page, /<h3>Move the promise above the project photograph\.<\/h3>/);
    assert.match(page, /does not begin until pixel 635/);
    assert.match(page, /Make the phone number and project form part of one path/);
    assert.match(page, /Four of six rendered homepage images/);
    assert.equal(page.match(/class="review-priority-number"/g)?.length, 6);
  });

  test("states scope, evidence limits, and concept limits", () => {
    assert.match(
      page,
      /not a complete accessibility, security, legal, licensing, insurance, warranty, construction-quality, advertising, privacy, or authenticated-system audit/,
    );
    assert.match(page, /No form was submitted, no call was placed/);
    assert.match(page, /This is an exploratory first-screen concept, not a final design/);
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
  });
});
