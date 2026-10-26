import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// --- Email (opcional): se activa solo si hay credenciales SMTP en .env ---
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function saveSubmission(entry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let list = [];
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, "utf8");
    list = JSON.parse(raw);
  } catch {
    list = [];
  }
  list.push(entry);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf8");
}

app.post("/api/contact", async (req, res) => {
  try {
    // Honeypot anti-spam: campo oculto que un humano nunca completa.
    if (req.body.website) {
      return res.status(200).json({ ok: true });
    }

    const nombre = String(req.body.nombre || "").trim();
    const whatsapp = String(req.body.whatsapp || "").trim();
    const mensaje = String(req.body.mensaje || "").trim();

    if (!nombre || !whatsapp || !mensaje) {
      return res
        .status(400)
        .json({ ok: false, error: "Faltan campos obligatorios." });
    }
    if (nombre.length > 120 || whatsapp.length > 40 || mensaje.length > 2000) {
      return res
        .status(400)
        .json({ ok: false, error: "Algún campo es demasiado largo." });
    }

    const entry = {
      nombre,
      whatsapp,
      mensaje,
      fecha: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
    };

    await saveSubmission(entry);

    if (transporter && process.env.CONTACT_TO) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.CONTACT_TO,
          subject: `Nueva consulta de ${nombre}`,
          text: `Nombre: ${nombre}\nWhatsApp: ${whatsapp}\n\nMensaje:\n${mensaje}\n\nFecha: ${entry.fecha}`,
        });
      } catch (mailErr) {
        console.error("No se pudo enviar el email:", mailErr.message);
        // La consulta ya quedó guardada; no fallamos la request por el email.
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Error del servidor. Intentá de nuevo." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  if (!transporter) {
    console.log(
      "Email desactivado (sin SMTP en .env). Las consultas se guardan en data/submissions.json"
    );
  }
});
