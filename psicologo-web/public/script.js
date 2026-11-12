// ===================== CONFIG =====================
// Número de Luciano en formato internacional, sin "+", sin espacios.
// +54 9 2664 745666 (Argentina, San Luis) → 5492664745666
const WHATSAPP_NUMBER = "5492664745666";
const WHATSAPP_MSG = "Hola Luciano, quiero reservar una sesión";

// ===================== NAV PANEL =====================
const navToggle = document.getElementById("navToggle");
const navPanel = document.getElementById("navPanel");
const navOverlay = document.getElementById("navOverlay");
const siteHeader = document.getElementById("top");

function openNav() {
  navPanel.classList.add("open");
  siteHeader.classList.add("nav-open");
  navOverlay.hidden = false;
  requestAnimationFrame(() => navOverlay.classList.add("show"));
  navToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}
function closeNav() {
  navPanel.classList.remove("open");
  siteHeader.classList.remove("nav-open");
  navOverlay.classList.remove("show");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  setTimeout(() => {
    navOverlay.hidden = true;
  }, 350);
}

navToggle.addEventListener("click", () => {
  const isOpen = navPanel.classList.contains("open");
  isOpen ? closeNav() : openNav();
});
navOverlay.addEventListener("click", closeNav);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navPanel.classList.contains("open")) closeNav();
});
// Cerrar al tocar un link del panel (el menú es hamburguesa en todos los tamaños)
document.querySelectorAll("[data-nav]").forEach((a) =>
  a.addEventListener("click", closeNav)
);

// ===================== WHATSAPP LINK =====================
const waLink = document.getElementById("whatsappLink");
if (waLink) {
  waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MSG
  )}`;
}

// ===================== AÑO FOOTER =====================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===================== FORMULARIO =====================
const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form__status";
    status.textContent = "";

    const data = {
      nombre: form.nombre.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      mensaje: form.mensaje.value.trim(),
      website: form.website.value, // honeypot
    };

    if (!data.nombre || !data.whatsapp || !data.mensaje) {
      status.className = "form__status error";
      status.textContent = "Por favor completá todos los campos.";
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Enviando…";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        form.reset();
        status.className = "form__status ok";
        status.textContent =
          "¡Gracias! Tu consulta fue enviada. Luciano te responderá a la brevedad.";
      } else {
        status.className = "form__status error";
        status.textContent =
          json.error || "No se pudo enviar. Prueba de nuevo o escribe por WhatsApp.";
      }
    } catch (err) {
      status.className = "form__status error";
      status.textContent =
        "Hubo un problema de conexión. Prueba de nuevo o escribe por WhatsApp.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waUrl = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

// ===================== PRELOADER =====================
const preloader = document.getElementById("preloader");
let ready = false;
function startSite() {
  if (ready) return;
  ready = true;
  preloader?.classList.add("done");
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");
  setTimeout(() => preloader?.remove(), 1300);
  // El acento manuscrito del hero ("Soy Luciano Rinaldi") se escribe tras la entrada
  setTimeout(
    () => document.querySelectorAll(".hero .reveal-write").forEach((el) => el.classList.add("in")),
    1000
  );
  setTimeout(showCookieBanner, 1800);
  setTimeout(showWaHint, 4500);
}
if (!preloader) {
  startSite();
} else {
  // Mínimo ~2.1 s para que se vea la animación; máximo 4 s aunque falten recursos.
  const minDelay = new Promise((r) => setTimeout(r, 2100));
  const loaded = new Promise((r) =>
    document.readyState === "complete" ? r() : window.addEventListener("load", r)
  );
  Promise.race([
    Promise.all([minDelay, loaded]),
    new Promise((r) => setTimeout(r, 4000)),
  ]).then(startSite);
}

// ===================== TEXTO PALABRA POR PALABRA =====================
function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
          } else {
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--i", i++);
            w.appendChild(inner);
            frag.appendChild(w);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(el);
  // Los títulos con línea son flex: agrupamos las palabras para que no se encojan
  if (el.classList.contains("sec-title--rule")) {
    const wrap = document.createElement("span");
    wrap.className = "split__line";
    wrap.append(...el.childNodes);
    el.appendChild(wrap);
  }
  el.classList.add("split");
}
document
  .querySelectorAll(".hero-title, .sec-title, .pull-quote, .hero-figure__quote, .formacion__titulo")
  .forEach(splitWords);

// ===================== REVEAL AL SCROLL =====================
const addReveal = (selector, variant, stagger) => {
  document.querySelectorAll(selector).forEach((el, idx) => {
    el.classList.add("reveal");
    if (variant) el.classList.add(variant);
    if (stagger) el.style.setProperty("--d", idx % stagger);
  });
};
addReveal(".sec-num, .eyebrow:not(.hero *), .section-lead:not(.hero *)");
addReveal(".situacion", "reveal--left");
addReveal(".formacion__item", null, 3);
addReveal(".concept", null, 3);
addReveal(".etapa", "reveal--scale", 2);
addReveal(".trust", "reveal--left");
addReveal(".pasos__list > li", null, 3);
addReveal(".sobre-mi__body", "reveal--right");
addReveal(".honorarios, .contacto-aside, .form, .vincular-illustration, .footer-inner, .espacio__item figcaption, .pull-quote__sign");
document
  .querySelectorAll(".script-accent:not(.hero-inner *), .nav-panel__accent")
  .forEach((el) => el.classList.add("reveal-write"));

// Se revisa la posición con getBoundingClientRect (y no con IntersectionObserver)
// porque los elementos que arrancan recortados con clip-path —video, fotos y
// textos manuscritos— nunca cuentan como "visibles" para el observer.
let pendingReveal = [
  ...document.querySelectorAll(
    ".reveal, .split:not(.hero *), .reveal-write:not(.hero *), [data-reveal]:not(.hero *), .sec-title--rule"
  ),
];
function checkReveals() {
  if (!pendingReveal.length) return;
  const limit = window.innerHeight * 0.92;
  pendingReveal = pendingReveal.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return true; // oculto (p. ej. menú cerrado)
    if (r.top < limit && r.bottom > 0) {
      el.classList.add("in");
      return false;
    }
    // Si ya quedó arriba (salto directo a un ancla), mostrarlo igual
    if (r.bottom <= 0) {
      el.classList.add("in");
      return false;
    }
    return true;
  });
}

// ===================== SCROLL: progreso, header, parallax, volver arriba =====================
const progress = document.getElementById("scrollProgress");
const toTop = document.getElementById("toTop");
const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  siteHeader.classList.toggle("scrolled", y > 40);
  checkReveals();
  toTop?.classList.toggle("show", y > window.innerHeight * 1.2);
  if (!reduceMotion) {
    const vh = window.innerHeight;
    parallaxEls.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const speed = parseFloat(img.dataset.parallax) || 0.06;
      const offset = (r.top + r.height / 2 - vh / 2) * -speed;
      img.style.setProperty("--py", `${offset.toFixed(1)}px`);
    });
  }
  ticking = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
onScroll();
window.addEventListener("resize", onScroll);
toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ===================== VIDEO DE BIENVENIDA =====================
const videoPlayer = document.getElementById("videoPlayer");
const video = document.getElementById("welcomeVideo");
const videoPlay = document.getElementById("videoPlay");
if (video && videoPlay) {
  videoPlay.addEventListener("click", () => {
    video.controls = true;
    videoPlayer.classList.add("playing");
    video.play().catch(() => {});
  });
  video.addEventListener("ended", () => {
    videoPlayer.classList.remove("playing");
    video.controls = false;
    video.currentTime = 0;
  });
}

// ===================== WHATSAPP FLOTANTE =====================
const waFloat = document.getElementById("waFloat");
const waToggle = document.getElementById("waToggle");
const waHint = document.getElementById("waHint");
document.querySelectorAll("[data-wa-msg]").forEach((a) => {
  a.href = waUrl(a.dataset.waMsg);
  a.addEventListener("click", () => setWaOpen(false));
});
function setWaOpen(open) {
  waFloat.classList.toggle("open", open);
  waToggle.setAttribute("aria-expanded", String(open));
  waToggle.setAttribute(
    "aria-label",
    open ? "Cerrar mensajes rápidos" : "Abrir mensajes rápidos de WhatsApp"
  );
  if (open) waHint.classList.remove("show");
}
waToggle?.addEventListener("click", () =>
  setWaOpen(!waFloat.classList.contains("open"))
);
document.addEventListener("click", (e) => {
  if (waFloat?.classList.contains("open") && !waFloat.contains(e.target)) setWaOpen(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && waFloat?.classList.contains("open")) setWaOpen(false);
});
function showWaHint() {
  if (!waHint || waFloat.classList.contains("open")) return;
  waHint.classList.add("show");
  setTimeout(() => waHint.classList.remove("show"), 5000);
}

// ===================== COOKIES =====================
const COOKIE_KEY = "lr-cookie-consent";
const cookieBanner = document.getElementById("cookieBanner");
const cookiePrefs = document.getElementById("cookiePrefs");
const cookieConfig = document.getElementById("cookieConfig");
const cookieAnalytics = document.getElementById("cookieAnalytics");

function readConsent() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_KEY));
  } catch {
    return null;
  }
}
function syncCookieOffset() {
  if (!cookieBanner || cookieBanner.hidden) return;
  // En pantallas angostas el banner ocupa todo el ancho: subimos los botones flotantes
  const narrow = window.innerWidth < 760;
  const h = narrow ? cookieBanner.offsetHeight + 30 : 18;
  document.body.style.setProperty("--cookie-h", `${h}px`);
}
function showCookieBanner(force) {
  if (!cookieBanner) return;
  const saved = readConsent();
  if (saved && !force) return;
  if (saved && cookieAnalytics) cookieAnalytics.checked = !!saved.analytics;
  cookieBanner.hidden = false;
  document.body.classList.add("cookie-open");
  requestAnimationFrame(() => {
    syncCookieOffset();
    cookieBanner.classList.add("show");
  });
}
function hideCookieBanner() {
  cookieBanner.classList.remove("show");
  document.body.classList.remove("cookie-open");
  setTimeout(() => (cookieBanner.hidden = true), 800);
}
cookieBanner?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cookie]");
  if (!btn) return;
  const prefsOpen = !cookiePrefs.hidden;
  const analytics =
    btn.dataset.cookie === "all" ? true : prefsOpen ? cookieAnalytics.checked : false;
  try {
    localStorage.setItem(
      COOKIE_KEY,
      JSON.stringify({ necessary: true, analytics, date: new Date().toISOString() })
    );
  } catch {}
  hideCookieBanner();
});
cookieConfig?.addEventListener("click", () => {
  const open = cookiePrefs.hidden;
  cookiePrefs.hidden = !open;
  cookieConfig.setAttribute("aria-expanded", String(open));
  cookieConfig.textContent = open ? "Ocultar opciones" : "Configurar";
  // Con opciones abiertas, el botón secundario guarda la selección
  cookieBanner.querySelector('[data-cookie="necessary"]').textContent = open
    ? "Guardar selección"
    : "Solo necesarias";
  syncCookieOffset();
});
document.getElementById("openCookies")?.addEventListener("click", () => showCookieBanner(true));
window.addEventListener("resize", syncCookieOffset);
