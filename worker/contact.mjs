const MAX_BODY_BYTES = 32 * 1024;
const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "contact";

const NEED_OPTIONS = new Set([
  "A brand-new website",
  "A redesign of my current site",
  "Someone to care for & improve my current site",
  "Not sure yet — let’s talk",
]);

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
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
  const goals = normalizeParagraph(textValue(form, "goals"), 2_000);
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
    !goals ||
    goals.length < 10 ||
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
    goals,
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

function buildEmail(lead, env) {
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Business", lead.business],
    ["Current website", lead.website || "Not provided"],
    ["What they need", lead.need],
    ["Goals", lead.goals],
  ];

  const text = [
    "New website inquiry",
    "",
    ...rows.flatMap(([label, value]) => [`${label}:`, value, ""]),
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" valign="top" style="padding:8px 16px 8px 0">${escapeHtml(label)}</th><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    to: env.CONTACT_RECIPIENT,
    from: { email: env.CONTACT_FROM, name: "empatheticbot website" },
    replyTo: lead.email,
    subject: `New website inquiry from ${lead.name}`,
    text,
    html: `<h1>New website inquiry</h1><table>${htmlRows}</table>`,
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
    console.error("Contact Worker is missing required bindings or variables.");
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
  } catch {
    console.error("Turnstile verification was unavailable.");
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
  } catch {
    console.error("Contact notification email could not be sent.");
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
