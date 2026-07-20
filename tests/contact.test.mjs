import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { handleRequest } from "../worker/contact.mjs";

const ORIGIN = "https://empatheticbot.com";

function validForm(overrides = {}) {
  const values = {
    name: "Avery Example",
    email: "avery@example.com",
    business: "Example Plumbing",
    website: "example.com",
    need: "A brand-new website",
    goals: "Bring in more calls from local customers.",
    timing: "Before our fall opening",
    "cf-turnstile-response": "valid-test-token",
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

function createHarness(options = {}) {
  const sent = [];
  let turnstileCalls = 0;
  const env = {
    ALLOWED_ORIGINS: ORIGIN,
    CONTACT_FROM: "hello@empatheticbot.com",
    CONTACT_RECIPIENT: "owner@example.com",
    TURNSTILE_SECRET_KEY: "test-secret",
    CONTACT_EMAIL: {
      async send(message) {
        if (options.emailError) throw new Error("private provider detail");
        sent.push(message);
      },
    },
  };
  const fetch = async () => {
    turnstileCalls += 1;
    if (options.turnstileError) throw new Error("private upstream detail");
    return Response.json({
      success: options.turnstileSuccess ?? true,
      action: options.turnstileAction ?? "contact",
      hostname: options.turnstileHostname ?? "empatheticbot.com",
    });
  };
  return { env, fetch, sent, turnstileCalls: () => turnstileCalls };
}

function contactRequest(body = validForm(), headers = {}) {
  return new Request(`${ORIGIN}/api/contact`, {
    method: "POST",
    headers: { Origin: ORIGIN, ...headers },
    body,
  });
}

describe("POST /api/contact", () => {
  test("validates Turnstile, normalizes input, and sends one notification", async () => {
    const harness = createHarness();
    const response = await handleRequest(contactRequest(), harness.env, {
      fetch: harness.fetch,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
    assert.match(response.headers.get("Content-Security-Policy"), /default-src 'none'/);
    assert.equal(harness.turnstileCalls(), 1);
    assert.equal(harness.sent.length, 1);
    assert.equal(harness.sent[0].replyTo, "avery@example.com");
    assert.match(harness.sent[0].text, /https:\/\/example\.com\//);
    assert.match(harness.sent[0].text, /Before our fall opening/);
    assert.doesNotMatch(harness.sent[0].text, /valid-test-token|test-secret/);
  });

  test("accepts the native form's URL-encoded submission format", async () => {
    const harness = createHarness();
    const body = new URLSearchParams();
    for (const [key, value] of validForm().entries()) body.set(key, value);
    const response = await handleRequest(contactRequest(body), harness.env, {
      fetch: harness.fetch,
    });

    assert.equal(response.status, 200);
    assert.equal(harness.sent.length, 1);
  });

  test("rejects non-POST methods", async () => {
    const harness = createHarness();
    const response = await handleRequest(
      new Request(`${ORIGIN}/api/contact`, { headers: { Origin: ORIGIN } }),
      harness.env,
      { fetch: harness.fetch },
    );

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
    assert.equal(harness.turnstileCalls(), 0);
  });

  test("rejects requests from other origins", async () => {
    const harness = createHarness();
    const response = await handleRequest(
      contactRequest(validForm(), { Origin: "https://attacker.example" }),
      harness.env,
      { fetch: harness.fetch },
    );

    assert.equal(response.status, 403);
    assert.equal(harness.turnstileCalls(), 0);
  });

  test("rejects unsupported content types", async () => {
    const harness = createHarness();
    const response = await handleRequest(
      contactRequest("not a form", { "Content-Type": "text/plain" }),
      harness.env,
      { fetch: harness.fetch },
    );

    assert.equal(response.status, 415);
    assert.equal(harness.turnstileCalls(), 0);
  });

  test("rejects oversized payloads", async () => {
    const harness = createHarness();
    const response = await handleRequest(
      contactRequest("x".repeat(33 * 1024), {
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      harness.env,
      { fetch: harness.fetch },
    );

    assert.equal(response.status, 413);
    assert.equal(harness.turnstileCalls(), 0);
  });

  test("rejects invalid field values before calling Turnstile", async () => {
    const harness = createHarness();
    const response = await handleRequest(
      contactRequest(validForm({ need: "Anything" })),
      harness.env,
      {
        fetch: harness.fetch,
      },
    );

    assert.equal(response.status, 400);
    assert.equal(harness.turnstileCalls(), 0);
    assert.equal(harness.sent.length, 0);
  });

  test("accepts an omitted optional timing value", async () => {
    const harness = createHarness();
    const form = validForm();
    form.delete("timing");
    const response = await handleRequest(contactRequest(form), harness.env, {
      fetch: harness.fetch,
    });

    assert.equal(response.status, 200);
    assert.match(harness.sent[0].text, /No date provided/);
  });

  test("rejects an overlong timing value before calling Turnstile", async () => {
    const harness = createHarness();
    const response = await handleRequest(
      contactRequest(validForm({ timing: "x".repeat(301) })),
      harness.env,
      { fetch: harness.fetch },
    );

    assert.equal(response.status, 400);
    assert.equal(harness.turnstileCalls(), 0);
  });

  test("rejects failed or mismatched Turnstile validations", async () => {
    for (const options of [
      { turnstileSuccess: false },
      { turnstileAction: "different-action" },
      { turnstileHostname: "attacker.example" },
    ]) {
      const harness = createHarness(options);
      const response = await handleRequest(contactRequest(), harness.env, {
        fetch: harness.fetch,
      });
      assert.equal(response.status, 400);
      assert.equal(harness.sent.length, 0);
    }
  });

  test("allows Cloudflare test tokens only when local test mode is explicit", async () => {
    const harness = createHarness({
      turnstileAction: "",
      turnstileHostname: "dummy-key.invalid",
    });
    harness.env.TURNSTILE_TEST_MODE = "true";
    const response = await handleRequest(contactRequest(), harness.env, {
      fetch: harness.fetch,
    });
    assert.equal(response.status, 200);
    assert.equal(harness.sent.length, 1);
  });

  test("returns safe errors when an upstream service fails", async (context) => {
    const consoleError = context.mock.method(console, "error", () => {});
    const turnstileHarness = createHarness({ turnstileError: true });
    const turnstileResponse = await handleRequest(contactRequest(), turnstileHarness.env, {
      fetch: turnstileHarness.fetch,
    });
    assert.equal(turnstileResponse.status, 502);
    assert.doesNotMatch(JSON.stringify(await turnstileResponse.json()), /private/);

    const emailHarness = createHarness({ emailError: true });
    const emailResponse = await handleRequest(contactRequest(), emailHarness.env, {
      fetch: emailHarness.fetch,
    });
    assert.equal(emailResponse.status, 502);
    assert.doesNotMatch(JSON.stringify(await emailResponse.json()), /private/);
    assert.equal(consoleError.mock.callCount(), 2);
  });

  test("fails closed when required configuration is missing", async (context) => {
    const consoleError = context.mock.method(console, "error", () => {});
    const harness = createHarness();
    delete harness.env.TURNSTILE_SECRET_KEY;
    const response = await handleRequest(contactRequest(), harness.env, {
      fetch: harness.fetch,
    });

    assert.equal(response.status, 503);
    assert.equal(harness.turnstileCalls(), 0);
    assert.equal(consoleError.mock.callCount(), 1);
  });
});
