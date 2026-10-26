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

- El endpoint `POST /api/contact` valida los datos y **siempre** guarda la consulta en
  `data/submissions.json`.
- Si completás las credenciales SMTP en `.env`, además envía un email a Luciano con
  cada consulta. Sin SMTP, el sitio funciona igual (solo guarda en el archivo).

Para activar el email, copiá `.env.example` a `.env` y completá:

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO
```

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

Al ser Node + Express, se despliega en cualquier hosting con Node (Render, Railway,
Fly.io, un VPS, etc.). El `data/submissions.json` necesita almacenamiento persistente;
si el hosting es efímero, conviene activar el envío por email vía SMTP.
