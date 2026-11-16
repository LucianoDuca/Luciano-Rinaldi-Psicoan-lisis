// Envío de las consultas por email usando la API HTTPS de Resend.
// Render (plan Free) bloquea los puertos SMTP, por eso usamos HTTPS.
//
// Variables de entorno:
//   RESEND_API_KEY  → clave de la cuenta de Resend (re_...)
//   CONTACT_TO      → email donde llegan las consultas. Sin dominio verificado
//                     en Resend, tiene que ser el mismo email de la cuenta.
//   CONTACT_FROM    → opcional. Por defecto "Web Luciano Rinaldi <onboarding@resend.dev>".
//                     Con un dominio verificado se puede usar uno propio.

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Web Luciano Rinaldi <onboarding@resend.dev>";

export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO);
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Quita saltos de línea para que no se puedan inyectar cabeceras en el asunto.
const oneLine = (s) => String(s).replace(/[\r\n]+/g, " ").trim();

export async function sendContactEmail({ nombre, whatsapp, mensaje, fecha }) {
  if (!emailEnabled()) return { sent: false, reason: "disabled" };

  const to = process.env.CONTACT_TO.split(",").map((s) => s.trim()).filter(Boolean);
  const digits = whatsapp.replace(/[^\d]/g, "");
  const waLink = digits ? `https://wa.me/${digits}` : null;

  const text = [
    "Nueva consulta desde la web",
    "",
    `Nombre: ${nombre}`,
    `WhatsApp: ${whatsapp}${waLink ? ` (${waLink})` : ""}`,
    "",
    "Mensaje:",
    mensaje,
    "",
    `Fecha: ${fecha}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#3a2d22;line-height:1.6">
      <h2 style="font-weight:normal;margin:0 0 16px">Nueva consulta desde la web</h2>
      <p style="margin:0 0 6px"><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p style="margin:0 0 6px"><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}${
        waLink ? ` · <a href="${waLink}">Abrir chat</a>` : ""
      }</p>
      <p style="margin:16px 0 6px"><strong>Mensaje:</strong></p>
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(mensaje)}</p>
      <p style="margin:20px 0 0;color:#8c7a66;font-size:13px">${escapeHtml(fecha)}</p>
    </div>`;

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || DEFAULT_FROM,
      to,
      subject: oneLine(`Nueva consulta de ${nombre}`).slice(0, 150),
      text,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
  return { sent: true };
}
