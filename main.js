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
   (The bot's shapes are shared via <defs>, so the header and footer
   bots glance, blink, and smile in sync with the hero.) */
const heroBot = document.querySelector(".bot");
if (heroBot && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  const eyes = heroBot.querySelector(".bot-eyes");
  window.addEventListener(
    "pointermove",
    (event) => {
      const rect = heroBot.getBoundingClientRect();
      if (rect.bottom < 0) return;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height * 0.56);
      const angle = Math.atan2(dy, dx);
      const reach = Math.min(1, Math.hypot(dx, dy) / 260) * 1.1;
      eyes.style.setProperty("--gaze-x", `${(Math.cos(angle) * reach).toFixed(2)}px`);
      eyes.style.setProperty("--gaze-y", `${(Math.sin(angle) * reach).toFixed(2)}px`);
    },
    { passive: true }
  );
}

/* He blinks now and then — occasionally twice, like anyone. */
if (heroBot && !reducedMotion) {
  const blink = () => {
    if (!heroBot.classList.contains("happy")) {
      heroBot.classList.add("blink");
      setTimeout(() => heroBot.classList.remove("blink"), 260);
      if (Math.random() < 0.25) {
        setTimeout(() => {
          heroBot.classList.add("blink");
          setTimeout(() => heroBot.classList.remove("blink"), 260);
        }, 360);
      }
    }
    setTimeout(blink, 2800 + Math.random() * 3600);
  };
  setTimeout(blink, 2200);
}

/* Happy eyes when you're about to say hello. */
if (heroBot) {
  document.querySelectorAll('a[href="#contact"]').forEach((cta) => {
    for (const [on, off] of [["pointerenter", "pointerleave"], ["focus", "blur"]]) {
      cta.addEventListener(on, () => heroBot.classList.add("happy"));
      cta.addEventListener(off, () => heroBot.classList.remove("happy"));
    }
  });
}

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
