/* =====================================================
   Brew Haven — script.js
   Vanilla JS only. Each block does one thing and is
   commented so it's easy to read top-to-bottom.
   ===================================================== */

(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- 1. Current year in footer ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. Mobile navigation toggle ----------
     Hamburger opens an overlay drawer on small screens.
     We also close it after a link click for a clean UX. */
  const navToggle = $("#nav-toggle");
  const primaryNav = $("#primary-nav");

  function setNavOpen(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    primaryNav.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setNavOpen(!isOpen);
    });

    primaryNav.addEventListener("click", (e) => {
      if (e.target.matches("a")) setNavOpen(false);
    });

    // Close drawer on Escape for keyboard users
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  /* ---------- 3. Header style on scroll ----------
     Adds a subtle border once the user scrolls past hero. */
  const header = $("#site-header");
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- 4. Smooth scroll for in-page anchors ----------
     CSS handles it via `scroll-behavior: smooth`, but we also
     adjust for the sticky header height so headings aren't hidden. */
  const headerOffset = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 72;

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ---------- 5. Active nav link via IntersectionObserver ----------
     Highlights the link of the section currently in view. */
  const sections = $$("main section[id]");
  const navLinks = $$(".primary-nav .nav-link");
  const linkBySection = new Map(
    navLinks.map((a) => [a.getAttribute("href").slice(1), a])
  );

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linkBySection.get(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      {
        // Trigger when section is roughly centered in viewport
        rootMargin: "-45% 0px -50% 0px",
        threshold: 0,
      }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------- 6. Reveal-on-scroll animations ----------
     Adds .in to .reveal elements once they enter the viewport.
     The CSS handles the actual fade + translate transition. */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: just show everything
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- 7. Scroll-to-top button ---------- */
  const toTop = $("#to-top");
  if (toTop) {
    const toggleToTop = () => {
      const show = window.scrollY > 600;
      toTop.classList.toggle("visible", show);
      toTop.hidden = !show;
    };
    toggleToTop();
    window.addEventListener("scroll", toggleToTop, { passive: true });
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---------- 8. Contact form validation ----------
     Client-side only. Replace the success block with a real
     API call (fetch) when wiring up a backend. */
  const form = $("#contact-form");
  if (form) {
    const status = $("#form-status");

    const validators = {
      name: (v) => v.trim().length >= 2 || "Please enter your name.",
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Enter a valid email address.",
      phone: (v) =>
        !v.trim() ||
        /^[0-9 +()\-]{7,}$/.test(v.trim()) ||
        "Enter a valid phone number.",
      message: (v) =>
        v.trim().length >= 10 || "Message should be at least 10 characters.",
    };

    function validateField(field) {
      const input = form.elements[field];
      const wrap = input.closest(".field");
      const errorEl = wrap.querySelector(".error");
      const result = validators[field](input.value);
      const valid = result === true;
      wrap.classList.toggle("invalid", !valid);
      errorEl.textContent = valid ? "" : result;
      input.setAttribute("aria-invalid", String(!valid));
      return valid;
    }

    // Live validation as the user leaves each field
    Object.keys(validators).forEach((field) => {
      const input = form.elements[field];
      if (!input) return;
      input.addEventListener("blur", () => validateField(field));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("invalid")) {
          validateField(field);
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const allValid = Object.keys(validators)
        .map(validateField)
        .every(Boolean);

      if (!allValid) {
        status.textContent = "Please fix the highlighted fields.";
        status.style.color = "#b3402a";
        return;
      }

      // Simulated success — replace with a real fetch() to your backend
      status.style.color = "";
      status.textContent = "Thanks! We'll be in touch within one business day.";
      form.reset();
    });
  }

  /* ---------- 9. Reservation form ----------
     Validates name, email, date (today or later),
     time (within opening hours 7am–8pm), and party size (1–8). */
  const rForm = $("#reservation-form");
  if (rForm) {
    const rStatus = $("#reservation-status");
    const dateInput = $("#r-date");

    // Restrict the date picker to today + 90 days
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const max = new Date(today);
    max.setDate(max.getDate() + 90);
    if (dateInput) {
      dateInput.min = fmt(today);
      dateInput.max = fmt(max);
    }

    const rValidators = {
      rname: (v) => v.trim().length >= 2 || "Please enter your full name.",
      remail: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Enter a valid email address.",
      rdate: (v) => {
        if (!v) return "Please pick a date.";
        const picked = new Date(v + "T00:00");
        const t = new Date(); t.setHours(0, 0, 0, 0);
        if (picked < t) return "Date can't be in the past.";
        return true;
      },
      rtime: (v) => {
        if (!v) return "Please pick a time.";
        const [h, m] = v.split(":").map(Number);
        const mins = h * 60 + m;
        if (mins < 7 * 60 || mins > 20 * 60) return "We're open 7:00am – 8:00pm.";
        return true;
      },
      rparty: (v) => {
        const n = parseInt(v, 10);
        if (!Number.isFinite(n)) return "Enter a number.";
        if (n < 1) return "At least 1 guest.";
        if (n > 8) return "For 9+, please call us.";
        return true;
      },
    };

    function validateR(field) {
      const input = rForm.elements[field];
      const wrap = input.closest(".field");
      const errEl = wrap.querySelector(".error");
      const result = rValidators[field](input.value);
      const valid = result === true;
      wrap.classList.toggle("invalid", !valid);
      if (errEl) errEl.textContent = valid ? "" : result;
      input.setAttribute("aria-invalid", String(!valid));
      return valid;
    }

    Object.keys(rValidators).forEach((field) => {
      const input = rForm.elements[field];
      if (!input) return;
      input.addEventListener("blur", () => validateR(field));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("invalid")) validateR(field);
      });
    });

    rForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Object.keys(rValidators).map(validateR).every(Boolean);
      if (!ok) {
        rStatus.textContent = "Please fix the highlighted fields.";
        rStatus.style.color = "#b3402a";
        return;
      }
      const name = rForm.elements.rname.value.trim();
      const date = rForm.elements.rdate.value;
      const time = rForm.elements.rtime.value;
      const party = rForm.elements.rparty.value;
      rStatus.style.color = "";
      rStatus.textContent = `Thanks, ${name}! Table for ${party} on ${date} at ${time} — we'll email a confirmation shortly.`;
      rForm.reset();
    });
  }

  /* ---------- 10. Animated counters ----------
     Numbers in the hero count up from 0 the first time they enter
     the viewport. Honors prefers-reduced-motion via the CSS guard
     and a one-shot Observer (we just snap to the value). */
  const counters = $$("[data-count]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic for a satisfying settle
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && counters.length) {
    const cObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => cObs.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- 11. Newsletter signup ----------
     Tiny inline form in the footer. Validates email and shows
     a friendly confirmation. Swap the success path for a real
     POST when wiring to a provider (Mailchimp, Buttondown, etc.). */
  const nlForm = $("#newsletter-form");
  if (nlForm) {
    const nlStatus = $("#nl-status");
    const nlInput = $("#nl-email");
    nlForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (nlInput.value || "").trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) {
        nlStatus.style.color = "#ecb877";
        nlStatus.textContent = "Please enter a valid email.";
        nlInput.focus();
        return;
      }
      nlStatus.style.color = "";
      nlStatus.textContent = "You're in! Check your inbox to confirm.";
      nlForm.reset();
    });
  }
/* ---------- 12. AI Chatbot ---------- */

const chatToggle = $("#chat-toggle");
const chatWindow = $("#chat-window");
const chatMessages = $("#chat-messages");
const chatInput = $("#chat-input");
const sendChat = $("#send-chat");

if (
  chatToggle &&
  chatWindow &&
  chatMessages &&
  chatInput &&
  sendChat
) {

  chatToggle.addEventListener("click", () => {

    if (chatWindow.style.display === "block") {
      chatWindow.style.display = "none";
    } else {
      chatWindow.style.display = "block";
      chatInput.focus();
    }

  });

  function addMessage(text, cls) {

    const div = document.createElement("div");

    div.className = cls;

    div.textContent = text;

    chatMessages.appendChild(div);

    chatMessages.scrollTop = chatMessages.scrollHeight;

  }

  async function sendMessage() {

    const message = chatInput.value.trim();

    if (!message) return;

    addMessage(message, "user");

    chatInput.value = "";

    try {

      const res = await fetch("https://brew-haven-api.up.railway.app/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message
        })

      });

      const data = await res.json();

      addMessage(data.reply, "bot");

    } catch {

      addMessage(
        "Sorry! AI server is offline.",
        "bot"
      );

    }

  }

  sendChat.addEventListener("click", sendMessage);

  chatInput.addEventListener("keypress", function(e){

    if(e.key==="Enter"){

      sendMessage();

    }

  });

}
})();
