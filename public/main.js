// empatheticbot.com — small, honest JavaScript. Everything works without it.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Header: hairline border once you've scrolled. */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* The native mobile menu still works without JavaScript. When JavaScript is
   available, close it after a destination is chosen so it does not obscure
   the section the visitor just opened. */
const mobileNavigation = document.querySelector(".mobile-navigation");
if (mobileNavigation) {
  for (const link of mobileNavigation.querySelectorAll("a")) {
    link.addEventListener("click", () => mobileNavigation.removeAttribute("open"));
  }
}

/* Reveal-on-scroll. If anything's unsupported, everything is simply visible. */
const revealables = document.querySelectorAll(".reveal");
if (!reducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0, rootMargin: "0px 0px -40px" },
  );
  for (const el of revealables) observer.observe(el);
  document.documentElement.classList.add("reveal-enabled");
  // Never let content stay hidden — e.g. when printing.
  window.addEventListener("beforeprint", () => {
    for (const el of revealables) el.classList.add("in");
  });
} else {
  for (const el of revealables) el.classList.add("in");
}

/* Every bot glances toward your cursor — each from where it actually
   sits on the page, so the header, hero, and footer look in different
   directions. When there's no cursor (touch devices) or it has been
   still for a while, each bot leisurely looks around on its own.
   Transforms are written directly to the eye groups inside one
   requestAnimationFrame loop — never via root-level CSS variables,
   which force WebKit to restyle the whole document per mouse event. */
if (!reducedMotion) {
  const bots = [...document.querySelectorAll(".bot-eyes")].map((eyes) => ({
    svg: eyes.closest("svg"),
    eyes,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    speed: 0.22,
  }));
  let gazeRaf = null;
  let lastPointerAt = -Infinity;

  const onScreen = (bot) => {
    const rect = bot.svg.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top <= window.innerHeight ? rect : null;
  };

  const render = () => {
    let settled = true;
    for (const bot of bots) {
      bot.x += (bot.tx - bot.x) * bot.speed;
      bot.y += (bot.ty - bot.y) * bot.speed;
      if (Math.abs(bot.tx - bot.x) < 0.01 && Math.abs(bot.ty - bot.y) < 0.01) {
        bot.x = bot.tx;
        bot.y = bot.ty;
      } else {
        settled = false;
      }
      bot.eyes.style.transform = `translate(${bot.x.toFixed(2)}px, ${bot.y.toFixed(2)}px)`;
    }
    gazeRaf = settled ? null : requestAnimationFrame(render);
  };

  const wake = () => {
    if (!gazeRaf) gazeRaf = requestAnimationFrame(render);
  };

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        lastPointerAt = performance.now();
        for (const bot of bots) {
          const rect = onScreen(bot);
          if (!rect) continue;
          const dx = event.clientX - (rect.left + rect.width / 2);
          const dy = event.clientY - (rect.top + rect.height * 0.56);
          const angle = Math.atan2(dy, dx);
          const reach = Math.min(1, Math.hypot(dx, dy) / 260) * 1.1;
          bot.tx = Math.cos(angle) * reach;
          bot.ty = Math.sin(angle) * reach;
          bot.speed = 0.22;
        }
        wake();
      },
      { passive: true },
    );
  }

  /* Idle wandering: on its own clock, each bot picks somewhere to look —
     mostly small glances, sometimes back to center. */
  const wander = (bot) => {
    if (performance.now() - lastPointerAt > 4000 && onScreen(bot)) {
      const angle = Math.random() * Math.PI * 2;
      const reach = Math.random() < 0.25 ? 0 : 0.4 + Math.random() * 0.7;
      bot.tx = Math.cos(angle) * reach;
      bot.ty = Math.sin(angle) * reach;
      bot.speed = 0.07;
      wake();
    }
    setTimeout(() => wander(bot), 2600 + Math.random() * 4200);
  };
  bots.forEach((bot, i) => {
    setTimeout(() => wander(bot), 1800 + i * 1100 + Math.random() * 1500);
  });
}

/* He blinks now and then — occasionally twice, like anyone. */
if (!reducedMotion) {
  const blinkOnce = () => {
    document.body.classList.add("blink");
    setTimeout(() => document.body.classList.remove("blink"), 260);
  };
  const blink = () => {
    if (!document.body.classList.contains("happy")) {
      blinkOnce();
      if (Math.random() < 0.25) setTimeout(blinkOnce, 360);
    }
    setTimeout(blink, 2800 + Math.random() * 3600);
  };
  setTimeout(blink, 2200);
}

/* Happy eyes when you're about to say hello: the round eye morphs into
   an upward half-moon. Safari has no CSS `d` property, so the morph is
   done here — interpolating the path attribute works in every browser. */
const EYE = {
  open: [
    [11, 17.999],
    [11, 18],
    [11, 18.001],
  ],
  happy: [
    [7.6, 19.6],
    [11, 14.6],
    [14.4, 19.6],
  ],
  strokeOpen: 8,
  strokeHappy: 2.4,
};
const leftEyes = document.querySelectorAll(".bot-eye-left");
const rightEyes = document.querySelectorAll(".bot-eye-right");
let smile = 0; // 0 = open, 1 = happy
let smileRaf = null;

function drawEyes(t) {
  const lerp = (a, b) => a + (b - a) * t;
  const p = EYE.open.map((pt, i) => [lerp(pt[0], EYE.happy[i][0]), lerp(pt[1], EYE.happy[i][1])]);
  const d = (dx) =>
    `M${(p[0][0] + dx).toFixed(3)},${p[0][1].toFixed(3)} Q${(p[1][0] + dx).toFixed(3)},${p[1][1].toFixed(3)} ${(p[2][0] + dx).toFixed(3)},${p[2][1].toFixed(3)}`;
  const stroke = lerp(EYE.strokeOpen, EYE.strokeHappy).toFixed(2);
  leftEyes.forEach((eye) => {
    eye.setAttribute("d", d(0));
    eye.setAttribute("stroke-width", stroke);
  });
  rightEyes.forEach((eye) => {
    eye.setAttribute("d", d(10));
    eye.setAttribute("stroke-width", stroke);
  });
}

function morphTo(target) {
  cancelAnimationFrame(smileRaf);
  if (reducedMotion) {
    smile = target;
    drawEyes(smile);
    return;
  }
  const from = smile;
  const start = performance.now();
  const duration = 260;
  const easeOutCubic = (x) => 1 - (1 - x) ** 3;
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    smile = from + (target - from) * easeOutCubic(progress);
    drawEyes(smile);
    if (progress < 1) smileRaf = requestAnimationFrame(tick);
  };
  smileRaf = requestAnimationFrame(tick);
}

const happyTriggers = [
  ...document.querySelectorAll('a[href="#contact"]'),
  ...document.querySelectorAll(".contact-form button[type=submit]"),
];
happyTriggers.forEach((cta) => {
  for (const [on, off] of [
    ["pointerenter", "pointerleave"],
    ["focus", "blur"],
  ]) {
    cta.addEventListener(on, () => {
      document.body.classList.add("happy");
      morphTo(1);
    });
    cta.addEventListener(off, () => {
      document.body.classList.remove("happy");
      morphTo(0);
    });
  }
});

/* Contact form: enhance the native POST with an in-place status message. */
const form = document.querySelector(".contact-form");
if (form) {
  const note = form.querySelector(".form-note");
  const button = form.querySelector('button[type="submit"]');
  const turnstileWidget = form.querySelector(".cf-turnstile");
  const turnstileWrap = turnstileWidget.closest(".turnstile-wrap");
  let turnstileToken = "";
  let turnstileSubmissionPending = false;

  const hideTurnstile = () => {
    turnstileWrap.classList.add("turnstile-pending");
    turnstileWrap.inert = true;
  };

  const resetTurnstile = () => {
    turnstileToken = "";
    turnstileSubmissionPending = false;
    hideTurnstile();
    if (window.turnstile && turnstileWidget) window.turnstile.reset("#contact-turnstile");
  };

  window.handleTurnstileError = () => {
    turnstileToken = "";
    turnstileSubmissionPending = false;
    hideTurnstile();
    note.classList.remove("success");
    note.textContent =
      "The security check couldn’t load. Please try again, or email hello@empatheticbot.com.";
    return true;
  };

  window.handleTurnstileExpired = () => {
    turnstileToken = "";
    turnstileSubmissionPending = false;
    hideTurnstile();
    note.classList.remove("success");
    note.textContent = "The security check expired. Select Send it over to try again.";
  };

  window.handleTurnstileTimeout = () => {
    turnstileToken = "";
    turnstileSubmissionPending = false;
    hideTurnstile();
    note.classList.remove("success");
    note.textContent = "The security check timed out. Select Send it over to try again.";
  };

  window.handleTurnstileSuccess = (token) => {
    turnstileToken = token;
    hideTurnstile();
    if (turnstileSubmissionPending) {
      turnstileSubmissionPending = false;
      form.requestSubmit();
    }
  };

  /* The widget stays hidden (and out of the tab order) until Turnstile
     reports that a visible, interactive challenge is actually required. */
  window.handleTurnstileInteractive = () => {
    turnstileWrap.classList.remove("turnstile-pending");
    turnstileWrap.inert = false;
    note.classList.remove("success");
    note.textContent = "Please complete the security check, then your message will send.";
  };

  window.handleTurnstileInteractiveEnd = hideTurnstile;

  /* Use the provider's public test key locally and on the isolated test
     Worker without weakening the production widget. */
  const turnstileTestHostnames = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
    "empatheticbot-com-test.empatheticbot.workers.dev",
  ]);
  turnstileWidget.dataset.sitekey = turnstileTestHostnames.has(window.location.hostname)
    ? "1x00000000000000000000AA"
    : "0x4AAAAAAD4lhcXg34wOO6Wb";
  const turnstileScript = document.createElement("script");
  turnstileScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  turnstileScript.async = true;
  turnstileScript.defer = true;
  document.head.append(turnstileScript);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    if (!turnstileToken) {
      if (turnstileSubmissionPending) return;

      note.classList.remove("success");
      if (!window.turnstile) {
        note.textContent =
          "The security check is still loading. Please try again, or email hello@empatheticbot.com.";
        return;
      }

      turnstileSubmissionPending = true;
      note.textContent = "Running a quick security check…";
      try {
        window.turnstile.execute("#contact-turnstile");
      } catch {
        window.handleTurnstileError();
      }
      return;
    }

    data.set("cf-turnstile-response", turnstileToken);
    button.disabled = true;
    note.classList.remove("success");
    note.textContent = "Sending…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "That didn’t go through. Please try again.");
      }
      form.reset();
      resetTurnstile();
      note.classList.add("success");
      note.textContent = "Sent — opening your next steps…";
      /* replace(), not assign(): Back should return to wherever the visitor
         came from, never to a spent form they might submit a second time. */
      window.location.replace("/thanks");
    } catch (error) {
      resetTurnstile();
      const message =
        error instanceof Error ? error.message : "That didn’t go through. Please try again.";
      note.textContent = `${message} You can also email hello@empatheticbot.com directly.`;
    } finally {
      button.disabled = false;
    }
  });
}

/* 404 pratfall: measure where the falling 404 actually meets the bot's head.
   Both are fluid-sized and they clamp at different breakpoints, so no single
   authored offset lands on his head at every width. The stylesheet ships a
   calc() approximation as the no-JS default; this replaces it with the real
   painted geometry.

   The heart and antenna sit above the rounded shell, so the topmost SVG ink is
   not the collision point visitors read as his head. The body path is marked
   explicitly in 404.html and getBBox() gives its crown in viewBox units. For
   the type, TextMetrics reports how far the digits' ink actually descends in
   their line box. Neither measurement is affected by the animation transforms,
   so both remain safe to recalculate after a resize.

   This deliberately runs ahead of time rather than watching for the hit. The
   squash has to *start* on the contact frame, so the distance has to be known
   before the animation is composited — see the note on IntersectionObserver
   in the commit; observing the collision would report it a frame or more after
   it happened, and only ever for boxes, never ink. */
function measureBonkDistance() {
  const bot = document.querySelector(".error-bot");
  const head = bot?.querySelector(".error-bot-head");
  const code = document.querySelector(".error-code");
  const page = document.querySelector(".error-page");
  if (!bot || !head || !code || !page || typeof head.getBBox !== "function") return;

  let headBox;
  try {
    headBox = head.getBBox();
  } catch {
    return;
  }
  if (!headBox.width || !headBox.height) return;

  const viewBox = bot.viewBox.baseVal;
  const botHeight = parseFloat(getComputedStyle(bot).height);
  if (!viewBox?.height || !botHeight) return;
  const botHead = (headBox.y - viewBox.y) * (botHeight / viewBox.height);

  /* How far the digits' lowest ink sits below the top of their line box. */
  const type = getComputedStyle(code);
  measureBonkDistance.context ||= document.createElement("canvas").getContext("2d");
  const context = measureBonkDistance.context;
  if (!context) return;
  context.font = `${type.fontStyle} ${type.fontWeight} ${type.fontSize} ${type.fontFamily}`;
  const glyphs = context.measureText(code.textContent.trim());
  const lineBox = code.getBoundingClientRect().height;
  const fontAscent = glyphs.fontBoundingBoxAscent ?? glyphs.actualBoundingBoxAscent;
  const fontDescent = glyphs.fontBoundingBoxDescent ?? glyphs.actualBoundingBoxDescent;
  const actualDescent = glyphs.actualBoundingBoxDescent ?? 0;
  const halfLeading = (lineBox - (fontAscent + fontDescent)) / 2;
  const codeInk = halfLeading + fontAscent + actualDescent;
  if (!Number.isFinite(codeInk)) return;

  const gap = parseFloat(getComputedStyle(page).rowGap) || 0;
  /* A couple of pixels of optical overlap prevent antialiasing around the
     curved crown from reading as a gap at the exact contact frame. */
  const contactOverlap = Math.max(2, Math.round(botHeight * 0.02));
  const bonk = Math.round(botHead - botHeight - gap - codeInk + contactOverlap);
  /* Written to whichever copy is actually animating. The rebound is resolved
     here too: the stage copy sits outside .error-page, so it can't see the
     --code-size the stylesheet's calc() version depends on. */
  const target = fallingCode ?? code;
  target.style.setProperty("--bonk", `${bonk}px`);
  target.style.setProperty("--bonk-rebound", `${Math.round(bonk - 0.35 * lineBox)}px`);
}

/* The falling 404 is animated inside a fixed, viewport-sized stage rather than
   in the page itself. Two things fall out of that, both of which the in-page
   version could never get right:

   A fixed subtree contributes nothing to scrollable overflow, so the 404 can
   travel far below the bottom edge without producing a scrollbar — no clipping
   needed to hold it back. And the stage's own box IS the viewport, so the edge
   it disappears at is the edge of the screen by construction: no measuring the
   header, no min-height arithmetic, correct at every window size and scroll
   offset.

   The in-page 404 stays where it is to hold its slot in the grid, hidden with
   its animation off. Without JavaScript none of this happens and it keeps the
   plain CSS fall inside .error-page's own overflow:clip — which cuts at that
   box's bottom edge rather than the screen's, the very thing this replaces. */
let fallingCode = null;
let fallStage = null;

function buildFallStage(page) {
  const code = page.querySelector(".error-code");
  if (!code || fallingCode) return fallStage;

  const stage = document.createElement("div");
  stage.className = "fall-stage";
  stage.setAttribute("aria-hidden", "true");

  fallingCode = code.cloneNode(true);
  fallingCode.removeAttribute("id");
  stage.appendChild(fallingCode);
  document.body.appendChild(stage);
  page.classList.add("has-fall-stage");
  fallStage = stage;

  /* The fixed copy is only needed while the digits travel beyond the viewport.
     Once the performance is over, atomically reveal the real in-page 404 and
     retire the stage. Leaving the fixed copy alive would make scroll updates
     chase the document position and visibly jitter behind the page. */
  fallingCode.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName !== "code-crash") return;
      page.classList.replace("has-fall-stage", "fall-complete");
      stage.remove();
      fallingCode = null;
      fallStage = null;
    },
    { once: true },
  );
  return stage;
}

/* Pin the clone over the slot the real one occupies. Viewport coordinates, so
   they can be used as-is inside the fixed stage. */
function placeFallingCode(page) {
  if (!fallingCode) return;
  const box = page.querySelector(".error-code").getBoundingClientRect();
  fallingCode.style.left = `${box.left}px`;
  fallingCode.style.top = `${box.top}px`;
  fallingCode.style.width = `${box.width}px`;
}

const errorPage = document.querySelector(".error-page");
if (errorPage) {
  /* Reduced motion collapses the whole timeline to its resting pose, so there
     is no travel to stage — leave the real 404 in place and visible. */
  if (!reducedMotion) {
    const stage = buildFallStage(errorPage);
    placeFallingCode(errorPage);
    measureBonkDistance();

    /* Fraunces has a different descent to the fallback serif. Finish measuring
       after it is ready, then release both paused actors in one style update.
       This gives them the same CSS start frame without timestamp bookkeeping. */
    const playScene = () => {
      placeFallingCode(errorPage);
      measureBonkDistance();
      requestAnimationFrame(() => {
        errorPage.classList.add("is-playing");
        stage?.classList.add("is-playing");
      });
    };
    if (document.fonts?.ready) document.fonts.ready.then(playScene, playScene);
    else playScene();
  } else {
    measureBonkDistance();
  }
  /* The clone is pinned to the viewport, so it has to be re-pinned as the page
     scrolls under it or it would drift away from its slot. */
  window.addEventListener("scroll", () => placeFallingCode(errorPage), { passive: true });
  /* Watch the box rather than the window: both the mascot and the type are
     sized off the viewport, so anything that moves them resizes this element —
     and unlike a resize listener this also covers zoom and the initial layout
     pass, which fires the observer once on its own. */
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      placeFallingCode(errorPage);
      measureBonkDistance();
    }).observe(errorPage);
  }
}

/* Footer year. */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
