/* Website Temptations — site script
   No third-party SDKs. No tracking. Everything here runs locally in the browser. */

/* ===== CONFIG — edit these before going live ===== */
const CONFIG = {
  // Where form submissions are POSTed as JSON. send-request.php runs on Hostinger and emails
  // them to the address set inside it. Set to "" to fall back to the visitor's email app (mailto:).
  formEndpoint: "send-request.php",
  contactEmail: "scottyshopstore@gmail.com",
  privacyEmail: "scottyshopstore@gmail.com",
  policyVersion: "2026-10-01"
};
/* ================================================== */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initYear();
  initCookieConsent();
  initSteps("request-form");
  initPackageButtons();
  initForm("request-form", "Website request");
  initForm("privacy-form", "Privacy / data request");
  initChildrenToggle();
  initReveal();
});

/* ---------- Dark / light mode ----------
   The <head> script already applied the saved theme before paint; this wires up the button.
   The choice is kept in localStorage ("wt_theme"), listed in cookies.html as strictly necessary. */
function initTheme() {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const buttons = document.querySelectorAll("[data-theme-toggle]");

  const sync = () => {
    const light = root.getAttribute("data-theme") === "light";
    buttons.forEach(b => {
      b.setAttribute("aria-pressed", String(light));
      b.querySelector(".visually-hidden").textContent = "Light mode";
      b.title = light ? "Switch to dark mode" : "Switch to light mode";
    });
    if (meta) meta.setAttribute("content", light ? "#E6DFD1" : "#182F47");
  };

  const apply = theme => {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("wt_theme", theme); } catch { /* storage blocked */ }
    sync();
    announce(theme === "light" ? "Light mode on" : "Dark mode on");
  };

  buttons.forEach(b => b.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    // Cross-fade the whole page where supported; instant otherwise or with reduced motion.
    if (document.startViewTransition && !REDUCED_MOTION) document.startViewTransition(() => apply(next));
    else apply(next);
  }));
  sync();
}

/* ---------- Gentle fade-in of sections as they scroll into view ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (REDUCED_MOTION || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(el => io.observe(el));
}

/* ---------- "Choose <package>" buttons pre-select that package in the request form ---------- */
function initPackageButtons() {
  const select = document.getElementById("package");
  if (!select) return;
  document.querySelectorAll("[data-package]").forEach(btn => btn.addEventListener("click", () => {
    select.value = btn.dataset.package;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }));
}

/* ---------- Multi-step form: one short section at a time ---------- */
function initSteps(id) {
  const form = document.getElementById(id);
  if (!form) return;
  const steps = [...form.querySelectorAll(".form-step")];
  const markers = [...form.querySelectorAll(".form-progress li")];
  if (!steps.length) return;
  let current = 0;

  const go = i => {
    current = i;
    steps.forEach((s, n) => (s.hidden = n !== i));
    markers.forEach((m, n) => {
      m.classList.toggle("done", n < i);
      m.classList.toggle("active", n === i);
      if (n === i) m.setAttribute("aria-current", "step"); else m.removeAttribute("aria-current");
    });
    const heading = steps[i].querySelector(".step-title");
    if (heading) heading.focus();
    announce(`Step ${i + 1} of ${steps.length}`);
  };

  form.addEventListener("click", e => {
    if (e.target.closest("[data-next]")) {
      const bad = validate(steps[current]);
      if (bad) { bad.focus(); return; }
      go(current + 1);
    }
    if (e.target.closest("[data-prev]")) go(current - 1);
  });
  form.goToStep = go;
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
}

/* ---------- Mobile navigation (keyboard + screen reader friendly) ---------- */
function initNav() {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (!btn || !nav) return;
  const close = () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    if (open) nav.querySelector("a")?.focus();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("open")) { close(); btn.focus(); }
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
}

/* ---------- Cookie consent ----------
   - Nothing optional loads before a choice is made.
   - "Accept all" and "Reject all" are equally prominent. No pre-ticked boxes.
   - Honors Global Privacy Control (GPC) by defaulting optional categories to off.
   - Optional scripts must be added as:
       <script type="text/plain" data-consent="analytics" src="..."></script>
     and are only activated after consent for that category. */
const CONSENT_KEY = "wt_cookie_consent";

function readConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch { return null; }
}
function saveConsent(prefs) {
  const record = { necessary: true, preferences: !!prefs.preferences, analytics: !!prefs.analytics,
                   version: CONFIG.policyVersion, date: new Date().toISOString() };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch { /* storage blocked */ }
  applyConsent(record);
  return record;
}
function applyConsent(c) {
  if (!c) return;
  document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(old => {
    if (!c[old.dataset.consent]) return;
    const s = document.createElement("script");
    [...old.attributes].forEach(a => { if (a.name !== "type") s.setAttribute(a.name, a.value); });
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
}

function initCookieConsent() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;
  const prefsBox = document.getElementById("cookie-prefs");
  const prefBox = document.getElementById("consent-preferences");
  const anaBox = document.getElementById("consent-analytics");
  const customizeBtn = banner.querySelector("[data-cookie='customize']");
  const saveBtn = banner.querySelector("[data-cookie='save']");
  const gpc = navigator.globalPrivacyControl === true;

  const show = (focus) => {
    const c = readConsent();
    prefBox.checked = !!c?.preferences;
    anaBox.checked = !!c?.analytics && !gpc;
    banner.hidden = false;
    if (focus) banner.querySelector("h2").focus();
  };
  const hide = () => { banner.hidden = true; prefsBox.hidden = true; saveBtn.hidden = true; customizeBtn.hidden = false; };

  const existing = readConsent();
  if (existing && existing.version === CONFIG.policyVersion) applyConsent(existing);
  else show(false);

  banner.addEventListener("click", e => {
    const action = e.target.closest("[data-cookie]")?.dataset.cookie;
    if (!action) return;
    if (action === "accept") { saveConsent({ preferences: true, analytics: !gpc }); hide(); announce("Cookie choices saved."); }
    if (action === "reject") { saveConsent({ preferences: false, analytics: false }); hide(); announce("Optional cookies rejected."); }
    if (action === "customize") { prefsBox.hidden = false; saveBtn.hidden = false; customizeBtn.hidden = true; prefBox.focus(); }
    if (action === "save") { saveConsent({ preferences: prefBox.checked, analytics: anaBox.checked }); hide(); announce("Cookie choices saved."); }
  });

  if (gpc) {
    anaBox.disabled = true;
    document.getElementById("gpc-note").hidden = false;
  }

  document.querySelectorAll("[data-open-cookie-settings]").forEach(b =>
    b.addEventListener("click", () => { show(true); customizeBtn.click(); }));
}

function announce(msg) {
  const live = document.getElementById("live-region");
  if (live) { live.textContent = ""; setTimeout(() => (live.textContent = msg), 50); }
}

/* ---------- Children's-data follow-up question ---------- */
function initChildrenToggle() {
  const radios = document.querySelectorAll("input[name='audience_children']");
  const extra = document.getElementById("children-extra");
  if (!radios.length || !extra) return;
  const update = () => {
    const yes = document.querySelector("input[name='audience_children']:checked")?.value === "yes";
    extra.hidden = !yes;
  };
  radios.forEach(r => r.addEventListener("change", update));
  update();
}

/* ---------- Accessible form validation + submission ---------- */
function initForm(id, subject) {
  const form = document.getElementById(id);
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const firstInvalid = validate(form);
    if (firstInvalid) {
      showStatus(status, "err", "Please fix the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }

    // Collect only fields the visitor actually filled in (data minimisation).
    const data = {};
    new FormData(form).forEach((v, k) => {
      if (k === "website_hp") return; // spam honeypot, never stored
      if (typeof v === "string" && v.trim() === "") return;
      data[k] = data[k] ? [].concat(data[k], v) : v;
    });
    if (new FormData(form).get("website_hp")) return; // bot — silently drop
    data._consent_recorded_at = new Date().toISOString();
    data._policy_version = CONFIG.policyVersion;

    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;

    if (CONFIG.formEndpoint) {
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ form: id, ...data })
        });
        if (res.status === 429) {
          showStatus(status, "err", "You’ve sent a few requests in a row. Please wait a few minutes and try again.");
          return;
        }
        if (!res.ok) throw new Error(res.status);
        form.reset();
        if (form.goToStep) form.goToStep(0);
        initChildrenToggle();
        showStatus(status, "ok", "Thank you — your request was received. We reply within 2 business days.");
      } catch {
        showStatus(status, "err", `Sorry, something went wrong sending your request. Please email us at ${CONFIG.contactEmail} or try again shortly.`);
      } finally { btn.disabled = false; }
      return;
    }

    // No endpoint configured: hand off to the visitor's own email app.
    const to = id === "privacy-form" ? CONFIG.privacyEmail : CONFIG.contactEmail;
    const body = Object.entries(data).map(([k, v]) => `${k.replace(/_/g, " ")}: ${[].concat(v).join(", ")}`).join("\n");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showStatus(status, "ok", "Your email app should now open with your request filled in — press send there to finish. Nothing has been sent yet.");
    btn.disabled = false;
  });

  // Clear an error as soon as the visitor fixes the field
  const clear = e => {
    const el = e.target;
    const group = el.type === "radio" ? form.querySelectorAll(`input[name="${el.name}"]`) : [el];
    group.forEach(g => {
      const digitsOk = !g.dataset.minDigits || g.value.replace(/\D/g, "").length >= Number(g.dataset.minDigits);
      if (g.getAttribute("aria-invalid") === "true" && g.checkValidity() && digitsOk) setError(form, g, "");
    });
  };
  form.addEventListener("input", clear);
  form.addEventListener("change", clear);
}

function validate(form) {
  let first = null;
  form.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.closest("[hidden]") || el.type === "hidden" || el.name === "website_hp") return;
    let msg = "";
    if (!el.checkValidity()) {
      if (el.validity.valueMissing) msg = el.type === "checkbox" ? "Please tick this box to continue." : el.type === "radio" ? "Please choose an option." : "This field is required.";
      else if (el.validity.typeMismatch) msg = el.type === "email" ? "Please enter a valid email address." : "Please enter a valid value.";
      else msg = el.validationMessage;
    } else if (el.dataset.minDigits && el.value.replace(/\D/g, "").length < Number(el.dataset.minDigits)) {
      msg = "Please enter a valid phone number.";
    }
    setError(form, el, msg);
    if (msg && !first) first = el;
  });
  return first;
}

function setError(form, el, msg) {
  const box = form.querySelector(`#${el.id}-error`);
  el.setAttribute("aria-invalid", msg ? "true" : "false");
  if (box) { box.textContent = msg; box.classList.toggle("show", !!msg); }
}

function showStatus(el, type, msg) {
  if (!el) return;
  el.className = `form-status show ${type}`;
  el.textContent = msg;
}
