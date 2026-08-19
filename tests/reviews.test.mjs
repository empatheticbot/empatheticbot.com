import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const reviewsDir = new URL("../public/reviews/", import.meta.url);

const [sharedCss, sharedScript, indexPage, headers, entries] = await Promise.all([
  readFile(new URL("review.css", reviewsDir), "utf8"),
  readFile(new URL("review.js", reviewsDir), "utf8"),
  readFile(new URL("index.html", reviewsDir), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readdir(reviewsDir, { withFileTypes: true }),
]);

const clients = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

const pages = await Promise.all(
  clients.map(async (client) => ({
    client,
    page: await readFile(new URL(`${client}/index.html`, reviewsDir), "utf8"),
    theme: await readFile(new URL(`${client}/theme.css`, reviewsDir), "utf8"),
  })),
);

describe("shared review layer", () => {
  test("covers at least one client", () => {
    assert.ok(clients.length > 0);
  });

  test("names no individual client", () => {
    for (const client of clients) {
      const mention = new RegExp(client, "i");
      assert.doesNotMatch(sharedCss, mention, `review.css mentions ${client}`);
      assert.doesNotMatch(sharedScript, mention, `review.js mentions ${client}`);
    }
  });

  test("defines every review token it consumes", () => {
    const defined = new Set(sharedCss.match(/--review-[\w-]+(?=\s*:)/g));
    const used = new Set(
      sharedCss.match(/var\(\s*(--review-[\w-]+)/g)?.map((m) => m.slice(m.indexOf("--"))),
    );

    for (const token of used) {
      assert.ok(defined.has(token), `${token} is used but has no default in review.css`);
    }
  });

  test("keeps every review page out of search indexes", () => {
    assert.match(headers, /\/reviews\/\*\s+X-Robots-Tag: noindex, nofollow/);

    for (const { client, page } of pages) {
      assert.match(page, /<meta name="robots" content="noindex, nofollow" \/>/, client);
    }
  });

  test("loads the shared stylesheet and script from every page", () => {
    for (const { client, page } of pages) {
      const styleOrder = [
        page.indexOf('href="/style.css"'),
        page.indexOf('href="/reviews/review.css"'),
        page.indexOf(`href="/reviews/${client}/theme.css"`),
      ];

      assert.ok(
        styleOrder.every((index, i) => index > -1 && (i === 0 || index > styleOrder[i - 1])),
        `${client} must load style.css, then review.css, then its own theme.css`,
      );
      assert.match(page, /<script src="\/reviews\/review\.js" defer><\/script>/, client);
    }
  });

  test("keeps client themes to brand tokens only", () => {
    for (const { client, theme } of pages) {
      const rules = theme.replace(/\/\*[\s\S]*?\*\//g, "");
      const selectors = rules.match(/^[^@\s][^{]*(?=\{)/gm)?.map((s) => s.trim()) ?? [];
      assert.deepEqual(
        selectors,
        [".review-page"],
        `${client}/theme.css must only style .review-page`,
      );

      for (const declaration of rules.match(/^\s+[a-z-]+(?=\s*:)/gm) ?? []) {
        assert.match(
          declaration.trim(),
          /^--review-/,
          `${client}/theme.css sets ${declaration.trim()}; themes carry tokens, not layout`,
        );
      }
    }
  });

  test("uses the shared class prefix throughout", () => {
    for (const { client, page } of pages) {
      const classAttributes = page.match(/class="[^"]*"/g) ?? [];
      const scoped = classAttributes.filter((value) => value.includes(`${client}-`));
      assert.deepEqual(scoped, [], `${client}/index.html still carries client-prefixed classes`);
    }
  });

  test("opens concept images in an accessible native dialog", () => {
    assert.match(sharedScript, /reviewLightbox\.showModal\(\)/);
    assert.match(sharedScript, /reviewLightbox\.close\(\)/);

    for (const { client, page } of pages) {
      assert.match(
        page,
        /<dialog class="review-lightbox" aria-labelledby="review-lightbox-title">/,
        client,
      );
      assert.match(page, /class="review-lightbox-close" aria-label="Close image"/, client);
      assert.ok((page.match(/class="review-concept-button/g)?.length ?? 0) > 0, client);
    }
  });

  test("lets Escape dismiss the concept dialog", () => {
    // A modal dialog closes on Escape natively. Only three things break that:
    // opening it with .show() instead of .showModal(), preventing the default on
    // its cancel event, or shipping it already open in the markup.
    assert.match(sharedScript, /\.showModal\(\)/);
    assert.doesNotMatch(sharedScript, /(?<!Modal)\bshow\(\)/);
    assert.doesNotMatch(sharedScript, /addEventListener\(\s*["']cancel["']/);

    for (const { client, page } of pages) {
      assert.doesNotMatch(page, /<dialog[^>]*\sopen[\s>]/, `${client} ships the dialog pre-opened`);
    }
  });

  test("sizes the summary figures to the widest number in the panel", () => {
    // A fixed column silently crowds a wider figure: "14.6s" runs about a
    // quarter past a 3.75rem track and ends up touching its own label. The
    // track sizes to content, and the rows borrow it so they stay aligned.
    const panel = sharedCss.match(/\.review-summary dl \{([^}]*)\}/)?.[1];
    const row = sharedCss.match(/\.review-summary dl div \{([^}]*)\}/)?.[1];

    assert.match(panel, /grid-template-columns:[^;]*max-content/);
    assert.match(row, /grid-template-columns:\s*subgrid/);
  });

  test("states audit scope and measurement caveats on every page", () => {
    for (const { client, page } of pages) {
      assert.match(page, /Automated scores are a useful signal, not a certification/, client);
      assert.match(page, /About this review:/, client);
    }
  });
});

describe("reviews index", () => {
  test("links to every review, and only to reviews that exist", () => {
    const linked = [...indexPage.matchAll(/href="\/reviews\/([^/"]+)\/"/g)].map((m) => m[1]);

    assert.deepEqual(
      [...linked].sort(),
      [...clients].sort(),
      "every client directory needs a card on /reviews/, and every card a directory",
    );
    assert.equal(new Set(linked).size, linked.length, "a review is listed twice");
  });

  test("stays out of search indexes like the reviews it lists", () => {
    assert.match(indexPage, /<meta name="robots" content="noindex, nofollow" \/>/);
  });

  test("names each review's client and audit date", () => {
    for (const { client, page } of pages) {
      const card = indexPage.match(
        new RegExp(`<a class="review-index-card" href="/reviews/${client}/">[\\s\\S]*?</a>`),
      )?.[0];
      assert.ok(card, `${client} has no card on the index`);
      assert.match(card, /<time datetime="\d{4}-\d{2}-\d{2}">/, client);

      const heading = page.match(/<h1>([^<]*)<\/h1>/)?.[1];
      assert.ok(heading);
      assert.ok(card.includes(heading), `${client}'s card headline no longer matches its review`);
    }
  });
});
