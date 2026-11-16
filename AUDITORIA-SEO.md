# Auditoría SEO: luciano-rinaldi.onrender.com

**Fecha:** 16 de noviembre de 2026
**Sitio:** landing de una sola página, en español, para terapia online
**Público objetivo:** latinos que viven en EE. UU. (foco en Florida) y en el exterior

---

## 1. Resumen

| Área | Antes | Después de los cambios |
|---|---|---|
| SEO técnico (robots, sitemap, canonical, 404) | Débil: no había robots.txt, sitemap ni canonical; las URLs inexistentes respondían con la página de inicio | **Bien** |
| Etiquetas meta y vista previa al compartir | Título y descripción sin palabras de búsqueda; sin Open Graph | **Bien** |
| Datos estructurados (schema.org) | No había | **Bien**: `Person` + `ProfessionalService` |
| Rendimiento (Core Web Vitals) | Correcto; sin compresión, sin caché, imágenes sin dimensiones | **Bien**: gzip, caché, `width/height`, precarga de la foto principal |
| Contenido y palabras clave | Texto de calidad, pero casi sin términos de búsqueda | **A mejorar** (ver punto 4) |
| Autoridad y presencia local | Subdominio gratuito; sin perfil de Google ni enlaces externos | **Pendiente** (ver punto 5) |

El sitio queda técnicamente listo para indexarse. Lo que más va a mover el posicionamiento
de acá en adelante no es código: **dominio propio, Google Search Console, perfiles
externos y contenido orientado a búsquedas reales**.

---

## 2. Qué se corrigió en esta auditoría

### Etiquetas meta
- **Título:** `Psicólogo online en español | Luciano Rinaldi` (45 caracteres, con la búsqueda principal al inicio).
  Antes: "Luciano Rinaldi · Psicoanálisis Vincular Relacional", que solo encuentra quien ya conoce el nombre.
- **Meta descripción** nueva (~155 caracteres) con "terapia online en español", "Lic. en Psicología (MP 1483)", "psicoanálisis vincular-relacional" y "latinos en EE. UU.".
- `canonical`, `robots` (con `max-image-preview:large`), `author` y `theme-color`.

### Vista previa en WhatsApp, Facebook, LinkedIn y X
- Open Graph y Twitter Card completos, con imagen de 1200×630 (`assets/og-image.jpg`): Luciano en el consultorio, sin piso.
  En un sitio que se va a compartir mucho por WhatsApp, esta tarjeta es la "primera impresión".

### Datos estructurados (JSON-LD)
- `Person`: nombre, título, matrícula MP 1483 como credencial y las tres universidades con su país.
- `ProfessionalService`: servicio online, idioma español, área de servicio EE. UU., teléfono y temas que trabaja
  (duelo, burnout, desarraigo, pareja, familia, psicodiagnóstico).
- Esto ayuda a Google a entender **quién** es el profesional y **qué** ofrece (señales E-E-A-T, clave en temas de salud).

### Rastreo e indexación
- `/robots.txt`: permite todo salvo `/api/` y declara el sitemap.
- `/sitemap.xml` generado por el servidor, con la fecha de la última modificación.
- Las URLs inexistentes ahora devuelven un **404 real** con `noindex`. Antes devolvían la página de inicio
  con código 200, que Google trata como "soft 404".

### Rendimiento
- **Compresión gzip**: el CSS pasa de ~45 KB a ~10 KB.
- **Caché**: imágenes y video 7 días; HTML, CSS y JS se revalidan siempre, así los cambios se ven al instante.
- `width`/`height` en todas las imágenes: evita saltos de diseño mientras carga (CLS).
- **Precarga** de la foto principal (`fetchpriority="high"`): mejora el LCP. En local el LCP medido fue de ~0,5 s.
- Favicon con las alas de la marca y `apple-touch-icon` para iPhone (antes mostraba un "LR" provisorio).

### Seguridad
Google usa HTTPS y la seguridad como señal. Se agregaron CSP, HSTS (al definir `NODE_ENV=production`),
`X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.

---

## 3. Lo que ya estaba bien

- Una sola `h1` y jerarquía de títulos coherente (h2 por sección, h3 por bloque).
- Todas las imágenes tienen texto alternativo descriptivo.
- `lang="es"`, diseño responsive real y botones grandes para el pulgar en celular.
- Fuentes con `display=swap` y `preconnect`.
- Video con `preload="metadata"`: no pesa en la carga inicial.
- ~880 palabras de contenido propio y original: buena base para una landing.

---

## 4. Recomendaciones de contenido (prioridad media; requieren aprobación de Luciano)

El texto está escrito para quien ya llegó al sitio, pero casi no usa las palabras con las que la
gente **busca**. Sugerencias que no alteran el tono:

1. **Palabras clave objetivo** (español, EE. UU.):
   - principal: *psicólogo online en español*, *terapia online en español*
   - secundarias: *psicólogo latino en Florida*, *psicólogo hispano en Miami*, *terapia para inmigrantes latinos*,
     *terapia de pareja online en español*, *psicólogo argentino online*
   - long tail (alta intención): *cómo superar el desarraigo*, *burnout trabajando en Estados Unidos*, *duelo migratorio*
2. **Eyebrow del inicio:** cambiar "Terapia online" por "Terapia online en español", sin tocar el título.
3. **Ciudad o región:** mencionar al menos una vez "Florida" o "Estados Unidos" en el texto visible.
   Hoy aparece solo en los datos internos.
4. **Preguntas frecuentes** (4 a 6) con schema `FAQPage`: "¿Cómo es una sesión online?",
   "¿Cuánto cuesta?", "¿Atiendes en mi horario si vivo en EE. UU.?", "¿Qué es el psicoanálisis vincular?".
   Puede aparecer como resultado enriquecido en Google y responde objeciones antes del contacto.
5. **Transcripción o subtítulos del video:** Google no "escucha" el video. Con subtítulos (`.vtt`) suma
   texto indexable y accesibilidad, sin volver a mostrar la transcripción que se quitó.
6. **A mediano plazo:** un blog o sección de artículos (1 por mes) sobre los temas de "¿Te sientes identificado?".
   Es la forma más sólida de posicionar búsquedas informativas y ganar enlaces.

---

## 5. Recomendaciones fuera del código (prioridad alta)

| # | Acción | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Dominio propio** (p. ej. `lucianorinaldi.com`) | El subdominio `onrender.com` transmite menos confianza y no acumula autoridad propia. Al conectarlo, cambiar `SITE_URL` en Render y las URLs del `<head>` | Bajo (~12 USD/año) |
| 2 | **Google Search Console** | Enviar el sitemap, pedir la indexación y ver qué búsquedas traen visitas | Bajo |
| 3 | **Plan pago de Render o hosting sin "dormir"** | En el plan Free la primera visita tarda ~50 s si el sitio estuvo inactivo. Google y los visitantes pueden abandonar | Medio (7 USD/mes) |
| 4 | **Perfiles en directorios de psicólogos** (Psychology Today en español, Doctoralia, TherapyDen, Latinx Therapy) con enlace al sitio | Enlaces de autoridad y visitas directas de pacientes que buscan terapeuta | Medio |
| 5 | **Perfil de Google Business** (como servicio online o de área) | Aparecer en Maps y en el panel lateral de Google | Medio |
| 6 | **Reseñas** (cuando sea ético y posible en terapia) | Señal de confianza; respetar siempre la confidencialidad | Continuo |
| 7 | **Analítica respetuosa de la privacidad** (p. ej. Plausible o GA4 con el banner de cookies ya hecho) | Medir visitas y conversiones del formulario y de WhatsApp | Bajo |

---

## 6. Checklist al conectar un dominio propio

- [ ] En Render: Settings → Custom Domains → agregar el dominio y configurar el DNS.
- [ ] Variable `SITE_URL=https://dominio-nuevo.com` en Render.
- [ ] En `public/index.html`: reemplazar `luciano-rinaldi.onrender.com` (canonical, `og:url`, `og:image` y JSON-LD).
- [ ] Search Console: verificar el dominio y enviar `https://dominio-nuevo.com/sitemap.xml`.
- [ ] (Opcional) Verificar el dominio en Resend para enviar desde `consultas@dominio-nuevo.com` a cualquier dirección.
