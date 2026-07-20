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

## One-time Cloudflare setup (free plan)

1. Add `empatheticbot.com` to Cloudflare and use Cloudflare DNS. Preserve the existing Google
   Workspace MX records on the apex domain.
2. In **Compute > Email Service > Email Routing**, select `empatheticbot.com`, open **Settings**,
   and add `forms.empatheticbot.com` under **Subdomains**. Do not replace Google's apex MX records
   with Cloudflare Email Routing records.
3. Add `inquiry@empatheticbot.com` as a destination address and complete its verification email.
   `wrangler.jsonc` already uses this address for both `CONTACT_RECIPIENT` and the binding's
   restricted `destination_address`.
4. In **Compute > Email Service > Email Routing**, select `forms.empatheticbot.com`, open
   **Settings**, and confirm the subdomain's routing DNS records are active. Email Routing adds the
   MX, SPF, and DKIM records to the subdomain without replacing Google Workspace's apex records.
   `wrangler.jsonc` uses `inquiry@forms.empatheticbot.com` for `CONTACT_FROM`.
5. Do not onboard **Email Sending** for this form. Arbitrary-recipient sending requires a paid
   plan, but sends to a verified Email Routing destination are free on all plans. This Worker is
   restricted to the verified `inquiry@empatheticbot.com` destination.
6. In **Turnstile**, confirm the configured widget allows `empatheticbot.com`. Its public site key
   is already set in `public/main.js`.
7. Run the local checks below, authenticate Wrangler, then store the Turnstile secret without
   committing it. The secret command creates and immediately deploys a Worker version:

   ```sh
   npx wrangler login
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

8. Deploy the finalized version with `npm run deploy`. In the Worker dashboard, open
   **Settings > Domains & Routes**, add a Custom Domain, and choose `empatheticbot.com`.

This configuration intentionally sends only to one verified destination, so the notification
remains free. The sender must stay on the active `forms.empatheticbot.com` Email Routing subdomain;
sending to arbitrary recipients would require the paid Email Sending plan.

The test-only values in `npm start` allow the Wrangler preview origin, enable local test-token
handling, and use Cloudflare's always-pass Turnstile keys; they never apply to the deployed Worker.
Do not configure `TURNSTILE_TEST_MODE` in Cloudflare.

If `www.empatheticbot.com` will also submit the form, add it to the Turnstile widget and append
it to `ALLOWED_ORIGINS` as a comma-separated origin.

## Checks

```sh
npm test
npm run check
npx wrangler deploy --dry-run
```

Only deployable browser files live in `public/`, so Wrangler does not scan or watch source,
tests, dependencies, Git data, local secrets, or its own temporary files.
