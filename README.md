# empatheticbot.com

Empatheticbot's website — a one-page site for a one-person web studio.

No frameworks, no build step. Plain HTML (`index.html`), CSS (`style.css`), and a
little JavaScript (`main.js`).

## Develop

```sh
npm install
npm start   # serves the site at http://localhost:8080
```

## Before going live

- **Contact form**: point the `<form action="…">` in `index.html` at a real form
  endpoint (e.g. create a free form at [Formspree](https://formspree.io) and replace
  `YOUR_FORM_ID`). Until then, submissions fall back to opening a pre-filled email
  to `hello@empatheticbot.com` — make sure that address exists, or change it in
  `main.js`.
- **Open Graph image**: `index.html` references `assets/og.png` (1200×630) for link
  previews. Add one, or remove the `og:image` / `twitter:card` tags.
- **Pricing**: the $200/month figure appears in the hero, the pricing card, and the
  contact form's budget question.
