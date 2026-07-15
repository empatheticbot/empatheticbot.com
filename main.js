// empatheticbot.com — small, honest JavaScript. Everything works without it.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Header: hairline border once you've scrolled. */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

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
    { threshold: 0, rootMargin: "0px 0px -40px" }
  );
  revealables.forEach((el) => observer.observe(el));
  // Never let content stay hidden — e.g. when printing.
  window.addEventListener("beforeprint", () => {
    revealables.forEach((el) => el.classList.add("in"));
  });
} else {
  revealables.forEach((el) => el.classList.add("in"));
}

/* The bot glances toward your cursor. Empathy, in a small way.
   Transforms are written directly to the few eye groups inside one
   requestAnimationFrame loop — never via root-level CSS variables,
   which force WebKit to restyle the whole document per mouse event. */
const heroBot = document.querySelector(".bot");
const allEyes = document.querySelectorAll(".bot-eyes");
if (heroBot && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  let targetX = 0;
  let targetY = 0;
  let gazeX = 0;
  let gazeY = 0;
  let gazeRaf = null;

  const render = () => {
    gazeX += (targetX - gazeX) * 0.22;
    gazeY += (targetY - gazeY) * 0.22;
    const settled = Math.abs(targetX - gazeX) < 0.01 && Math.abs(targetY - gazeY) < 0.01;
    if (settled) {
      gazeX = targetX;
      gazeY = targetY;
    }
    const transform = `translate(${gazeX.toFixed(2)}px, ${gazeY.toFixed(2)}px)`;
    allEyes.forEach((group) => (group.style.transform = transform));
    gazeRaf = settled ? null : requestAnimationFrame(render);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      const rect = heroBot.getBoundingClientRect();
      if (rect.bottom < 0) return;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height * 0.56);
      const angle = Math.atan2(dy, dx);
      const reach = Math.min(1, Math.hypot(dx, dy) / 260) * 1.1;
      targetX = Math.cos(angle) * reach;
      targetY = Math.sin(angle) * reach;
      if (!gazeRaf) gazeRaf = requestAnimationFrame(render);
    },
    { passive: true }
  );
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
  open: [[11, 17.999], [11, 18], [11, 18.001]],
  happy: [[7.6, 19.6], [11, 14.6], [14.4, 19.6]],
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
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    smile = from + (target - from) * easeOutCubic(progress);
    drawEyes(smile);
    if (progress < 1) smileRaf = requestAnimationFrame(tick);
  };
  smileRaf = requestAnimationFrame(tick);
}

document.querySelectorAll('a[href="#contact"]').forEach((cta) => {
  for (const [on, off] of [["pointerenter", "pointerleave"], ["focus", "blur"]]) {
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

/* Contact form: fetch-submit when an endpoint is configured,
   otherwise fall back to a pre-filled email. */
const form = document.querySelector(".contact-form");
if (form) {
  const note = form.querySelector(".form-note");
  const endpointConfigured = !form.action.includes("YOUR_FORM_ID");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    if (!endpointConfigured) {
      // No endpoint yet — compose an email instead so nothing gets lost.
      const lines = [];
      for (const [key, value] of data.entries()) {
        if (value) lines.push(`${key}: ${value}`);
      }
      const address = ["hello", "empatheticbot.com"].join("@");
      const subject = encodeURIComponent(`Project inquiry from ${data.get("name") || "the website"}`);
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
      note.textContent = "Opening your email app — send that message over and I'll be in touch.";
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    note.textContent = "Sending…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      form.reset();
      note.classList.add("success");
      note.textContent = "Got it — thank you! I read every submission and will reply within two business days.";
    } catch (error) {
      note.textContent = "Hmm, that didn't go through. Please try again, or email hello@empatheticbot.com directly.";
      button.disabled = false;
    }
  });
}

/* Footer year. */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
