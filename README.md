# malo_ia — la bóveda

Archivo vivo sobre inteligencia artificial: documentos, videos y links que voy
encontrando y aprendiendo, ordenados por tema. Sitio estático, **sin build**.
Una sola librería (Lenis, para el scroll suave) va **auto-hospedada**, así que no
depende de ningún CDN externo. Inspirado en el tono cinematográfico de
landonorris.com, con lenguaje propio (oscuro + brutalista-tech).

```
malo-ia/
├─ index.html              · cáscara del sitio (header, footer, scripts)
├─ assets/
│  ├─ styles.css           · todo el diseño
│  ├─ data.js              · EL CONTENIDO (edita esto para agregar cosas)
│  ├─ app.js               · ruteo + render + animación + scroll
│  ├─ lib/lenis.min.js     · scroll suave (auto-hospedado)
│  ├─ fonts/MonaSans.woff2 · tipografía (OFL)
│  └─ img/                 · retrato + pósters
└─ media/                  · tus videos .mp4
```

## Ver el sitio en local

No necesita build. Dos opciones:

1. Doble clic en `index.html`. Funciona, aunque algunos navegadores limitan
   la reproducción de video desde `file://`.
2. Mejor, un servidor estático (soporta video completo):

   ```bash
   python -m http.server 5178 --directory malo-ia
   ```

   y abre `http://localhost:5178/`.

> Si editas `data.js` o `styles.css` y no ves los cambios, recarga forzando
> caché con **Ctrl+Shift+R** (el navegador cachea los archivos estáticos).

## Agregar contenido

Todo vive en [`assets/data.js`](assets/data.js). No toques el diseño.

### Un tema nuevo

Agrega un objeto a `temas`:

```js
{
  slug: "mi-tema",            // id para la URL, sin espacios
  titulo: "Mi tema",
  resumen: "Una línea para la tarjeta del índice.",
  descripcion: "Párrafo que se ve al abrir el tema.",
  tags: ["etiqueta", "otra"],
  actualizado: "2026-10-19",  // AAAA-MM-DD
  entradas: [ /* ver abajo */ ]
}
```

### Una entrada dentro de un tema

```js
// un video tuyo (ponlo en media/ y apunta el archivo)
{ tipo: "video", titulo: "...", fuente: "malo_ia", fecha: "2026-10-19",
  archivo: "media/mi-video.mp4", nota: "Qué muestra.", nuevo: true }

// un link externo
{ tipo: "enlace", titulo: "...", fuente: "dominio.com", fecha: "2026-10-19",
  url: "https://..." }

// un documento (PDF u otro, súbelo donde quieras y enlázalo)
{ tipo: "doc", titulo: "...", fuente: "...", fecha: "2026-10-19",
  url: "https://.../archivo.pdf" }

// una nota tuya (sin link)
{ tipo: "nota", titulo: "...", fuente: "malo_ia", fecha: "2026-10-19",
  nota: "El texto de la idea." }
```

Guarda y recarga. El contador de temas/entradas del hero se actualiza solo.

## Publicar (deploy)

Es **estático**: no hay build ni comando. Todo lo que se publica es esta carpeta
`malo-ia/` tal cual. Ya trae `vercel.json` y `netlify.toml` listos (solo definen
caché de fuentes/imágenes/videos). El ruteo es por hash (`#/tema/...`), así que
funciona en cualquier host sin reglas de reescritura.

### Opción A — Vercel

**La más rápida (CLI, sin git):**

```bash
npm i -g vercel
cd malo-ia
vercel        # primera vez: login + crea el proyecto
vercel --prod # publica a producción
```

**Con git + dashboard:** sube el repo a GitHub y en vercel.com → *Add New
Project* → importas el repo →
- *Root Directory:* `malo-ia`
- *Framework Preset:* **Other**
- *Build Command:* vacío · *Output Directory:* vacío (deja el root)

Luego **Settings → Domains** y agregas tu dominio (Vercel te da los registros DNS).

### Opción B — Netlify

**Drag & drop (lo más simple):** entra a <https://app.netlify.com/drop> y
**arrastra la carpeta `malo-ia/`**. Queda publicada en segundos.

**CLI:**

```bash
npm i -g netlify-cli
cd malo-ia
netlify deploy          # preview
netlify deploy --prod   # producción
```

**Con git:** conectas el repo; en *Site settings* pon *Base directory:* `malo-ia`
y *Publish directory:* `.` (sin build). Dominio en **Domain management**.

### GitHub Pages

Sube el **contenido** de `malo-ia/` a la rama del sitio (ej. `gh-pages`) y
actívala en *Settings → Pages*. (Las rutas son relativas, así que funciona en
un subpath también.)

### Sobre los videos

Los `.mp4` viven en `media/` y pesan **~77 MB** en total. La galería y el salón
de la fama los cargan solo al pasar el cursor (`preload="none"` + póster), así
que la carga inicial es liviana. Entra bien en el tier gratis de Vercel/Netlify.
Si más adelante crece mucho, conviene servir los videos desde un CDN o un
reproductor externo y poner en `archivo` la URL en vez de la ruta local.

## Estilo

Referencia de sensación: landonorris.com (editorial, premium), con identidad propia.

- Tipografía: **Mona Sans** (grotesca variable, titulares y texto) auto-hospedada
  en `assets/fonts/`, **Bricolage Grotesque** (palabras con carácter) y
  **JetBrains Mono** (metadatos).
- Color: oliva cálido oscuro `#282C20`, hueso `#F4F4ED`, y un único acento
  **verde esmeralda**. Las secciones alternan claras y oscuras.
- Movimiento: pantalla de carga, reveal del hero, line-art topográfico que se
  dibuja, stagger en el índice, clips que reproducen al pasar el cursor.
  Respeta `prefers-reduced-motion`.

Los tokens de color y tipo están al inicio de `assets/styles.css`.

### Créditos de fuentes

- **Mona Sans** © GitHub, Inc. — licencia SIL Open Font License 1.1.
  https://github.com/github/mona-sans (archivo en `assets/fonts/MonaSans.woff2`).
- **Bricolage Grotesque** y **JetBrains Mono** vía Google Fonts (OFL 1.1).
