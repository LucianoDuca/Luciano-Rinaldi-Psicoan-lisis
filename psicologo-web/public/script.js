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

// ===================== REVEAL AL SCROLL =====================
const revealEls = document.querySelectorAll(
  ".sec-head, .situacion, .formacion__item, .concept, .etapa, .trust, .pasos__list > li, .video-card, .hero-inner, .hero-figure, .pull-quote, .sobre-mi__grid, .pull-quote__sign"
);
revealEls.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}
