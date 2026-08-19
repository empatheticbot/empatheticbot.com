# Website review outline

A repeatable structure for the unsolicited website reviews sent to prospective clients.
Working example: [Cascade Hemophilia Consortium](../public/reviews/cascade/index.html).

The point of the format is that every review makes the same promise: *here is what I measured,
here is what it costs your visitors, here is what better could look like, and there is no
obligation attached.* Consistency is what makes it read as professional work rather than a
cold pitch.

---

## 1. Before writing anything

**Qualify the prospect.** A review is roughly a day of work. Only start one when all of these
are true:

- There is a real signal they may be investing in the site (heard secondhand, a stale
  copyright year, a job posting, a redesign RFP, a board transition).
- The site has a specific, demonstrable problem — not just "it looks dated."
- The organization is a plausible fit for the subscription model described in
  [working-together.html](../public/working-together.html).
- You can be genuinely useful to them even if they never reply.

**Fix the scope in writing before you measure.** Decide and note what the review *is not*:
not a complete accessibility audit, not security, not legal, not clinical or regulated content,
not anything behind a login. That sentence goes in the document verbatim at the end, and it
governs what you're allowed to claim throughout.

**Set the audit date.** One date, used everywhere in the document. Every measurement in the
review must come from that day's pass.

---

## 2. Evidence pass

Everything asserted in the finished document traces back to something captured here. If a
claim has no artifact behind it, it gets cut.

### Capture

| Artifact | Notes |
| --- | --- |
| Full-page desktop screenshot | Real viewport, full scroll height |
| Full-page mobile screenshot | 390px wide — this is the one that carries the argument |
| Lighthouse run | Accessibility, SEO, Performance, Best Practices; note cache state |
| Sitemap sweep | Page count, and a scan for missing titles/descriptions across *all* of them |
| Network waterfall | Request count, third-party dependencies, LCP element and how it's discovered |
| Console + network errors | Failed requests, cookie warnings, script errors |
| Key interior pages | The 2–3 pages that carry the primary task (forms, services, contact) |

Save screenshots as `.webp` at real dimensions. The document sets explicit `width`/`height`
attributes on every image, so record them.

### Rules for measurement

- Run each test more than once; report the run you'd defend, and say the conditions.
- Distinguish "automated score" from "audited." Cascade's 96 accessibility score sits next
  to a note that a complete assessment still needs keyboard, zoom, contrast, form, PDF, and
  assistive-technology testing. Never let a number imply certification.
- Sitemap-wide claims need a sitemap-wide check. "0 of 43 pages have a search description"
  is strong *because* all 43 were checked.
- Note what's genuinely good with the same rigor. The strengths section is not a courtesy.

### Pick four headline numbers

Choose four for the summary panel that together tell the story. Cascade used pages in
sitemap (43), accessibility (96), SEO (92), and pages with a search description (0). The last
one is the hook — at least one number should be quietly alarming and impossible to argue with.

---

## 3. Choosing and ranking findings

Aim for **six findings: four high impact, two medium.** Fewer reads thin; more reads like a
bug report and dilutes the priorities.

**Rank by what the problem costs a visitor, not by fix difficulty.** State that ordering rule
in the document so the reader knows what they're looking at.

Each finding needs four parts, in this order:

1. **Impact + category label** — `High impact · Information hierarchy`. Categories used so
   far: Information hierarchy, Mobile experience, Accessibility, Search visibility, Content
   design, Technical quality.
2. **Headline as an instruction** — an imperative sentence, not a noun phrase.
   "Lead with what Cascade helps people do." not "Homepage hierarchy issues."
3. **The evidence, told through a person** — the specific measurement, then what it does to
   someone real. "Someone standing at a pharmacy counter scrolls past a holiday notice to
   reach the thing they came for."
4. **The opportunity** — one sentence, bolded lead-in, describing the direction rather than
   prescribing the implementation. It should be useful to them even if a different vendor
   does the work.

Name a persona once at the top of the findings section and let them recur — for Cascade, the
person on a phone at a bad moment: a new diagnosis, a denied claim, a form due tomorrow.

---

## 4. Design concepts

**Three directions, desktop and mobile for each.** Three is enough to show range without
implying you've already decided for them.

Give each a name that describes a posture, not a style: *Editorial and reassuring*,
*Community-centered*, *Task-first and direct*. One sentence each on what it prioritizes.

Label them exploratory in the section intro, and say that final copy, imagery, and any
regulated language would be reviewed with the client. Pick the strongest direction's desktop
concept as the Open Graph image.

---

## 5. Document structure

Eleven blocks, in this order. Section IDs `#findings`, `#evidence`, `#concepts` are linked
from the hero.

**1. Header** — wordmark linking home, plus `Prepared for [Organization]`. Establishes this
was made for them specifically.

**2. Hero** — kicker (`An independent website review · [Month Year]`), a headline naming the
outcome rather than the problem ("A clearer digital front door for Cascade."), and a lede that
opens by crediting what they've already built before naming the gap. Two actions: primary to
the findings, secondary to the concepts.

**3. Summary panel** — "The short version." Two or three sentences, then the four numbers, then
the caveat line about automated scores. A reader who stops here should still have the argument.

**4. What's already working** — six specific strengths, with a heading that defuses the threat:
"A sound foundation—not a rescue project." This section is why the rest gets read.

**5. Findings** — the six from §3, numbered `01`–`06`, with the ordering rule stated up front.

**6. Current experience** — the desktop and mobile screenshots, framed in browser and phone
chrome, with a short intro on why the mobile view magnifies the hierarchy problem. Let the
evidence do the work; no new claims here.

**7. Audit details** — four score cards matching the summary numbers. Each pairs the number
with an honest reading, including limits. The performance card should say outright when speed
is a *preservation goal*, not the argument for the redesign.

**8. Concepts** — the three directions from §4, in a lightbox.

**9. Roadmap** — four phases: listen and inventory, reshape the information, design and build
accessibly, keep caring for it. Framed as "if you ever take this on—with anyone."

**10. Closing note** — "A note from Steve." How you came to write it, that it isn't a formal
proposal, that they're welcome to use the recommendations regardless. One low-pressure action:
`Talk through the review`, mailto with a prefilled subject.

**11. About this review** — the scope statement from §1, with the audit date.

---

## 6. Voice

- **Second person about their visitors, not about them.** The subject of a criticism is the
  visitor's experience, never the client's competence.
- **Credit first, always.** Every section that identifies a problem opens by acknowledging
  what already works.
- **No jargon without a plain-language gloss.** LCP, structured data, and canonical URLs each
  need a clause explaining why they matter to a person.
- **Opportunities, not failures.** The word is "opportunity." The tone is a colleague thinking
  out loud, not a vendor building a case.
- **Never overstate the measurement.** Caveat every score. Name the date. Say results vary by
  network, device, cache state, and future content changes.
- **No pressure in the close.** No urgency, no scarcity, no discount, no follow-up threat.
  The offer is a conversation, and the recommendations are theirs either way.
- **Em dashes and curly quotes** to match the rest of the site.

---

## 7. Build

```
public/reviews/
  index.html                   # the unlisted index of every review
  review.css                   # shared structure — never client-specific
  review.js                    # shared lightbox — never client-specific
  <client>/
    index.html
    theme.css                  # brand tokens only
    assets/
      current-desktop.webp
      current-mobile.webp
      concept-{1,2,3}-{desktop,mobile}.webp
      og-<client>-redesign.png # 1200×630
tests/reviews.test.mjs         # shared guarantees, run against every client
tests/<client>.test.mjs        # this review's own content
```

Every class on the page uses the `review-` prefix and comes from the shared
stylesheet. A new review copies an existing `index.html`, rewrites the copy, and
writes one small `theme.css`.

Checklist:

- [ ] `<meta name="robots" content="noindex, nofollow">` in the head. The `/reviews/*` rule in
      [_headers](../public/_headers) already sends the matching `X-Robots-Tag`, but the page
      carries its own.
- [ ] Canonical, Open Graph, and Twitter tags — the review needs a clean preview when the
      recipient forwards the link internally, which is the main way it spreads.
- [ ] `og:image` dimensions declared as `1200`/`630`, with descriptive `og:image:alt`.
- [ ] Stylesheets load in order: `/style.css`, `/reviews/review.css`, then the
      client's `theme.css`. The theme has to come last to win on equal specificity.
- [ ] Every image has explicit `width`/`height`, `loading="lazy"` below the fold, and real
      alt text.
- [ ] Concept images open in the native `<dialog>` lightbox with labeled buttons.
      Opening it with `showModal()` is what makes Escape, focus trapping, and focus
      restoration work — don't hand-roll any of it.
- [ ] Skip link, one `<h1>`, correct heading order — the review has to pass its own audit.
- [ ] A card on [the index](../public/reviews/index.html), newest first, carrying the client's
      name, the audit date, the review's own headline, and the "short version" paragraph. The
      shared test fails until every client directory is listed there and every card points at a
      directory that exists.
- [ ] `npm test` and `npm run check` clean.

### Theming a review

[review.css](../public/reviews/review.css) carries all layout, type, and component styling.
The client's [theme.css](../public/reviews/cascade/theme.css) sets brand tokens and nothing
else — the shared test enforces that it only styles `.review-page` and only declares
`--review-*` properties.

| Token | Controls |
| --- | --- |
| `--review-brand` | Summary panel background and the score numerals |
| `--review-brand-ink` | Text on the brand panel |
| `--review-brand-label` / `-soft` / `-note` | The three tints inside the summary panel |
| `--review-score` / `--review-score-dark` | Score numerals, light and dark |
| `--review-accent` | Bullets, priority numbers, focus rings — defaults to the site accent |
| `--review-panel` / `--review-panel-dark` | Closing call-to-action background |

In practice a theme only has to set `--review-brand`; every tint derives from it with
`color-mix`. Pin the others only when a brand needs an exact value, as Cascade does. Deliberate
exceptions live in the shared file: the screenshot panels and mock browser chrome stay white
with fixed warm neutrals in both themes, so the framing never competes with the screenshot.

### Tests

Two files. [tests/reviews.test.mjs](../tests/reviews.test.mjs) holds the format's
non-negotiables and runs against every client directory automatically — noindex on the page and
in `_headers`, correct stylesheet order, the shared script, an accessible lightbox, themes
limited to tokens, no client-prefixed classes left behind, no client named in the shared files,
and no token used without a default. It also holds the index at `/reviews/` to the same
standard: unindexed, listing every review and nothing that isn't one. A new review is covered by
it the moment the directory exists.

[tests/cascade.test.mjs](../tests/cascade.test.mjs) is the per-client pattern: every referenced
asset exists, the scope caveats specific to that engagement are present, the close stays
low-pressure, and social previews are complete. Copy it and swap the client name and asset
list.

---

## 8. Sending

- Deploy to the test environment and read the whole thing on an actual phone before sending.
- Check the link preview renders in whatever channel you're sending through.
- Send to a person, not an info@ address, with a short note in the same voice as the closing
  section: how you came across them, what you found, no ask beyond reading it.
- Don't follow up more than once, and not sooner than two weeks.
- The page stays up and unindexed. If they decline, leave it — it costs nothing and it's
  still useful to them.
