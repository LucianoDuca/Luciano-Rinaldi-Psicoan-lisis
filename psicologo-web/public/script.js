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

// Token anti-bot: se pide al cargar la página y se envía con el formulario.
let formToken = null;
async function loadFormToken() {
  try {
    const res = await fetch("/api/form-token", { cache: "no-store" });
    if (res.ok) formToken = (await res.json()).token;
  } catch {
    formToken = null;
  }
}

const setStatus = (type, text) => {
  status.className = `form__status${type ? ` ${type}` : ""}`;
  status.textContent = text;
};

async function postContact(data) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, token: formToken }),
  });
  let json = {};
  try {
    json = await res.json();
  } catch {}
  return { res, json };
}

if (form) {
  loadFormToken();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    const data = {
      nombre: form.nombre.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      mensaje: form.mensaje.value.trim(),
      website: form.website.value, // honeypot
    };

    if (!data.nombre || !data.whatsapp || !data.mensaje) {
      setStatus("error", "Por favor completa todos los campos.");
      return;
    }
    if (!/^[+\d\s().-]{7,30}$/.test(data.whatsapp)) {
      setStatus("error", "Revisa el número de WhatsApp (solo números, espacios y +).");
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Enviando…";

    try {
      if (!formToken) await loadFormToken();
      let { res, json } = await postContact(data);

      // Token vencido (por ejemplo, la pestaña quedó abierta varios días):
      // se pide uno nuevo y se reintenta una vez.
      if (json.retry) {
        await loadFormToken();
        await new Promise((r) => setTimeout(r, 3200));
        ({ res, json } = await postContact(data));
      }

      if (res.ok && json.ok) {
        form.reset();
        setStatus("ok", "¡Gracias! Tu consulta fue enviada. Luciano te responderá a la brevedad.");
        loadFormToken();
      } else {
        setStatus(
          "error",
          json.error || "No se pudo enviar. Prueba de nuevo o escribe por WhatsApp."
        );
      }
    } catch (err) {
      setStatus("error", "Hubo un problema de conexión. Prueba de nuevo o escribe por WhatsApp.");
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
addReveal(".sobre-mi__body", "reveal--right");
addReveal(".honorarios, .contacto-aside, .form, .frase-foto__quote, .footer-inner, .espacio__item figcaption, .pull-quote__sign");
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

// ===================== DIAMANTE 3D =====================
// Un brillante de 8 lados dibujado en SVG: "Yo" en la tabla (cara de arriba) y
// una dimensión de la vida en cada faceta de la corona. Se gira arrastrando con
// el dedo o el mouse (o con las flechas), y gira solo despacio cuando nadie lo toca.
(() => {
  const svg = document.querySelector(".diamante__svg");
  if (!svg) return;
  const figure = svg.closest(".diamante");
  const NS = "http://www.w3.org/2000/svg";
  const PALABRAS = ["Mi historia", "Familia", "Pareja", "Amigos", "Trabajo", "Cultura", "Deporte", "Economía"];

  // ---- Geometría (radio de la cintura = 1, eje y hacia arriba) ----
  const N = 8, R_TABLA = 0.56, ALTO_CORONA = 0.44, ALTO_PABELLON = 0.92;
  const CENTRO_Y = (ALTO_CORONA - ALTO_PABELLON) / 2; // gira alrededor de su centro
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
  const anillo = (r, y) =>
    Array.from({ length: N }, (_, i) => {
      const t = -((i + 0.5) / N) * Math.PI * 2; // de izquierda a derecha
      return [r * Math.cos(t), y - CENTRO_Y, r * Math.sin(t)];
    });
  const cintura = anillo(1, 0);
  const tabla = anillo(R_TABLA, ALTO_CORONA);
  const culet = [0, -ALTO_PABELLON - CENTRO_Y, 0];

  const caras = [];
  const agregarCara = (pts, palabra, u, v) => {
    const c = mul(pts.reduce(add, [0, 0, 0]), 1 / pts.length);
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(n, c) < 0) n = mul(n, -1); // normal hacia afuera
    caras.push({ pts, c, n, palabra, u, v });
  };
  agregarCara(tabla, "Yo", [1, 0, 0], [0, 0, 1]);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const pts = [cintura[i], cintura[j], tabla[j], tabla[i]];
    const u = norm(sub(cintura[i], cintura[j]));
    const baja = sub(mul(add(cintura[i], cintura[j]), 0.5), mul(add(tabla[i], tabla[j]), 0.5));
    const v = norm(sub(baja, mul(u, dot(baja, u))));
    agregarCara(pts, PALABRAS[i], u, v);
  }
  for (let i = 0; i < N; i++) agregarCara([cintura[i], cintura[(i + 1) % N], culet]);

  // ---- Elementos SVG (se crean una vez y se actualizan en cada cuadro) ----
  const grupo = (cls) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", cls);
    return svg.appendChild(g);
  };
  const atras = grupo("diamante__atras");
  const frente = grupo("diamante__frente");
  const textos = grupo("diamante__palabras");
  textos.setAttribute("aria-hidden", "true");
  for (const cara of caras) {
    cara.poly = document.createElementNS(NS, "polygon");
    atras.appendChild(cara.poly);
    if (!cara.palabra) continue;
    const t = document.createElementNS(NS, "text");
    t.textContent = cara.palabra;
    if (cara.palabra === "Yo") t.setAttribute("class", "diamante__yo");
    cara.fs = cara.palabra === "Yo" ? 30 : 11; // en centésimas del radio
    t.setAttribute("font-size", cara.fs);
    textos.appendChild(t);
    cara.text = t;
  }
  // Achica las palabras largas para que entren en su faceta
  const ajustarPalabras = () => {
    for (const cara of caras) {
      if (!cara.text || cara.palabra === "Yo") continue;
      const ancho = cara.text.getComputedTextLength();
      if (ancho > 48) cara.text.setAttribute("font-size", ((cara.fs * 48) / ancho).toFixed(2));
    }
  };
  ajustarPalabras();
  document.fonts?.ready.then(ajustarPalabras);

  // ---- Color tornasolado: cambia según hacia dónde mira cada cara ----
  const TONOS = [[240, 213, 184], [211, 224, 194], [221, 205, 233], [201, 223, 232]];
  const LUZ = norm([-0.45, 0.75, 0.6]);
  const MEDIO = norm(add(LUZ, [0, 0, 1]));
  const tono = (n) => {
    let t = (Math.atan2(n[1], n[0]) / (Math.PI * 2) + 0.5 + n[2] * 0.3) % 1;
    if (t < 0) t += 1;
    const x = t * TONOS.length, i = Math.floor(x) % TONOS.length, f = x - Math.floor(x);
    const a = TONOS[i], b = TONOS[(i + 1) % TONOS.length];
    const luz = 0.86 + 0.22 * Math.max(0, dot(n, LUZ));
    const brillo = Math.pow(Math.max(0, dot(n, MEDIO)), 30) * 0.85;
    const canal = (k) => {
      const base = (a[k] + (b[k] - a[k]) * f) * luz;
      return Math.round(Math.min(255, base + (255 - base) * brillo));
    };
    return `rgb(${canal(0)},${canal(1)},${canal(2)})`;
  };

  // ---- Proyección y dibujo ----
  const ESCALA = 182, CX = 200, CY = 200;
  let giro = 0.35, inclinacion = 0.3;
  const rotar = (p, cy, sy, cp, sp) => {
    const x = p[0] * cy + p[2] * sy;
    const z = -p[0] * sy + p[2] * cy;
    return [x, p[1] * cp - z * sp, p[1] * sp + z * cp];
  };
  const dibujar = () => {
    const cy = Math.cos(giro), sy = Math.sin(giro), cp = Math.cos(inclinacion), sp = Math.sin(inclinacion);
    const r = (p) => rotar(p, cy, sy, cp, sp);
    // "Yo" acompaña el giro pero siempre queda derecho
    caras[0].u = [cy, 0, sy];
    caras[0].v = [-sy, 0, cy];
    for (const cara of caras) {
      const n = r(cara.n);
      const visible = n[2] > 0;
      const destino = visible ? frente : atras;
      if (cara.poly.parentNode !== destino) destino.appendChild(cara.poly);
      cara.poly.setAttribute(
        "points",
        cara.pts.map((p) => { const q = r(p); return `${(CX + q[0] * ESCALA).toFixed(1)},${(CY - q[1] * ESCALA).toFixed(1)}`; }).join(" ")
      );
      cara.poly.setAttribute("fill", tono(n));
      if (!cara.text) continue;
      // Las palabras se desvanecen al ponerse de perfil
      const alfa = Math.min(1, Math.max(0, (n[2] - 0.12) * 3.5));
      cara.text.setAttribute("opacity", alfa.toFixed(2));
      if (!alfa) continue;
      const c = r(cara.c), u = r(cara.u), v = r(cara.v), k = ESCALA / 100;
      let a = u[0] * k, b = -u[1] * k;
      const cc = v[0] * k, d = -v[1] * k;
      if (a * d - b * cc < 0) { a = -a; b = -b; } // nunca en espejo
      cara.text.setAttribute(
        "transform",
        `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${cc.toFixed(4)} ${d.toFixed(4)} ${(CX + c[0] * ESCALA).toFixed(1)} ${(CY - c[1] * ESCALA).toFixed(1)})`
      );
    }
  };

  // ---- Interacción: arrastrar con inercia, giro lento en reposo ----
  const GIRO_SOLO = reduceMotion ? 0 : 0.0035;
  let velocidad = GIRO_SOLO, arrastrando = null, visibleEnPantalla = false, cuadro = 0;
  const limitar = (x) => Math.min(1.25, Math.max(-0.5, x));
  const animar = () => {
    cuadro = 0;
    if (!arrastrando) {
      velocidad += (GIRO_SOLO - velocidad) * 0.04; // la inercia vuelve al giro lento
      giro += velocidad;
    }
    dibujar();
    const quieto = !arrastrando && Math.abs(velocidad) < 1e-4;
    if (visibleEnPantalla && !quieto) cuadro = requestAnimationFrame(animar);
  };
  const arrancar = () => { if (!cuadro) cuadro = requestAnimationFrame(animar); };

  svg.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    arrastrando = { x: e.clientX, y: e.clientY, id: e.pointerId };
    svg.setPointerCapture(e.pointerId);
    figure.classList.add("is-dragging");
    velocidad = 0;
    arrancar();
  });
  svg.addEventListener("pointermove", (e) => {
    if (!arrastrando || e.pointerId !== arrastrando.id) return;
    const dx = e.clientX - arrastrando.x, dy = e.clientY - arrastrando.y;
    arrastrando.x = e.clientX; arrastrando.y = e.clientY;
    const paso = (dx / svg.getBoundingClientRect().width) * 5.5;
    giro += paso;
    velocidad = velocidad * 0.5 + paso * 0.5;
    if (e.pointerType !== "touch") inclinacion = limitar(inclinacion + dy * 0.008);
  });
  const soltar = (e) => {
    if (!arrastrando || e.pointerId !== arrastrando.id) return;
    arrastrando = null;
    figure.classList.remove("is-dragging");
    velocidad = Math.max(-0.25, Math.min(0.25, velocidad));
    arrancar();
  };
  svg.addEventListener("pointerup", soltar);
  svg.addEventListener("pointercancel", soltar);
  svg.addEventListener("keydown", (e) => {
    const teclas = { ArrowLeft: [-0.35, 0], ArrowRight: [0.35, 0], ArrowUp: [0, -0.2], ArrowDown: [0, 0.2] };
    const t = teclas[e.key];
    if (!t) return;
    e.preventDefault();
    giro += t[0];
    inclinacion = limitar(inclinacion + t[1]);
    dibujar();
  });

  // Solo anima mientras está en pantalla
  new IntersectionObserver(([entrada]) => {
    visibleEnPantalla = entrada.isIntersecting;
    if (visibleEnPantalla) arrancar();
  }).observe(svg);
  dibujar();
})();
