// Serverless function para Vercel: maneja POST /api/contact.
// En Vercel el filesystem es efímero y de solo lectura (salvo /tmp), así que
// el canal real para recibir las consultas es el email por SMTP.
// Configurá en Vercel (Settings → Environment Variables):
//   SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT (opcional), SMTP_FROM (opcional), CONTACT_TO
// Si no hay SMTP, la consulta se guarda en /tmp solo de forma temporal (se pierde).
import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
  // Best-effort: en serverless solo /tmp es escribible y es efímero.
  try {
    const file = path.join(os.tmpdir(), "submissions.json");
    let list = [];
    try {
      list = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      list = [];
    }
    list.push(entry);
    await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("No se pudo guardar en /tmp:", err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }

  try {
    const body = req.body || {};

    // Honeypot anti-spam: campo oculto que un humano nunca completa.
    if (body.website) {
      return res.status(200).json({ ok: true });
    }

    const nombre = String(body.nombre || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const mensaje = String(body.mensaje || "").trim();

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
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
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
        // No fallamos la request por el email.
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Error del servidor. Intentá de nuevo." });
  }
}
