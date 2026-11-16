// Capas anti-bot para el formulario de contacto (sin servicios externos):
//   1. Token firmado (HMAC) que la página pide al cargar: un bot que hace POST
//      directo al endpoint, sin cargar la página, no lo tiene.
//   2. Trampa de tiempo: un humano tarda al menos unos segundos en completar el
//      formulario; si llega antes, es automático. El token también vence.
//   3. Honeypot: campo oculto que una persona nunca completa.
//   4. Límite de envíos por IP (ventana corta y diaria).
//   5. Filtros de contenido: links, HTML, formato del teléfono, duplicados.
import crypto from "node:crypto";

// Si no se define FORM_SECRET se genera uno al arrancar: los tokens emitidos
// antes de un reinicio dejan de valer, y la página pide uno nuevo sola.
const SECRET = process.env.FORM_SECRET || crypto.randomBytes(32).toString("hex");

const MIN_FILL_MS = 3_000; // menos de 3 s para completar = bot
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // el token vale 24 h

const sign = (payload) =>
  crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

export function issueFormToken() {
  const payload = `${Date.now()}.${crypto.randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

// Devuelve null si el token es válido, o el motivo del rechazo.
export function checkFormToken(token, now = Date.now()) {
  if (typeof token !== "string" || token.length > 200) return "missing";
  const parts = token.split(".");
  if (parts.length !== 3) return "malformed";
  const [ts, nonce, sig] = parts;
  const expected = sign(`${ts}.${nonce}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "bad-signature";
  const age = now - Number(ts);
  if (!Number.isFinite(age) || age < 0) return "malformed";
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > TOKEN_TTL_MS) return "expired";
  return null;
}

// ---- Límite de envíos por IP (memoria; alcanza para un solo servidor) ----
const WINDOWS = [
  { ms: 10 * 60 * 1000, max: 5 }, // 5 envíos cada 10 minutos
  { ms: 24 * 60 * 60 * 1000, max: 10 }, // 10 envíos por día
];
const hits = new Map(); // ip -> [timestamps]

export function rateLimited(ip, now = Date.now()) {
  const longest = WINDOWS[WINDOWS.length - 1].ms;
  const list = (hits.get(ip) || []).filter((t) => now - t < longest);
  const blocked = WINDOWS.some(
    (w) => list.filter((t) => now - t < w.ms).length >= w.max
  );
  if (!blocked) list.push(now);
  hits.set(ip, list);
  return blocked;
}

// Limpieza periódica para que el mapa no crezca indefinidamente.
setInterval(() => {
  const now = Date.now();
  const longest = WINDOWS[WINDOWS.length - 1].ms;
  for (const [ip, list] of hits) {
    if (!list.some((t) => now - t < longest)) hits.delete(ip);
  }
}, 60 * 60 * 1000).unref();

// ---- Duplicados: mismo contenido reenviado varias veces ----
const recent = new Map(); // hash -> timestamp
export function isDuplicate(text, now = Date.now()) {
  const h = crypto.createHash("sha256").update(text).digest("hex");
  for (const [k, t] of recent) if (now - t > 60 * 60 * 1000) recent.delete(k);
  if (recent.has(h)) return true;
  recent.set(h, now);
  return false;
}

// ---- Validación y filtros de contenido ----
const URL_RE = /(https?:\/\/|www\.)\S+/gi;
const HTML_RE = /<\/?[a-z][^>]*>/i;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const clean = (v) => String(v ?? "").replace(CONTROL_RE, "").trim();

// Devuelve { data } si es válido o { error, spam } si no.
export function validateContact(body) {
  const nombre = clean(body.nombre).replace(/\s+/g, " ");
  const whatsapp = clean(body.whatsapp);
  const mensaje = clean(body.mensaje);

  if (!nombre || !whatsapp || !mensaje) {
    return { error: "Por favor completa todos los campos." };
  }
  if (nombre.length < 2 || nombre.length > 80) {
    return { error: "Revisa tu nombre." };
  }
  if (whatsapp.length > 30 || !/^[+\d\s().-]+$/.test(whatsapp)) {
    return { error: "El WhatsApp solo puede tener números, espacios y el signo +." };
  }
  const digits = whatsapp.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15) {
    return { error: "Revisa el número de WhatsApp (con código de país)." };
  }
  if (mensaje.length < 10) {
    return { error: "Cuéntame un poco más en el mensaje." };
  }
  if (mensaje.length > 2000) {
    return { error: "El mensaje es demasiado largo (máximo 2000 caracteres)." };
  }

  // Señales típicas de spam: se rechazan en silencio (el bot cree que funcionó).
  const links = (mensaje.match(URL_RE) || []).length;
  if (/(https?:\/\/|www\.)\S/i.test(nombre) || links > 1 || HTML_RE.test(mensaje) || HTML_RE.test(nombre)) {
    return { spam: true };
  }

  return { data: { nombre, whatsapp, mensaje } };
}
