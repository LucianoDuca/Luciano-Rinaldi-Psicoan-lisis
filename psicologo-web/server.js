import express from "express";
import compression from "compression";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { securityHeaders, sameOrigin } from "./lib/security.js";
import {
  issueFormToken,
  checkFormToken,
  rateLimited,
  isDuplicate,
  validateContact,
} from "./lib/antispam.js";
import { emailEnabled, sendContactEmail } from "./lib/email.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
// URL pública del sitio (para canonical, sitemap y robots): el dominio propio.
// Se puede cambiar con la variable SITE_URL.
const SITE_URL = (process.env.SITE_URL || "https://www.lucianorinaldi.com").replace(/\/$/, "");

// En Vercel el disco es de solo lectura salvo /tmp (y se borra): ahí la copia
// local es solo un respaldo; las consultas llegan por email.
const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(__dirname, "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

// Render (y casi cualquier hosting) pone un proxy delante: confiamos en el
// primer salto para leer la IP real del visitante.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(compression());

// ---------- SEO: robots.txt y sitemap.xml ----------
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

app.get("/sitemap.xml", async (req, res) => {
  let lastmod = new Date().toISOString().slice(0, 10);
  try {
    const st = await fs.stat(path.join(__dirname, "public", "index.html"));
    lastmod = st.mtime.toISOString().slice(0, 10);
  } catch {}
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${SITE_URL}/</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n` +
      `  <url><loc>${SITE_URL}/privacidad</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>\n` +
      `</urlset>\n`
  );
});

// ---------- Página de privacidad (URL limpia) ----------
app.get("/privacidad", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, "public", "privacidad.html"));
});
app.get("/privacidad.html", (req, res) => res.redirect(301, "/privacidad"));

// ---------- Archivos estáticos ----------
app.use(
  express.static(path.join(__dirname, "public"), {
    dotfiles: "ignore",
    setHeaders(res, filePath) {
      // Imágenes, video y fuentes: caché larga. HTML/CSS/JS: siempre revalidar
      // (no tienen hash en el nombre, así los cambios se ven al instante).
      if (/[\\/]assets[\\/]/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// ---------- Formulario de contacto ----------
const api = express.Router();
api.use(express.json({ limit: "10kb", type: "application/json" }));

// Token firmado que la página pide al cargar (trampa de tiempo anti-bot).
api.get("/form-token", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ token: issueFormToken() });
});

async function saveSubmission(entry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let list = [];
  try {
    list = JSON.parse(await fs.readFile(SUBMISSIONS_FILE, "utf8"));
  } catch {
    list = [];
  }
  list.push(entry);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf8");
}

// Respuesta "exitosa" que se le da a los bots, para que no insistan.
const fakeOk = (res) => res.json({ ok: true });

api.post("/contact", async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const ip = req.ip || "desconocida";

  if (!sameOrigin(req)) {
    return res.status(403).json({ ok: false, error: "Solicitud no permitida." });
  }

  // Honeypot
  if (body.website) return fakeOk(res);

  const tokenProblem = checkFormToken(body.token);
  if (tokenProblem === "too-fast") return fakeOk(res);
  if (tokenProblem) {
    return res.status(400).json({
      ok: false,
      retry: true,
      error: "La página estuvo abierta mucho tiempo. Intenta enviar de nuevo.",
    });
  }

  // Primero se valida: un error de tipeo no consume intentos del límite.
  const result = validateContact(body);
  if (result.error) return res.status(400).json({ ok: false, error: result.error });
  if (result.spam) return fakeOk(res);

  if (rateLimited(ip)) {
    return res.status(429).json({
      ok: false,
      error: "Recibí varias consultas seguidas. Espera unos minutos o escríbeme por WhatsApp.",
    });
  }

  const { nombre, whatsapp, mensaje } = result.data;
  if (isDuplicate(`${nombre}|${whatsapp}|${mensaje}`)) return fakeOk(res);

  const entry = { nombre, whatsapp, mensaje, fecha: new Date().toISOString() };

  try {
    await saveSubmission(entry);
  } catch (err) {
    console.error("No se pudo guardar la consulta:", err.message);
  }

  if (emailEnabled()) {
    try {
      await sendContactEmail(entry);
    } catch (err) {
      console.error("No se pudo enviar el email:", err.message);
      // La consulta quedó guardada; no le mostramos el error técnico a la persona.
    }
  }

  return res.json({ ok: true });
});

app.use("/api", api);

// ---------- 404 y errores ----------
app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "No encontrado." }));
app.use((req, res) =>
  res
    .status(404)
    .type("html")
    .send(
      '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Página no encontrada</title></head>' +
        '<body style="font-family:Georgia,serif;text-align:center;padding:4rem 1rem;color:#3a2d22;background:#f4ece0">' +
        '<h1 style="font-weight:400">Página no encontrada</h1><p><a href="/" style="color:#3a2d22">Volver al inicio</a></p></body></html>'
    )
);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ ok: false, error: "El mensaje es demasiado largo." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: "Solicitud inválida." });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: "Error del servidor. Intenta de nuevo." });
});

// Vercel usa la app exportada como función; en Render o local, escucha en un puerto.
export default app;

if (!process.env.VERCEL) app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(
    emailEnabled()
      ? "Email activo: las consultas se envían por Resend."
      : "Email desactivado (falta RESEND_API_KEY o CONTACT_TO). Las consultas se guardan en data/submissions.json"
  );
});
