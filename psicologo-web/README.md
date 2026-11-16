# Landing — Luciano Rinaldi · Psicoanálisis Vincular Relacional

Landing page para captar pacientes de la comunidad latina en Florida (terapia online).
Frontend estático + backend propio en Node.js/Express con formulario de contacto.

## Estructura

```
psicologo/
├─ server.js            # Backend Express: sirve el sitio y recibe el formulario
├─ package.json
├─ .env.example         # Copiar a .env y completar (SMTP opcional)
├─ data/                # Se crea solo; guarda las consultas (submissions.json)
└─ public/              # Frontend estático
   ├─ index.html
   ├─ styles.css
   ├─ script.js
   └─ assets/           # Logo y favicon (placeholders)
```

## Cómo correrlo

Requiere Node.js 18 o superior.

```bash
npm install
npm start
```

Abrí http://localhost:3000

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Formulario de contacto

- `POST /api/contact` valida los datos, guarda la consulta en `data/submissions.json`
  y, si hay credenciales, la envía por email con **Resend** (API HTTPS: funciona en
  Render Free, que bloquea SMTP).
- Variables (ver `.env.example`): `RESEND_API_KEY`, `CONTACT_TO`, opcional `CONTACT_FROM`.
  Sin dominio verificado en Resend, `CONTACT_TO` debe ser el email de la cuenta de Resend.

### Protección anti-bot (`lib/antispam.js`)

1. Token firmado (HMAC) que la página pide en `GET /api/form-token` al cargar.
2. Trampa de tiempo: envíos en menos de 3 s se descartan; el token vence a las 24 h.
3. Honeypot (campo oculto `website`).
4. Límite por IP (solo envíos válidos): 5 cada 10 min y 10 por día.
5. Filtros: links o HTML en el mensaje, formato del WhatsApp, duplicados.
6. Solo se aceptan envíos desde el mismo origen (cabecera Origin/Referer).

A los bots detectados se les responde "ok" para que no reintenten.

### Seguridad (`lib/security.js`)

Content-Security-Policy, HSTS (en producción), X-Frame-Options, nosniff,
Referrer-Policy, Permissions-Policy, límite de 10 KB en el cuerpo de las peticiones
y manejo de errores sin exponer detalles internos.

## Pendientes para reemplazar (placeholders)

Todo esto está marcado en el código con comentarios `PLACEHOLDER`.

Las imágenes actuales son **fotos de stock de [Pexels](https://www.pexels.com)**
(uso gratuito, sin atribución obligatoria), puestas como relleno hasta tener las
reales. Reemplazá el archivo manteniendo el mismo nombre y queda listo:

| Archivo / lugar | Qué reemplazar |
|---|---|
| `public/script.js` → `WHATSAPP_NUMBER` | Número real de WhatsApp de Luciano (formato internacional, sin "+") |
| `public/assets/hero-ambiente.jpg` | Foto de Luciano sonriendo en ambiente de naturaleza (hero, banda ancha ~16:7) |
| `public/assets/luciano-portrait.jpg` | Retrato de Luciano para "Sobre mí" (vertical ~4:5) |
| `public/assets/espacio-interior.jpg` | Portada del micro-video o foto del espacio (~16:10) |
| Sección video (`index.html`) | Micro-video de bienvenida real (30–45 s) en lugar de la portada |
| Sección "Sobre mí" | Logos reales de las 3 universidades (hoy monogramas UNSL / URA / LCH) |
| `public/assets/logo-lr.svg` | Logo "LR" definitivo si hay uno de marca |

## Contenido

El texto proviene del brief del cliente (`Página profesional.pdf`). Combina la
propuesta de la IA con lo que el propio Luciano pidió poner en la página.

## Deploy

Publicado en Render (Web Service, plan Free): Root Directory `psicologo-web`,
build `npm install`, start `npm start`. Cada push a `main` se publica solo.
En Render Free el disco es efímero: activar Resend para no perder consultas.
Definir `NODE_ENV=production` para activar HSTS.
