# empatheticbot.com

A one-page static site served with Cloudflare Workers Static Assets. The Worker runs only for
`/api/*`; other requests use Cloudflare's free, cached static-asset path. The contact endpoint
validates Turnstile and sends a notification through a restricted `send_email` binding.

## Local development

```sh
npm install
npm test
npm run check
cp .dev.vars.example .dev.vars
npm start
```

For local browser testing, temporarily use Cloudflare's always-pass Turnstile site key
`1x00000000000000000000AA` in `public/index.html`. `.dev.vars.example` already contains the matching
test secret. Wrangler simulates the email binding locally; it does not send an external email.

## One-time Cloudflare setup

1. Add `empatheticbot.com` to Cloudflare and use Cloudflare DNS. Preserve the existing Google
   Workspace MX records on the apex domain.
2. In **Compute > Email Service > Email Routing**, select `empatheticbot.com`, open **Settings**,
   and add `forms.empatheticbot.com` under **Subdomains**. Do not replace Google's apex MX records
   with Cloudflare Email Routing records.
3. Add `inquiry@empatheticbot.com` as a destination address and complete its verification email.
   `wrangler.jsonc` already uses this address for both `CONTACT_RECIPIENT` and the binding's
   restricted `destination_address`.
4. In **Compute > Email Service > Email Sending**, onboard `empatheticbot.com` and confirm its
   sending DNS records are active. This adds the `cf-bounce` and DKIM records used to authenticate
   outbound messages without replacing Google Workspace's MX records. `wrangler.jsonc` uses
   `inquiry@forms.empatheticbot.com` for `CONTACT_FROM`.
5. In **Turnstile**, confirm the configured widget allows `empatheticbot.com`. Its public site key
   is already set in `public/index.html`.
6. Run the local checks below, authenticate Wrangler, then store the Turnstile secret without
   committing it. The secret command creates and immediately deploys a Worker version:

   ```sh
   npx wrangler login
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

7. Deploy the finalized version with `npm run deploy`. In the Worker dashboard, open
   **Settings > Domains & Routes**, add a Custom Domain, and choose `empatheticbot.com`.

This configuration intentionally sends only to one verified destination, so the notification
remains free. The sender domain still needs Email Sending onboarding so its SPF and DKIM
authentication records are present; that does not require arbitrary-recipient sending.

For local form testing, copy `.dev.vars.example` to `.dev.vars`. Its test-only values allow the
Wrangler preview origin, enable local test-token handling, and use Cloudflare's always-pass
Turnstile keys; they never apply to the deployed Worker. Do not configure `TURNSTILE_TEST_MODE`
in Cloudflare.

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
