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

  const resetTurnstile = () => {
    if (window.turnstile && turnstileWidget) window.turnstile.reset("#contact-turnstile");
  };

  window.handleTurnstileError = () => {
    note.classList.remove("success");
    note.textContent =
      "The security check couldn’t load. Please try again, or email hello@empatheticbot.com.";
    return true;
  };

  window.handleTurnstileExpired = () => {
    note.classList.remove("success");
    note.textContent = "The security check expired. Please complete it again.";
  };

  /* The widget stays hidden (and out of the tab order) until Turnstile
     reports that a visible, interactive challenge is actually required. */
  window.handleTurnstileInteractive = () => {
    turnstileWrap.classList.remove("turnstile-pending");
    turnstileWrap.inert = false;
  };

  window.handleTurnstileInteractiveEnd = () => {
    turnstileWrap.classList.add("turnstile-pending");
    turnstileWrap.inert = true;
  };

  /* Use the provider's public test key locally so npm start exercises the
     complete form without weakening the production widget. */
  const localHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);
  turnstileWidget.dataset.sitekey = localHostnames.has(window.location.hostname)
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

    if (!data.get("cf-turnstile-response")) {
      note.classList.remove("success");
      note.textContent = "Please complete the security check before sending.";
      return;
    }

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
      note.textContent =
        "Got it — thank you! I read every submission and will reply within two business days.";
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

/* Footer year. */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
