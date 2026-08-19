const MAX_BODY_BYTES = 32 * 1024;
const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "contact";

const NEED_OPTIONS = new Set([
  "A brand-new website",
  "A redesign of my current site",
  "Someone to care for & improve my current site",
  "Not sure yet — let’s talk",
]);

// Optional so a cached copy of the form still submits successfully.
const SIZE_OPTIONS = new Set([
  "Just me, or a handful of people",
  "A small team — roughly 10 to 50 people",
  "50+ people, or several locations",
  "Not sure how to answer",
]);

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox",
      "Content-Type": "application/json; charset=utf-8",
      "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=()",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      ...extraHeaders,
    },
  });
}

function getAllowedOrigins(env) {
  return new Set(
    String(env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function hasConfiguration(env) {
  return Boolean(
    env.TURNSTILE_SECRET_KEY &&
      env.CONTACT_FROM &&
      env.CONTACT_RECIPIENT &&
      env.EMAIL_ASSET_ORIGIN &&
      env.ALLOWED_ORIGINS &&
      env.CONTACT_EMAIL?.send,
  );
}

function textValue(form, key) {
  const value = form.get(key);
  return typeof value === "string" ? value : null;
}

function hasControlCharacters(value, allowLineBreaks = false) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if ((code < 32 && !(allowLineBreaks && code === 10)) || code === 127) return true;
  }
  return false;
}

function normalizeLine(value, maximum) {
  if (value === null) return null;
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > maximum || hasControlCharacters(normalized)) {
    return null;
  }
  return normalized;
}

function normalizeParagraph(value, maximum, required = true) {
  if (value === null) return required ? null : "";
  const normalized = value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (
    (!normalized && required) ||
    normalized.length > maximum ||
    hasControlCharacters(normalized, true)
  ) {
    return null;
  }
  return normalized;
}

function normalizeWebsite(value) {
  if (value === null || !value.trim()) return "";
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  if (candidate.length > 300) return null;

  try {
    const url = new URL(candidate);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function validateForm(form) {
  const name = normalizeLine(textValue(form, "name"), 100);
  const email = normalizeLine(textValue(form, "email"), 254);
  const business = normalizeLine(textValue(form, "business"), 180);
  const website = normalizeWebsite(textValue(form, "website"));
  const need = normalizeLine(textValue(form, "need"), 100);
  const size = normalizeLine(textValue(form, "size"), 100);
  const goals = normalizeParagraph(textValue(form, "goals"), 2_000);
  const timing = normalizeParagraph(textValue(form, "timing"), 300, false);
  const turnstileToken = normalizeLine(textValue(form, "cf-turnstile-response"), 2_048);

  const emailIsValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[\r\n]/.test(email);

  if (
    !name ||
    name.length < 2 ||
    !emailIsValid ||
    !business ||
    business.length < 2 ||
    website === null ||
    !need ||
    !NEED_OPTIONS.has(need) ||
    (size && !SIZE_OPTIONS.has(size)) ||
    !goals ||
    goals.length < 10 ||
    timing === null ||
    !turnstileToken
  ) {
    return null;
  }

  return {
    name,
    email,
    business,
    website,
    need,
    size,
    goals,
    timing,
    turnstileToken,
  };
}

async function parseForm(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (
    !contentType.startsWith("multipart/form-data") &&
    !contentType.startsWith("application/x-www-form-urlencoded")
  ) {
    return { error: "content-type" };
  }

  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { error: "too-large" };
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) return { error: "too-large" };

  try {
    const formRequest = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });
    return { form: await formRequest.formData() };
  } catch {
    return { error: "malformed" };
  }
}

async function verifyTurnstile(token, request, env, fetchImplementation) {
  const params = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) params.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetchImplementation(TURNSTILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Turnstile request failed");
    const result = await response.json();
    if (env.TURNSTILE_TEST_MODE === "true") return Boolean(result.success);
    const originHostname = new URL(request.headers.get("Origin")).hostname;
    return Boolean(
      result.success && result.action === TURNSTILE_ACTION && result.hostname === originHostname,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailText(value) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function detailRow(label, value) {
  return `<tr>
    <td class="detail-label" valign="top" style="width:148px;padding:13px 16px 13px 0;border-bottom:1px solid #e6dfd4;color:#766d64;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.1px;line-height:18px;text-transform:uppercase;">${escapeHtml(label)}</td>
    <td class="detail-value" valign="top" style="padding:13px 0;border-bottom:1px solid #e6dfd4;color:#211d1a;font-family:Arial,sans-serif;font-size:15px;line-height:23px;">${value}</td>
  </tr>`;
}

function buildEmail(lead, env) {
  const botImageUrl = new URL("/assets/email-bot.png", env.EMAIL_ASSET_ORIGIN).href;
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Business", lead.business],
    ["Current website", lead.website || "Not provided"],
    ["Business size", lead.size || "Not provided"],
    ["What they need", lead.need],
    ["Goals", lead.goals],
    ["Timing", lead.timing || "No date provided"],
  ];

  const text = [
    "empatheticbot",
    "================",
    "",
    "New website inquiry",
    `A new conversation with ${lead.name} at ${lead.business}.`,
    "",
    ...rows.flatMap(([label, value]) => [`${label}:`, value, ""]),
    "Reply to this email to write back directly.",
  ].join("\n");

  const emailHref = escapeHtml(`mailto:${lead.email}`);
  const websiteValue = lead.website
    ? `<a href="${escapeHtml(lead.website)}" style="color:#a91f15;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;">${escapeHtml(lead.website)}</a>`
    : '<span style="color:#766d64;">Not provided</span>';
  const details = [
    detailRow("Name", emailText(lead.name)),
    detailRow(
      "Email",
      `<a href="${emailHref}" style="color:#a91f15;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;">${escapeHtml(lead.email)}</a>`,
    ),
    detailRow("Business", emailText(lead.business)),
    detailRow("Current website", websiteValue),
    detailRow("Business size", emailText(lead.size || "Not provided")),
    detailRow("What they need", emailText(lead.need)),
    detailRow("Timing", emailText(lead.timing || "No date provided")),
  ].join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>New website inquiry</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell { padding: 16px 8px !important; }
        .email-card { border-radius: 10px !important; }
        .email-header, .email-content { padding-left: 24px !important; padding-right: 24px !important; }
        .detail-label, .detail-value { display: block !important; width: auto !important; }
        .detail-label { padding: 13px 0 0 !important; border-bottom: 0 !important; }
        .detail-value { padding: 2px 0 13px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#faf8f4;color:#211d1a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(lead.name)} from ${escapeHtml(lead.business)} sent a new website inquiry.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#faf8f4;">
      <tr>
        <td class="email-shell" align="center" style="padding:40px 16px;">
          <table role="presentation" class="email-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background-color:#ffffff;border:1px solid #e6dfd4;border-top:4px solid #c22417;border-radius:14px;box-shadow:0 12px 32px rgba(33,29,26,0.08);overflow:hidden;">
            <tr>
              <td class="email-header" style="padding:28px 40px 24px;border-bottom:1px solid #e6dfd4;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-right:11px;">
                      <img src="${escapeHtml(botImageUrl)}" width="34" height="34" alt="" style="display:block;width:34px;height:34px;border:0;" />
                    </td>
                    <td valign="middle" style="color:#211d1a;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;line-height:28px;">empatheticbot</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-content" style="padding:36px 40px 40px;">
                <p style="margin:0 0 10px;color:#c22417;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;line-height:18px;text-transform:uppercase;">New website inquiry</p>
                <h1 style="margin:0;color:#211d1a;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;letter-spacing:-0.5px;line-height:39px;">A new conversation has started.</h1>
                <p style="margin:14px 0 26px;color:#625a52;font-family:Arial,sans-serif;font-size:16px;line-height:25px;"><strong style="color:#211d1a;">${escapeHtml(lead.name)}</strong> from ${escapeHtml(lead.business)} reached out through the website.</p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 34px;">
                  <tr>
                    <td style="border-radius:8px;background-color:#c22417;">
                      <a href="${emailHref}" style="display:inline-block;padding:12px 19px;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;line-height:20px;text-decoration:none;">Reply to ${escapeHtml(lead.name)}</a>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 28px;background-color:#faf8f4;border-left:3px solid #c22417;border-radius:8px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0 0 7px;color:#766d64;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.1px;line-height:18px;text-transform:uppercase;">What they’re hoping to accomplish</p>
                      <p style="margin:0;color:#211d1a;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:28px;">${emailText(lead.goals)}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-top:1px solid #e6dfd4;">
                  ${details}
                </table>

                <p style="margin:28px 0 0;color:#8a8178;font-family:Arial,sans-serif;font-size:12px;line-height:19px;">Replying to this email goes directly to ${escapeHtml(lead.name)}. Sent with care from the <a href="https://empatheticbot.com/" style="color:#766d64;text-decoration:underline;">empatheticbot contact form</a>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to: env.CONTACT_RECIPIENT,
    from: { email: env.CONTACT_FROM, name: "empatheticbot inquiries" },
    replyTo: lead.email,
    subject: `New website inquiry from ${lead.name}`,
    text,
    html,
  };
}

export async function handleRequest(request, env, dependencies = {}) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/contact") {
    if (env.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return jsonResponse(404, { ok: false, error: "Not found." });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." }, { Allow: "POST" });
  }

  if (!hasConfiguration(env)) {
    console.error({
      event: "contact_configuration_missing",
      cfRay: request.headers.get("CF-Ray") || undefined,
    });
    return jsonResponse(503, {
      ok: false,
      error: "The contact form is temporarily unavailable.",
    });
  }

  const origin = request.headers.get("Origin");
  if (!origin || !getAllowedOrigins(env).has(origin)) {
    return jsonResponse(403, { ok: false, error: "Request not allowed." });
  }

  let parsed;
  try {
    parsed = await parseForm(request);
  } catch {
    return jsonResponse(400, { ok: false, error: "The form could not be read." });
  }

  if (parsed.error === "content-type") {
    return jsonResponse(415, { ok: false, error: "Unsupported form format." });
  }
  if (parsed.error === "too-large") {
    return jsonResponse(413, { ok: false, error: "The form is too large." });
  }
  if (parsed.error) {
    return jsonResponse(400, { ok: false, error: "The form could not be read." });
  }

  const lead = validateForm(parsed.form);
  if (!lead) {
    return jsonResponse(400, {
      ok: false,
      error: "Please check the form fields and try again.",
    });
  }

  const fetchImplementation = dependencies.fetch || fetch;
  let turnstileIsValid;
  try {
    turnstileIsValid = await verifyTurnstile(
      lead.turnstileToken,
      request,
      env,
      fetchImplementation,
    );
  } catch (error) {
    console.error({
      event: "contact_security_check_unavailable",
      errorType: error instanceof Error ? error.name : "UnknownError",
      cfRay: request.headers.get("CF-Ray") || undefined,
    });
    return jsonResponse(502, {
      ok: false,
      error: "The security check is temporarily unavailable. Please try again.",
    });
  }

  if (!turnstileIsValid) {
    return jsonResponse(400, {
      ok: false,
      error: "Please complete the security check again.",
    });
  }

  try {
    await env.CONTACT_EMAIL.send(buildEmail(lead, env));
  } catch (error) {
    console.error({
      event: "contact_email_send_failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
      cfRay: request.headers.get("CF-Ray") || undefined,
    });
    return jsonResponse(502, {
      ok: false,
      error: "Your message could not be sent. Please try again.",
    });
  }

  return jsonResponse(200, { ok: true });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
