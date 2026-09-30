# empatheticbot.com

A one-page static site served with Cloudflare Workers Static Assets. The Worker runs only for
`/api/*`; other requests use Cloudflare's free, cached static-asset path. The contact endpoint
validates Turnstile and sends a notification through a restricted `send_email` binding.

## Local development

```sh
npm install
npm test
npm run check
npm start
```

Local development automatically uses Cloudflare's public always-pass Turnstile test keys. Wrangler
simulates the email binding locally; it does not send an external email. Production continues to
use the real widget key and the deployed `TURNSTILE_SECRET_KEY` secret.

## Test environment

The named `test` environment deploys to `https://test.empatheticbot.com` with Cloudflare's public
Turnstile test keys. Wrangler provisions the custom domain and its HTTPS certificate. The existing
`https://empatheticbot-com-test.empatheticbot.workers.dev` address also remains available.

Both test addresses send an `X-Robots-Tag: noindex` header on all static pages and assets; the
custom domain also sends `nofollow`. The hostname-specific rules in `public/_headers` leave the
production domain indexable. Crawling remains allowed in `robots.txt` so search engines can read
the `noindex` directive.

Set its public test secret once, then deploy it independently of production:

```sh
npx wrangler secret put TURNSTILE_SECRET_KEY --env test
npx wrangler deploy --env test
```

The test Worker uses the same restricted email destination as production, so submitting its contact
form sends a real inquiry email.

## Checks

```sh
npm test
npm run check
npx wrangler deploy --dry-run
```

Only deployable browser files live in `public/`, so Wrangler does not scan or watch source,
tests, dependencies, Git data, local secrets, or its own temporary files.
