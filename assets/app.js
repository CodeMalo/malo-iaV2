/* =========================================================================
   malo_ia · app  (v3 — editorial premium)
   SPA estatica con ruteo por hash. Lee window.MALO (ver data.js).
   Sin dependencias. Funciona abriendo index.html directo o servido.
   ========================================================================= */
(function () {
  "use strict";

  var DATA = window.MALO || { meta: {}, temas: [] };
  var app = document.getElementById("app");
  /* Movimiento. M viene del script del <head>: { os: el telefono pide menos movimiento, full: ?motion=1, off: el usuario lo apago }.
     reduceMotion = modo estricto (todo quieto, solo si el usuario lo apaga).
     bigMotion    = movimiento grande/automatico (suavizado de scroll, auto-avance...): respeta el ajuste del sistema. */
  var M = window.__MOTION || { os: false, full: false, off: false };
  var reduceMotion = !!M.off;
  var bigMotion = !M.off && (!M.os || M.full);
  function safe(fn) { try { return fn(); } catch (e) { (window.__errs = window.__errs || []).push(String((e && e.message) || e)); } }
  window.addEventListener("error", function (e) { (window.__errs = window.__errs || []).push(String(e.message || e)); });
  var currentRoute = "home";
  var heroSigDone = false;
  var lenis = null;

  /* ---- utilidades ---- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function temaIndex(slug) { for (var i = 0; i < DATA.temas.length; i++) if (DATA.temas[i].slug === slug) return i; return -1; }
  var MESES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var FMT = (function () { try { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }); } catch (e) { return null; } })();
  function fecha(iso) {
    if (!iso) return ""; var p = iso.split("-"); if (p.length < 3) return iso;
    if (FMT) return FMT.format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])));
    return pad(+p[2]) + " " + MESES[(+p[1]) - 1] + " " + p[0];
  }
  function totalEntradas() { return DATA.temas.reduce(function (a, t) { return a + (t.entradas ? t.entradas.length : 0); }, 0); }
  function ytId(v) { if (!v) return ""; var m = String(v).match(/(?:youtu\.be\/|shorts\/|v=|embed\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(v) ? v : ""); }
  /* cover(t): clave del primer video del tema. Archivo local ("media/x.mp4") o YouTube ("yt:ID"). */
  function cover(t) {
    var e = (t.entradas || []).filter(function (x) { return x.tipo === "video" && (x.archivo || ytId(x.youtube)); })[0];
    if (!e) return null;
    return e.archivo ? e.archivo : "yt:" + ytId(e.youtube);
  }
  function posterFor(key) {
    if (!key) return "";
    if (key.indexOf("yt:") === 0) {
      var id = key.slice(3), custom = "";
      DATA.temas.forEach(function (t) { (t.entradas || []).forEach(function (e) { if (ytId(e.youtube) === id && e.poster) custom = e.poster; }); });
      return custom || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    }
    var base = key.split("/").pop().replace(/\.mp4$/i, "");
    return "assets/img/poster-" + base + ".jpg";
  }
  function mediaTag(key) {
    if (key && key.indexOf("yt:") === 0) return '<img class="yt-thumb" src="' + esc(posterFor(key)) + '" alt="" width="480" height="360" loading="lazy" decoding="async">';
    return '<video class="hoverplay" muted loop playsinline preload="none" poster="' + esc(posterFor(key)) + '" src="' + esc(key) + '"></video>';
  }
  function esNuevo(t) { return (t.entradas || []).some(function (e) { return e.nuevo; }); }
  function hoyISO() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function estaPublicado(t) { return !t.publicar || t.publicar <= hoyISO() || /[?&]preview/.test(location.search); } /* calendarizacion: oculto hasta su fecha */
  function temasVisibles() { return DATA.temas.filter(estaPublicado); }
  function temasConVideo() { return temasVisibles().filter(function (t) { return cover(t); }); }
  function ultimaEntrada() {
    var best = null, bestT = null;
    temasVisibles().forEach(function (t) {
      (t.entradas || []).forEach(function (e) { if (!best || (e.fecha || "") > (best.fecha || "")) { best = e; bestT = t; } });
    });
    return best ? { entrada: best, tema: bestT } : null;
  }
  var TIPO_LABEL = { video: "video", enlace: "link", doc: "doc", nota: "note" };
  var GH_ICON = '<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  function slideRain(vids) {
    if (!vids || !vids.length) return "";
    function slide(t) {
      return '<a class="rslide" href="#/tema/' + esc(t.slug) + '">' +
        '<img src="' + esc(posterFor(cover(t))) + '" alt="' + esc(t.titulo) + '" width="640" height="1138" loading="lazy" decoding="async">' +
        '<span class="rslide-play" aria-hidden="true">&#9654;</span>' +
        '<span class="rslide-cap">' + esc(t.titulo) + "</span>" +
        "</a>";
    }
    function col(rot, cls) {
      var list = vids.slice(rot).concat(vids.slice(0, rot));
      var items = list.map(slide).join("");
      return '<div class="rain-col ' + cls + '"><div class="rain-run">' + items + items + "</div></div>";
    }
    return (
      '<section class="sliderain sec-dark" aria-label="Clips from the vault">' +
        topo({ cls: "", cx: 0.84, cy: 0.16, rings: 5 }) +
        '<div class="wrap sliderain-head">' +
          '<span class="eyebrow">fresh in the vault</span>' +
          '<h2 class="sliderain-title" data-palabras>new <span class="bd">clips</span>, raining in</h2>' +
          '<p class="sliderain-sub">Everything that lands in the vault. Tap one to open its write-up.</p>' +
        "</div>" +
        '<div class="rain">' + col(0, "up") + col(1, "down") + col(2, "up slow") + "</div>" +
      "</section>"
    );
  }

  /* Historia: tarjetas dispersas (thumbnail + hero) que derivan a la derecha y
     hacen zoom con el scroll (scroll-scrub), con cita editorial y palabras clave
     que se encienden. Estilo landonorris.com. */
  function storyScatter(temas) {
    if (!temas || !temas.length) return "";
    var orden = temas.slice().sort(function (a, b) { return (a.actualizado || "") < (b.actualizado || "") ? -1 : 1; });
    var ys = [0, 9, 1, 11, 4, 8];
    var cards = orden.map(function (t, i) {
      var cv = cover(t);
      var inner = cv
        ? '<a href="#/tema/' + esc(t.slug) + '"><img src="' + esc(posterFor(cv)) + '" alt="' + esc(t.titulo) + '" loading="lazy"></a>'
        : '<a class="story-panel" href="#/tema/' + esc(t.slug) + '"><span class="sp-num">' + pad(temaIndex(t.slug) + 1) + '</span><span class="sp-t">' + esc(t.titulo) + "</span></a>";
      return '<figure class="story-card" style="--y:' + ys[i % ys.length] + '%">' +
        '<figcaption class="story-cap">' + esc(t.titulo) + " · " + esc(fecha(t.actualizado)) + "</figcaption>" +
        inner + "</figure>";
    }).join("");
    var quote =
      'Everything I <span class="kw">find</span> and <span class="kw">learn</span> about AI, I ' +
      '<span class="kw">keep</span>, I <span class="kw">test</span>, and I leave <span class="kw">open</span>.';
    return (
      '<section class="story sec-light" aria-label="The vault, in motion">' +
        topo({ cls: "", cx: 0.5, cy: 0.45, rings: 7 }) +
        '<div class="story-stage">' +
          '<div class="story-cards"><div class="story-track">' + cards + "</div></div>" +
          '<div class="story-center">' +
            '<blockquote class="story-quote">' + quote + "</blockquote>" +
            '<div class="story-sign">' + SIGNATURE_SCRAWL + "</div>" +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }
  function tagsUnicos() { var set = {}; DATA.temas.forEach(function (t) { (t.tags || []).forEach(function (g) { set[g] = 1; }); }); return Object.keys(set); }

  /* ---- line-art topografico generativo ---- */
  function topo(o) {
    o = o || {};
    var w = o.w || 620, h = o.h || 620, rings = o.rings || 7, cx = w * (o.cx || 0.5), cy = h * (o.cy || 0.52);
    var paths = "";
    for (var r = 0; r < rings; r++) {
      var rx = w * 0.09 + r * w * 0.062, ry = h * 0.08 + r * h * 0.055, N = 72, d = "";
      for (var i = 0; i <= N; i++) {
        var a = (i / N) * Math.PI * 2;
        var wob = 1 + 0.11 * Math.sin(a * 3 + r) + 0.07 * Math.cos(a * 2 - r * 1.3);
        var x = (cx + Math.cos(a) * rx * wob).toFixed(1), y = (cy + Math.sin(a) * ry * wob).toFixed(1);
        d += (i === 0 ? "M" : "L") + x + " " + y;
      }
      d += "Z";
      paths += '<path style="--len:' + Math.round((rx + ry) * 3.4) + ';--dd:' + (r * 110) + 'ms" d="' + d + '"/>';
    }
    return '<svg class="topo ' + (o.cls || "") + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="' + (o.par || "xMidYMid slice") + '" aria-hidden="true">' + paths + "</svg>";
  }
  var DOODLE_ARROW =
    '<svg class="doodle draw" viewBox="0 0 120 70" aria-hidden="true">' +
    '<path style="--len:170" d="M8 46 C40 16 78 14 104 30"/>' +
    '<path style="--len:80" d="M90 16 L108 30 L86 40"/>' +
    "</svg>";
  var SIGNATURE = '<div class="signature" aria-hidden="true"><span class="sigword">malo_ia</span></div>';
  var SIGNATURE_SCRAWL =
    '<svg class="firma draw" viewBox="0 0 900 380" aria-hidden="true">' +
    '<path style="--len:2200;--dd:0ms" d="M70 250 C150 120 250 110 300 220 C330 285 400 300 440 215 C475 140 545 140 585 230 C612 292 690 306 740 220 C788 138 858 150 880 250"/>' +
    '<path style="--len:2600;--dd:260ms" d="M120 300 C330 360 650 360 840 170 C884 128 862 80 806 104 C752 128 782 214 712 300 C664 358 556 368 496 300 C470 270 470 230 500 210"/>' +
    '<path style="--len:1400;--dd:560ms" d="M150 332 C400 382 640 382 820 300"/>' +
    "</svg>";
  /* Planetas: esferas de puntos 3D en canvas. Cada punto vive en (lat, lon);
     al girar sobre su eje se proyectan en ortografico, asi que la rotacion es
     real (no una textura que se desliza). Borde fresnel, luz fija, anillos y
     estelas orbitando, como el globo holografico de referencia. */
  var PL_EARTH = '<canvas class="pglobe" data-k="earth" aria-hidden="true"></canvas>';
  var PL_SATURN = '<canvas class="pglobe" data-k="saturn" aria-hidden="true"></canvas>';
  var PL_JUP = '<canvas class="pglobe" data-k="jup" aria-hidden="true"></canvas>';
  var PL_MOON = '<canvas class="pglobe" data-k="moon" aria-hidden="true"></canvas>';

  var GLOBE_KIND = {
    earth:  { spin: 1.0,  tilt: 0.38, R: 0.27, trails: [{ rx: 1.55, ry: 0.5, rot: -0.42, sp: 1.1, len: 1.9 }, { rx: 1.42, ry: 0.38, rot: 0.55, sp: -0.8, len: 1.4 }] },
    saturn: { spin: 0.75, tilt: 0.3,  R: 0.2,  ring: true, trails: [] },
    jup:    { spin: 1.45, tilt: 0.12, R: 0.27, trails: [{ rx: 1.5, ry: 0.45, rot: -0.35, sp: 1.2, len: 1.8 }] },
    moon:   { spin: 0.65, tilt: 0.25, R: 0.27, trails: [{ rx: 1.55, ry: 0.5, rot: 0.4, sp: 1.5, len: 1.6 }] }
  };
  var CRATERS = [[0.2, 0.6, 0.28], [-0.4, 1.9, 0.22], [0.5, 3.1, 0.2], [-0.1, 4.4, 0.3], [0.1, 5.5, 0.18], [-0.6, 0.2, 0.16], [0.7, 1.2, 0.14]];
  var GLOBE_PTS = null;
  function globePoints() {
    if (GLOBE_PTS) return GLOBE_PTS;
    var pts = [], step = 6 * Math.PI / 180;
    for (var la = -84; la <= 84; la += 6) {
      var lat = la * Math.PI / 180, n = Math.max(1, Math.round(2 * Math.PI * Math.cos(lat) / step)), off = (la / 6) % 2 ? 0.5 : 0;
      for (var k = 0; k < n; k++) pts.push({ lat: lat, lon: (k + off) / n * 2 * Math.PI, cl: Math.cos(lat), sl: Math.sin(lat) });
    }
    return (GLOBE_PTS = pts);
  }
  function globeTone(kind, lat, lon) {
    if (kind === "earth") {
      var n = Math.sin(lon * 2 + 1.1) * Math.cos(lat * 2.1) + Math.sin(lon * 3.2 + lat * 1.8) * 0.6 + Math.cos(lon * 1.4 - lat * 2.4) * 0.5;
      return n > 0.3 ? 1 : 0.14;
    }
    if (kind === "jup") {
      var b = Math.sin(lat * 10) * 0.5 + 0.5, dl = Math.abs(((lon - 2.2 + 9.42) % 6.2832) - 3.1416), dt = lat + 0.28;
      var st = Math.exp(-(dl * dl * 3 + dt * dt * 18));
      return Math.min(1, 0.2 + b * 0.55 + st);
    }
    if (kind === "saturn") return 0.25 + (Math.sin(lat * 8) * 0.5 + 0.5) * 0.65;
    var m = 0.16;
    for (var i = 0; i < CRATERS.length; i++) {
      var c = CRATERS[i], dlo = Math.abs(((lon - c[1] + 9.4248) % 6.2832) - 3.1416);
      var dla = lat - c[0], d = Math.sqrt(dla * dla + dlo * dlo * Math.cos(lat) * Math.cos(lat));
      if (Math.abs(d - c[2]) < 0.05) m = 1; else if (d < c[2]) m = Math.max(m, 0.36);
    }
    return m;
  }
  function initGlobes(hero) {
    if (!hero) return;
    var list = [].slice.call(hero.querySelectorAll("canvas.pglobe"));
    if (!list.length) return;
    var pts = globePoints(), SZ = 360;
    var globes = list.map(function (c) {
      var kind = c.getAttribute("data-k"), k = GLOBE_KIND[kind];
      c.width = SZ; c.height = SZ;
      var m = (getComputedStyle(c).color.match(/\d+/g) || [29, 255, 171]).slice(0, 3).join(",");
      var R = SZ * k.R;
      return {
        c: c, ctx: c.getContext("2d"), k: k, rgb: m, R: R, rot: Math.random() * 6, dot: R * 0.027,
        tone: pts.map(function (p) { return globeTone(kind, p.lat, p.lon); }),
        tr: k.trails.map(function () { return Math.random() * 6; })
      };
    });
    var TAU = Math.PI * 2;
    function ellPt(cx, cy, rx, ry, rot, t) {
      var px = rx * Math.cos(t), py = ry * Math.sin(t);
      return [cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)];
    }
    function halfEllipse(g, rx, ry, rot, front, w, alpha) {
      var ctx = g.ctx, cx = SZ / 2;
      ctx.beginPath(); ctx.ellipse(cx, cx, rx * g.R, ry * g.R, rot, front ? 0 : Math.PI, front ? Math.PI : TAU);
      ctx.lineWidth = w; ctx.strokeStyle = "rgb(" + g.rgb + ")"; ctx.globalAlpha = alpha; ctx.stroke(); ctx.globalAlpha = 1;
    }
    function trail(g, i, front) {
      var t = g.k.trails[i], ctx = g.ctx, cx = SZ / 2, head = g.tr[i], n = 26, step = t.len / n, prev = null;
      halfEllipse(g, t.rx, t.ry, t.rot, front, 1, 0.2);
      for (var j = 0; j <= n; j++) {
        var a = t.sp > 0 ? head - (n - j) * step : head + (n - j) * step;
        var p = ellPt(cx, cx, t.rx * g.R, t.ry * g.R, t.rot, a), isFront = Math.sin(a) > 0;
        if (prev && prev.f === isFront && isFront === front) {
          ctx.beginPath(); ctx.moveTo(prev.p[0], prev.p[1]); ctx.lineTo(p[0], p[1]);
          ctx.lineWidth = 1 + (j / n) * 3; ctx.strokeStyle = "rgb(" + g.rgb + ")"; ctx.globalAlpha = Math.pow(j / n, 1.4); ctx.lineCap = "round"; ctx.stroke();
        }
        prev = { p: p, f: isFront };
      }
      ctx.globalAlpha = 1;
      if (prev && prev.f === front) { ctx.beginPath(); ctx.arc(prev.p[0], prev.p[1], 4.2, 0, TAU); ctx.fillStyle = "#fff"; ctx.shadowColor = "rgb(" + g.rgb + ")"; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0; }
    }
    function ring(g, front) {
      halfEllipse(g, 1.75, 0.46, -0.35, front, front ? 7 : 6, front ? 1 : 0.55);
      halfEllipse(g, 1.42, 0.37, -0.35, front, front ? 4 : 3, front ? 0.75 : 0.35);
    }
    function draw(g, dt) {
      var ctx = g.ctx, cx = SZ / 2, R = g.R, rgb = g.rgb, k = g.k;
      ctx.clearRect(0, 0, SZ, SZ);
      g.rot += k.spin * dt;
      for (var i = 0; i < k.trails.length; i++) g.tr[i] += k.trails[i].sp * dt;
      if (k.ring) ring(g, false);
      for (i = 0; i < k.trails.length; i++) trail(g, i, false);
      var bg = ctx.createRadialGradient(cx - R * 0.25, cx - R * 0.3, R * 0.1, cx, cx, R);
      bg.addColorStop(0, "rgba(8,16,36,0.96)"); bg.addColorStop(1, "rgba(2,5,14,0.99)");
      ctx.beginPath(); ctx.arc(cx, cx, R, 0, TAU); ctx.fillStyle = bg; ctx.fill();
      ctx.fillStyle = "rgba(" + rgb + ",0.12)"; ctx.fill();
      var cT = Math.cos(k.tilt), sT = Math.sin(k.tilt), pts2 = pts, rot = g.rot;
      ctx.fillStyle = "rgb(" + rgb + ")";
      for (i = 0; i < pts2.length; i++) {
        var p = pts2[i], lon = p.lon + rot, z0 = p.cl * Math.cos(lon), y0 = p.sl;
        var z = y0 * sT + z0 * cT; if (z < 0.03) continue;
        var x = p.cl * Math.sin(lon), y = y0 * cT - z0 * sT, tone = g.tone[i];
        var a = tone * (0.28 + 0.72 * z), r = g.dot * (0.5 + 0.55 * z);
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(cx + R * x, cx - R * y, r, 0, TAU); ctx.fill();
        if (tone > 0.95) { ctx.globalAlpha = a * 0.85; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + R * x, cx - R * y, r * 0.42, 0, TAU); ctx.fill(); ctx.fillStyle = "rgb(" + rgb + ")"; }
      }
      ctx.globalAlpha = 1;
      var sh = ctx.createRadialGradient(cx + R * 0.38, cx + R * 0.42, R * 0.1, cx + R * 0.38, cx + R * 0.42, R * 1.15);
      sh.addColorStop(0, "rgba(1,3,10,0.62)"); sh.addColorStop(1, "rgba(1,3,10,0)");
      ctx.beginPath(); ctx.arc(cx, cx, R, 0, TAU); ctx.fillStyle = sh; ctx.fill();
      var fg = ctx.createRadialGradient(cx, cx, R * 0.55, cx, cx, R);
      fg.addColorStop(0, "rgba(" + rgb + ",0)"); fg.addColorStop(0.78, "rgba(" + rgb + ",0.32)"); fg.addColorStop(1, "rgba(" + rgb + ",1)");
      ctx.fillStyle = fg; ctx.fill();
      ctx.lineWidth = SZ * 0.012; ctx.strokeStyle = "rgb(" + rgb + ")"; ctx.stroke();
      var sp = ctx.createRadialGradient(cx - R * 0.38, cx - R * 0.42, 0, cx - R * 0.38, cx - R * 0.42, R * 0.4);
      sp.addColorStop(0, "rgba(255,255,255,0.5)"); sp.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sp; ctx.beginPath(); ctx.arc(cx, cx, R, 0, TAU); ctx.fill();
      if (k.ring) ring(g, true);
      for (i = 0; i < k.trails.length; i++) trail(g, i, true);
    }
    if (reduceMotion) { globes.forEach(function (g) { draw(g, 0); }); return; }
    var on = false, last = 0;
    function frame(now) {
      if (!on || !hero.isConnected) { on = false; return; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (var q = 0; q < globes.length; q++) draw(globes[q], dt);
      requestAnimationFrame(frame);
    }
    function start() { if (on) return; on = true; last = performance.now(); requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) start(); else on = false; }, { threshold: 0.02 }).observe(hero);
    } else start();
  }
  var SOLAR =
    '<div class="solar" aria-hidden="true">' +
      '<div class="stars"></div>' +
      '<div class="galaxy">' +
        '<div class="sun"></div>' +
        '<div class="orbit o1"><i class="planet c-gr">' + PL_EARTH + "</i></div>" +
        '<div class="orbit o2"><i class="planet c-bl ringed">' + PL_SATURN + "</i></div>" +
        '<div class="orbit o3"><i class="planet c-mg">' + PL_JUP + "</i></div>" +
        '<div class="orbit o4"><i class="planet c-vi">' + PL_MOON + "</i></div>" +
      "</div>" +
      '<div class="comet"></div>' +
      '<div class="comet comet2"></div>' +
    "</div>";

  /* =======================================================================
     Home
     ======================================================================= */
  var MSG_SEGS = [
    { t: "Learn", hl: 1 }, { t: ", " },
    { t: "build", hl: 1 }, { t: " and " },
    { t: "share", hl: 1 }, { t: ". I keep what I find and learn about AI, test it, and leave it " },
    { t: "open", hl: 1 }, { t: "." }
  ];
  function msgPlain() { return MSG_SEGS.map(function (s) { return s.t; }).join(""); }
  function typedMessage() {
    var html = "";
    MSG_SEGS.forEach(function (s) {
      var cls = s.hl ? "ch hl" : "ch";
      for (var i = 0; i < s.t.length; i++) {
        var c = s.t.charAt(i);
        html += '<span class="' + cls + '">' + (c === " " ? " " : esc(c)) + "</span>";
      }
    });
    return html;
  }
  function initTyper(scope) {
    var el = scope.querySelector(".msg-text.typing");
    if (!el) return;
    var chars = el.querySelectorAll(".ch");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      chars.forEach(function (c) { c.classList.add("on"); });
      el.classList.remove("typing");
      return;
    }
    var started = false;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (ent) {
        if (!ent.isIntersecting || started) return;
        started = true; io.disconnect();
        var i = 0;
        (function step() {
          if (!el.isConnected) return;
          if (i >= chars.length) { el.classList.remove("typing"); return; }
          chars[i].classList.add("on");
          var prev = chars[i].textContent;
          i++;
          var delay = (prev === "." ) ? 150 : (prev === "," ? 80 : 14);
          setTimeout(step, delay);
        })();
      });
    }, { threshold: 0.35 });
    io.observe(el);
  }

  function viewHome() {
    var m = DATA.meta;
    var temas = temasVisibles();
    var tagList = tagsUnicos();
    var marquee = tagList.concat(tagList).map(function (g) { return '<span class="marquee-item">' + esc(g) + "</span>"; }).join("");

    function letters(word, offset) {
      return word.split("").map(function (ch, i) {
        return '<span class="reveal"><span style="--d:' + ((offset + i) * 55) + 'ms">' + ch + "</span></span>";
      }).join("");
    }

    var vids = temasConVideo();
    var heroClip = vids[0] || DATA.temas[0];
    var last = ultimaEntrada();

    // manifiesto grande
    var headline =
      "todo lo que encuentro<br>sobre ia, " +
      '<span class="hl">en un solo lugar.</span>';

    // 3 plates dispersos (clips rotulados)
    var plateCls = ["a", "b", "c"];
    var plates = vids.slice(0, 3).map(function (t, i) {
      return (
        '<figure class="plate ' + plateCls[i] + '">' +
          mediaTag(cover(t)) +
          '<figcaption class="cap">' + esc(t.titulo) + "</figcaption>" +
        "</figure>"
      );
    }).join("");

    // galeria
    var cards = temas.map(function (t, i) {
      var cv = cover(t), feature = i === 0;
      var media = cv
        ? mediaTag(cv)
        : '<div class="card-panel"><span class="glyph">' + pad(i + 1) + "</span></div>";
      var mediaBlock =
        '<div class="card-media">' + media +
          (esNuevo(t) ? '<span class="card-badge">new</span>' : "") +
          '<span class="card-cap"><span class="mono">' + pad(i + 1) + " / " + pad(temas.length) + "</span> · " +
            (t.tags || []).slice(0, 2).map(function (g) { return "#" + esc(g); }).join(" ") + "</span>" +
        "</div>";
      var infoBlock =
        '<div class="card-info">' +
          (feature ? "" : '<span class="card-num">' + pad(i + 1) + "</span>") +
          '<div class="card-body">' +
            (feature ? '<span class="kicker">featured</span>' : "") +
            '<h3 class="card-title">' + esc(t.titulo) + "</h3>" +
            '<p class="card-sub">' + esc(feature ? (t.descripcion || t.resumen) : t.resumen) + "</p>" +
          "</div>" +
          '<span class="card-go">open &rarr;</span>' +
        "</div>";
      return (
        '<a class="card reveal-up pending' + (feature ? " feature" : "") + '" style="--i:' + i + '" href="#/tema/' + esc(t.slug) + '">' +
          mediaBlock + infoBlock +
        "</a>"
      );
    }).join("");

    var v = el(
      '<div class="view">' +

        '<section class="hero scrollx preload sec-dark" id="top">' +
          '<div class="scrollx-sticky">' +
            '<canvas class="shaderbg" aria-hidden="true"></canvas>' +
            '<div class="hero-stars" aria-hidden="true"></div>' +
            topo({ cls: "ink draw", cx: 0.5, cy: 0.5 }) +
            SOLAR +
            '<div class="backtext sx-banners" aria-hidden="true">' +
              '<div class="bt-row drift-l">' + "the vault · living archive · artificial intelligence · ".repeat(3) + "</div>" +
              '<div class="bt-row drift-r">' + "malo ia · docs · videos · links · notes · ".repeat(3) + "</div>" +
            "</div>" +
            '<div class="hero-kick"><span class="kicker">malo_ia &middot; an AI archive</span></div>' +
            '<h1 class="sx-title" aria-label="malo_ia, a living archive about AI"><span class="sx-word l" aria-hidden="true">malo</span><span class="sx-word r ia" aria-hidden="true">_ia</span></h1>' +
            '<div class="sx-media">' +
              '<canvas class="pcanvas" role="img" aria-label="Portrait of malo_ia with cap and glasses"></canvas>' +
              SIGNATURE_SCRAWL +
            "</div>" +
            '<div class="scroll-cue" aria-hidden="true"><span>scroll</span><span class="line"></span></div>' +
          "</div>" +
        "</section>" +

        '<section class="intro-strip sec-light">' +
          '<div class="wrap intro-inner">' +
            '<span class="eyebrow">malo_ia</span>' +
            '<p class="hero-lede">' + esc(m.manifiesto) + "</p>" +
            (last ?
              '<div class="latest">' +
                '<div class="k">latest entry</div>' +
                '<div class="t">' + esc(last.entrada.titulo) + "</div>" +
                '<div class="m">' + esc(last.tema.titulo) + " · " + esc(fecha(last.entrada.fecha)) + "</div>" +
                '<a href="#/tema/' + esc(last.tema.slug) + '">see it in the vault <span class="arr">&rarr;</span></a>' +
              "</div>" : "") +
          "</div>" +
        "</section>" +

        '<div class="marquee" aria-hidden="true"><div class="marquee-track">' + marquee + "</div></div>" +

        slideRain(vids) +

        '<section class="manifesto sec-dark">' +
          topo({ cls: "", cx: 0.12, cy: 0.9, rings: 6 }) +
          '<div class="wrap">' +
            '<span class="eyebrow">A note</span>' +
            '<h2 class="msg-text typing" aria-label="' + esc(msgPlain()) + '">' + typedMessage() + '<span class="caret" aria-hidden="true"></span></h2>' +
            (plates ? '<div class="scatter">' + plates + "</div>" : "") +
            '<blockquote class="pull">fewer, better entries than <span class="hl">a graveyard of open tabs.</span></blockquote>' +
          "</div>" +
        "</section>" +

        storyScatter(temas) +

        '<section class="tracks sec-dark">' +
          '<div class="wrap tracks-grid">' +
            '<a class="track reveal-up pending" href="#temas">' +
              '<span class="track-k">a — 01</span>' +
              '<h2 class="track-title"><span class="stroke">explore</span><span class="solid"><span class="bd">the vault</span></span></h2>' +
              '<p class="track-desc">Every AI topic, with its videos, docs and links. Sorted, and each one with its source.</p>' +
              '<span class="track-go">see the index <span class="arr">&rarr;</span></span>' +
            "</a>" +
            '<a class="track reveal-up pending" href="' + (last ? "#/tema/" + esc(last.tema.slug) : "#temas") + '">' +
              '<span class="track-k">b — 02</span>' +
              '<h2 class="track-title"><span class="stroke">the</span><span class="solid em"><span class="bd">newest</span></span></h2>' +
              '<p class="track-desc">' + (last ? "The latest thing in the archive: " + esc(last.entrada.titulo) + "." : "The latest thing in the archive.") + "</p>" +
              '<span class="track-go">see what is new <span class="arr">&rarr;</span></span>' +
            "</a>" +
          "</div>" +
        "</section>" +

        '<section class="gallery sec-light" id="temas">' +
          '<div class="wrap">' +
            '<div class="gallery-head"><h2 data-palabras>the index</h2>' +
              '<span class="count">' + pad(temas.length) + " topics · " + pad(totalEntradas()) + " entries</span></div>" +
            '<div class="grid">' + cards + "</div>" +
          "</div>" +
        "</section>" +

        '<section class="cta sec-dark">' +
          '<div class="wrap">' +
            '<h2 data-palabras>keep <span class="hl">learning</span></h2>' +
            "<p>This grows slowly, on purpose. Come back whenever: there is usually something new.</p>" +
            '<a class="btn" href="#/acerca">about the vault <span>&rarr;</span></a>' +
          "</div>" +
        "</section>" +

      "</div>"
    );

    mount(v, "malo_ia — the vault");
    var hero = v.querySelector(".hero");
    if (!document.body.classList.contains("loading")) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.remove("preload"); }); });
    }
    heroSigDone = false;
    safe(function () { setupHoverPlay(v); });
    safe(function () { staggerReveal(v.querySelectorAll(".reveal-up")); });
    safe(function () { drawSketches(v.querySelectorAll(".draw:not(.signature):not(.firma)")); });
    safe(function () { initPortraitMesh(v.querySelector(".hero")); });
    safe(function () { initGalaxy(v.querySelector(".hero")); });
    safe(function () { initShaderBg(v.querySelector(".hero")); });
    safe(function () { initGlobes(v.querySelector(".hero")); });
    safe(function () { initTyper(v); });
    onScroll();
  }

  /* =======================================================================
     Detalle de tema
     ======================================================================= */
  /* =======================================================================
     Pagina del post: apertura editorial + "rio" horizontal.
     Patron medido en landonorris.com/off-track: el escenario queda fijo y el
     scroll vertical empuja una pista ancha de lado (1:1); fotos de distinto
     tamano y altura con pie diminuto, titulos chicos en serif, frases cortas
     con firma. Aqui cada capitulo del articulo es una escena de ese rio.
     ======================================================================= */
  function rich(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, '<em class="kw">$1</em>');
  }
  function plainText(s) { return String(s || "").replace(/\*+/g, ""); }
  function readMins(t) {
    var words = ((t.descripcion || "") + " " + (t.cuerpo || []).map(function (b) {
      return (b.p || "") + " " + (b.h || "") + " " + (b.q || "") + " " + (b.ul || []).join(" ");
    }).join(" ")).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }
  function heroTitle(title) {
    return String(title || "").split(/\s+/).filter(Boolean).map(function (w, k) {
      return '<span class="' + (k % 2 ? "t-sans" : "t-serif") + '">' + esc(w) + "</span>";
    }).join(" ");
  }
  function ledeHtml(txt) {
    var w = String(txt || "").trim().split(/\s+/);
    if (w.length < 6) return esc(txt);
    var n = Math.min(6, Math.max(3, Math.round(w.length * 0.2)));
    return esc(w.slice(0, -n).join(" ")) + ' <span class="hl-serif">' + esc(w.slice(-n).join(" ")) + "</span>";
  }
  function videoEmbed(e) {
    if (e.archivo) return '<div class="video-wrap"><video controls preload="metadata" playsinline src="' + esc(e.archivo) + '"></video></div>';
    var yid = ytId(e.youtube);
    if (!yid) return "";
    return '<div class="video-wrap yt' + (e.short ? " yt-short" : "") + '"><button class="yt-facade" type="button" data-yt="' + yid +
      '" aria-label="Play video" style="background-image:url(' + esc(posterFor("yt:" + yid)) + ')"><span class="yt-play" aria-hidden="true">&#9654;</span></button></div>';
  }
  function siguienteTema(t) {
    var vis = temasVisibles(), k = vis.indexOf(t);
    return vis.length > 1 ? vis[(k + 1) % vis.length] : null;
  }
  function riverItems(t, botones) {
    var items = [], pool = [], ph = 0, yi = 0, si = 0, chap = 0, col = null, clusterDone = false;
    var Y = ["a", "c", "b", "d", "c"], SZ = ["m", "s", "l", "s", "m"];
    var year = String(t.actualizado || "").slice(0, 4), topic = String(t.titulo || "").toUpperCase();
    (t.imagenes || []).forEach(function (im) { pool.push({ src: im.src || im, cap: im.cap || "" }); });

    function photo(p, size) {
      var y = Y[yi++ % Y.length], s = size || SZ[si++ % SZ.length];
      return '<figure class="ri ri-photo ri-' + s + ' ri-y' + y + '" data-par="' + (yi % 2 ? "0.02" : "0.012") + '">' +
        '<figcaption class="ri-cap">' + esc(p.cap || (topic + " · " + year)) + "</figcaption>" +
        '<img src="' + esc(p.src) + '" alt="' + esc(p.cap || t.titulo) + '" width="1080" height="1350" decoding="async" draggable="false"></figure>';
    }
    function cluster() {
      clusterDone = true;
      (t.carrusel || []).forEach(function (c) { items.push(photo({ src: c.img, cap: plainText(c.alt) }, "m")); });
    }
    function flush() {
      if (col && (col.h || col.ps.length)) {
        items.push('<div class="ri ri-text">' +
          (col.h ? '<span class="ri-num">' + pad(col.n) + '</span><h2 class="ri-h">' + esc(col.h) + "</h2>" : "") + col.ps.join("") + "</div>");
        if (!clusterDone && (t.carrusel || []).length) { cluster(); }
        else if (pool[ph]) items.push(photo(pool[ph++]));
      }
      col = null;
    }

    var ve = (t.entradas || []).filter(function (e) { return e.tipo === "video" && (e.archivo || ytId(e.youtube)); })[0];
    if (ve) items.push('<div class="ri ri-video' + (ve.short ? " is-short" : "") + '"><span class="ri-cap">WATCH · ' + year + "</span>" + videoEmbed(ve) + "</div>");

    var LBL = { contexto: "Context", dolor: "The pain", beneficio: "The payoff" };
    (t.slider || []).forEach(function (s, k) {
      items.push('<div class="ri ri-state s-' + esc(s.tipo) + '"><span class="ri-label"><i></i>' + esc(LBL[s.tipo] || s.tipo) +
        '</span><p class="ri-big">' + rich(s.texto || "") + "</p>" + (s.titulo ? '<span class="ri-sub">' + esc(s.titulo) + "</span>" : "") + "</div>");
    });

    (t.cuerpo || []).forEach(function (b) {
      if (b.h) { flush(); col = { h: b.h, n: ++chap, ps: [], chars: 0 }; return; }
      if (b.img) { flush(); items.push(photo({ src: b.img, cap: b.cap })); return; }
      if (b.q) {
        flush();
        items.push('<blockquote class="ri ri-quote"><p>' + rich(b.q) + "</p>" + (b.by ? '<span class="ri-by">— ' + esc(b.by) + "</span>" : "") +
          '<span class="ri-sig">' + SIGNATURE_SCRAWL + "</span></blockquote>");
        return;
      }
      if (!col) col = { h: "", n: 0, ps: [], chars: 0 };
      col.ps.push(b.ul ? '<ul class="ri-ul">' + b.ul.map(function (li) { return "<li>" + rich(li) + "</li>"; }).join("") + "</ul>" : "<p>" + rich(b.p) + "</p>");
      col.chars += (b.p || (b.ul || []).join(" ")).length;
      if (col.chars > 520) flush();   // columna larga: la historia sigue en la siguiente escena, sin repetir titulo
    });
    flush();
    if (!clusterDone && (t.carrusel || []).length) cluster();

    var nx = siguienteTema(t);
    items.push('<div class="ri ri-end"><span class="ri-label"><i></i>That is the end of this one</span>' +
      (botones ? '<div class="ri-btns">' + botones + "</div>" : "") +
      (nx ? '<a class="ri-next" href="#/tema/' + esc(nx.slug) + '"><small>Next in the vault</small><b>' + esc(nx.titulo) + ' <span aria-hidden="true">&rarr;</span></b></a>' : "") + "</div>");
    return items.join("");
  }

  function viewTema(slug) {
    var i = temaIndex(slug);
    if (i < 0) { location.hash = "#/"; return; }
    var t = DATA.temas[i];

    var botones = [];
    (t.repos || []).forEach(function (r) {
      botones.push('<a class="repo-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + GH_ICON + "<span>" + esc(r.label || "repo") + '</span><span class="arr" aria-hidden="true">&#8599;</span></a>');
    });
    (t.recursos || []).forEach(function (r) {
      botones.push('<a class="link-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(r.label) + '</span><span class="arr" aria-hidden="true">&#8599;</span></a>');
    });

    var restantes = (t.entradas || []).filter(function (e) {
      return e.tipo !== "video" && !(e.tipo === "enlace" && t.recursos && t.recursos.length);
    });
    var entradas = restantes.map(function (e) {
      var meta = [];
      if (e.fuente) meta.push(esc(e.fuente));
      if (e.fecha) meta.push(esc(fecha(e.fecha)));
      var action = "";
      if ((e.tipo === "enlace" || e.tipo === "doc") && e.url) {
        action = '<div class="entry-action"><a class="open-link" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' +
          (e.tipo === "doc" ? "open doc" : "open link") + ' <span class="arr" aria-hidden="true">&#8599;</span></a></div>';
      }
      return '<article class="entry reveal-up pending"><span class="chip" data-tipo="' + esc(e.tipo) + '">' + esc(TIPO_LABEL[e.tipo] || e.tipo) + "</span>" +
        '<div class="entry-body"><h4 class="entry-title">' + esc(e.titulo) + "</h4>" + (meta.length ? '<div class="entry-meta">' + meta.join(" &middot; ") + "</div>" : "") +
        (e.nota ? '<p class="entry-note">' + esc(e.nota) + "</p>" : "") + "</div>" + action + "</article>";
    }).join("");

    var carHtml = "";
    if (t.carrusel && t.carrusel.length) {
      carHtml = '<section class="wrap car-wrap sec-dark"><span class="eyebrow">The carousel</span><section class="car reveal-up pending" aria-label="Carousel">' +
        '<div class="car-track" tabindex="0">' + t.carrusel.map(function (c, k) {
          return '<figure class="car-slide"><img src="' + esc(c.img) + '" alt="' + esc(c.alt || (t.titulo + " — slide " + (k + 1))) + '" loading="lazy" draggable="false"></figure>';
        }).join("") + "</div>" +
        '<div class="car-nav"><button class="car-prev" aria-label="Previous slide">&larr;</button><div class="car-dots">' +
        t.carrusel.map(function (c, k) { return '<button class="car-dot' + (k ? "" : " on") + '" data-go="' + k + '" aria-label="Slide ' + (k + 1) + '"></button>'; }).join("") +
        '</div><button class="car-next" aria-label="Next slide">&rarr;</button></div></section></section>';
    }

    var cv = t.portada || (cover(t) ? posterFor(cover(t)) : "") || (t.carrusel && t.carrusel[0] && t.carrusel[0].img) || "";
    var len = String(t.titulo || "").length;
    var lw = String(t.titulo || "").split(/\s+/).reduce(function (m, w) { return Math.max(m, w.length); }, 4);
    var ts = len <= 14 ? "clamp(3.4rem, 11vw, 10.5rem)" : len <= 30 ? "clamp(2.6rem, 7.2vw, 7rem)" : len <= 50 ? "clamp(2.2rem, 5.2vw, 5rem)" : "clamp(2rem, 4vw, 3.8rem)";

    var v = el(
      '<div class="view"><article class="post sec-light">' +
        topo({ cls: "", cx: 0.5, cy: 0.35, rings: 7 }) +
        '<section class="phero">' +
          '<a class="back" href="#/"><span class="arr" aria-hidden="true">&larr;</span> back to the index</a>' +
          '<h1 class="ptitle' + (len > 14 ? " long" : "") + '" data-palabras style="--ts:' + ts + ';--lw:' + lw + '">' + heroTitle(t.titulo) + "</h1>" +
          (cv ? '<figure class="pcover"><img src="' + esc(cv) + '" alt="' + esc(t.titulo) + '" width="800" height="1000" fetchpriority="high" decoding="async"></figure>' : "") +
          '<div class="pmeta"><span>malo_ia</span><span>' + esc(fecha(t.actualizado)) + "</span><span>" + readMins(t) + " min read</span>" +
            (t.tags || []).slice(0, 3).map(function (g) { return "<span>#" + esc(g) + "</span>"; }).join("") + "</div>" +
          '<div class="pbottom"><div class="plede-wrap"><p class="plede">' + ledeHtml(t.descripcion || t.resumen) + '</p><span class="psig">' + SIGNATURE_SCRAWL + "</span></div>" +
            (t.resumen && t.resumen !== (t.descripcion || t.resumen) ? '<p class="pnote">' + esc(t.resumen) + "</p>" : "") + "</div>" +
        "</section>" +
        '<section class="river" aria-label="The story, scroll to read">' +
          '<div class="river-stage"><div class="river-track">' + riverItems(t, botones.join("")) + "</div>" +
          '<div class="river-bar"><i></i></div><span class="river-cue">scroll &rarr;</span></div>' +
        "</section>" +
        (entradas ? '<section class="wrap pentries"><div class="entries-label"><h3>More</h3><span class="count mono">' + pad(restantes.length) + '</span></div><div class="entries">' + entradas + "</div></section>" : "") +
      "</article></div>"
    );
    mount(v, "malo_ia — " + t.titulo);
    safe(function () { staggerReveal(v.querySelectorAll(".reveal-up")); });
    safe(function () { initCarousel(v); });
    safe(function () { initRiver(v); });
    [].slice.call(v.querySelectorAll(".yt-facade")).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + b.getAttribute("data-yt") + "?autoplay=1&rel=0&modestbranding=1";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.title = "Video";
        b.parentNode.replaceChild(f, b);
      });
    });
    setTimeout(function () { [].forEach.call(v.querySelectorAll(".psig .draw"), function (s) { s.classList.add("in"); }); }, 500);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.4 });
      [].forEach.call(v.querySelectorAll(".ri-sig .draw"), function (s) { io.observe(s); });
    }
  }

  /* El rio: la altura de la seccion = recorrido horizontal + una pantalla, asi el scroll
     vertical equivale 1:1 al avance lateral. En movil o con "menos movimiento" se apila. */
  function initRiver(v) {
    var sec = v.querySelector(".river"); if (!sec) return;
    var track = sec.querySelector(".river-track");
    var mq = window.matchMedia("(max-width: 860px)");
    var lastW = 0;
    function size(ev) {
      if (!sec.isConnected || sec.classList.contains("is-static")) return;
      if (ev && ev.type === "resize" && window.innerWidth === lastW) return;   // la barra de URL del celular cambia el alto: no recalcular
      lastW = window.innerWidth;
      sec.style.height = Math.max(0, track.scrollWidth - window.innerWidth) + window.innerHeight + "px";
      sec.__gap = parseFloat(getComputedStyle(track).columnGap) || 88;
      onScroll();
    }
    function revealStatic() {
      var items = [].slice.call(sec.querySelectorAll(".ri"));
      if (reduceMotion || !("IntersectionObserver" in window)) { items.forEach(function (n) { n.classList.add("in"); }); return; }
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      items.forEach(function (n) { if (!n.classList.contains("in")) io.observe(n); });
    }
    function apply() {
      if (!sec.isConnected) return;
      var stat = reduceMotion;                          // solo el modo estricto apila; celular y tableta tienen su propio rio
      sec.classList.toggle("is-static", stat);
      if (stat) {
        sec.style.height = ""; track.style.transform = "";
        [].forEach.call(sec.querySelectorAll("[data-par]"), function (n) { n.style.transform = ""; });
        revealStatic();
      } else size();
    }
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply); else if (mq.addListener) mq.addListener(apply);
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(track);
    window.addEventListener("resize", size);
    [].forEach.call(track.querySelectorAll("img"), function (im) { if (!im.complete) im.addEventListener("load", size, { once: true }); });
  }

  function initCarousel(scope) {
    var car = scope.querySelector(".car"); if (!car) return;
    var track = car.querySelector(".car-track"), slides = [].slice.call(track.children), dots = [].slice.call(car.querySelectorAll(".car-dot"));
    function idx() { if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) return slides.length - 1; var w = slides[0].offsetWidth + 16; return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w))); }
    function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft - (track.clientWidth - slides[i].offsetWidth) / 2, behavior: bigMotion ? "smooth" : "auto" }); }
    track.addEventListener("scroll", function () { var i = idx(); dots.forEach(function (d, k) { d.classList.toggle("on", k === i); }); }, { passive: true });
    car.querySelector(".car-prev").addEventListener("click", function () { go(idx() - 1); });
    car.querySelector(".car-next").addEventListener("click", function () { go(idx() + 1); });
    dots.forEach(function (d) { d.addEventListener("click", function () { go(+d.getAttribute("data-go")); }); });
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); go(idx() + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx() - 1); } });
  }

  function initSlider(scope) {
    var cpb = scope.querySelector(".cpb"); if (!cpb) return;
    var slides = [].slice.call(cpb.querySelectorAll(".cpb-slide"));
    var dots = [].slice.call(cpb.querySelectorAll(".cpb-dot"));
    if (slides.length < 2) return;
    var idx = 0, timer = null;
    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("on", k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle("on", k === idx); });
    }
    function auto() { if (!bigMotion) return; clearInterval(timer); timer = setInterval(function () { show(idx + 1); }, 5200); }
    var nx = cpb.querySelector(".cpb-next"), pv = cpb.querySelector(".cpb-prev");
    if (nx) nx.addEventListener("click", function () { show(idx + 1); auto(); });
    if (pv) pv.addEventListener("click", function () { show(idx - 1); auto(); });
    dots.forEach(function (d) { d.addEventListener("click", function () { show(+d.getAttribute("data-go")); auto(); }); });
    show(0); auto();
  }

  /* =======================================================================
     Acerca
     ======================================================================= */
  function viewAcerca() {
    var m = DATA.meta;
    var v = el(
      '<div class="view">' +
        '<main class="wrap about sec-light">' +
          '<a class="back" href="#/"><span class="arr" aria-hidden="true">&larr;</span> back to the index</a>' +
          '<span class="eyebrow">About</span>' +
          '<div class="about-grid">' +
            "<div>" +
              "<h1 data-palabras>the vault</h1>" +
              '<p class="lead">' + esc(m.manifiesto) + "</p>" +
              "<p>This is not a blog or a feed. It is an archive: what I find and trust about AI, saved with its source and date so I can come back and tell whether it still holds up.</p>" +
              "<p>Each topic is a card. Inside live the entries: a video, a link, a doc or a note. It grows slowly, on purpose &mdash; fewer, better entries than a graveyard of open tabs.</p>" +
            "</div>" +
            "<aside>" +
              "<dl>" +
                "<dt>Author</dt><dd>" + esc(m.autor) + "</dd>" +
                "<dt>Topics</dt><dd>" + pad(DATA.temas.length) + "</dd>" +
                "<dt>Entries</dt><dd>" + pad(totalEntradas()) + "</dd>" +
                "<dt>Updated</dt><dd>" + esc(fecha(m.actualizado)) + "</dd>" +
                "<dt>Status</dt><dd>work in progress</dd>" +
              "</dl>" +
            "</aside>" +
          "</div>" +
        "</main>" +
      "</div>"
    );
    mount(v, "malo_ia — about");
    staggerReveal(v.querySelectorAll(".reveal-up"));
  }

  /* =======================================================================
     Montaje + helpers de movimiento
     ======================================================================= */
  function mount(nextView, title) {
    document.title = title || "malo_ia";
    app.innerHTML = "";
    app.appendChild(nextView);
    if (!reduceMotion) {
      nextView.classList.add("is-entering");
      requestAnimationFrame(function () { requestAnimationFrame(function () { nextView.classList.remove("is-entering"); }); });
    }
    updateNav();
  }

  function initGalaxy(hero) {
    if (!hero) return;
    var solar = hero.querySelector(".solar"); if (!solar) return;
    var stars = solar.querySelector(".stars");
    if (stars && !stars.childElementCount) {
      var html = "";
      for (var i = 0; i < 64; i++) {
        var x = (Math.random() * 100).toFixed(1), y = (Math.random() * 100).toFixed(1),
            s = (Math.random() * 1.6 + 0.7).toFixed(1), d = (Math.random() * 3).toFixed(2),
            o = (0.3 + Math.random() * 0.6).toFixed(2);
        html += '<i class="star" style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + s + 'px;opacity:' + o + ';animation-delay:' + d + 's"></i>';
      }
      stars.innerHTML = html;
    }
    var hs = hero.querySelector(".hero-stars");
    if (hs && !hs.childElementCount) {
      var cols = ["#e8fff6", "#e8fff6", "#e8fff6", "#1dffab", "#2b8cff", "#ff3d9a", "#9b5bff"];
      var h2 = "";
      for (var k = 0; k < 140; k++) {
        var hx = (Math.random() * 100).toFixed(1), hy = (Math.random() * 100).toFixed(1),
            hsz = (Math.random() * 2.2 + 0.8).toFixed(1), hd = (Math.random() * 4).toFixed(2),
            ho = (0.35 + Math.random() * 0.6).toFixed(2), hc = cols[(Math.random() * cols.length) | 0],
            sp = Math.random() < 0.16 ? " spark" : "";
        h2 += '<i class="star' + sp + '" style="left:' + hx + '%;top:' + hy + '%;width:' + hsz + 'px;height:' + hsz + 'px;opacity:' + ho + ';--sc:' + hc + ';animation-delay:' + hd + 's"></i>';
      }
      hs.innerHTML = h2;
    }
    if (reduceMotion) return;
    hero.addEventListener("pointermove", function (e) {
      var b = hero.getBoundingClientRect();
      var nx = (e.clientX - b.left) / b.width - 0.5, ny = (e.clientY - b.top) / b.height - 0.5;
      solar.style.setProperty("--gy", (nx * 16).toFixed(2) + "deg");
      solar.style.setProperty("--gx", (-ny * 14).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", function () { solar.style.setProperty("--gx", "0deg"); solar.style.setProperty("--gy", "0deg"); });
  }

  /* WebGL shader backdrop — breathing neon rings behind the galaxy.
     Ported to raw WebGL (no library) from the reference shader, retuned to
     the malo_ia palette (esmeralda + azul + magenta) and vignetted so the
     portrait reads against it. Pauses when the hero is off-screen. */
  function initShaderBg(hero) {
    if (!hero) return;
    var canvas = hero.querySelector(".shaderbg");
    if (!canvas) return;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power" })
        || canvas.getContext("experimental-webgl");
    } catch (e) { gl = null; }
    if (!gl) { canvas.style.display = "none"; return; }

    var vsrc = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";
    var fsrc = [
      "precision highp float;",
      "uniform vec2 resolution;uniform float time;",
      "mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}",
      "float rand(vec2 s){return fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453123);}",
      "void main(){",
      "  vec2 uv=(gl_FragCoord.xy*2.0-resolution.xy)/min(resolution.x,resolution.y);",
      "  float t=time*0.08;",
      "  vec2 d=uv;",
      "  d+=vec2(sin(uv.y*4.0+t*2.0),cos(uv.x*4.0+t*2.0))*0.10;",
      "  d=rot(t*0.22)*d;",
      "  float e=0.0;",
      "  for(int i=0;i<7;i++){float fi=float(i);float w=sin(t*2.0+fi*0.5)*0.5+0.5;e+=0.014/abs(w-length(d)+sin(d.x+d.y)*0.1);}",
      "  vec3 cG=vec3(0.09,1.0,0.66);vec3 cB=vec3(0.17,0.55,1.0);vec3 cM=vec3(1.0,0.24,0.60);",
      "  float m1=sin(length(d)*2.0-t)*0.5+0.5;",
      "  vec3 base=mix(cB,cM,m1);",
      "  base=mix(base,cG,(sin(d.x*1.6+t*1.2)*0.5+0.5)*0.5);",
      "  vec3 col=base*e;",
      "  float r=length(uv);",
      "  col*=mix(0.26,1.0,smoothstep(0.15,1.35,r));",
      "  col+=vec3(0.018,0.035,0.03);",
      "  col+=(rand(uv+t)-0.5)*0.045;",
      "  col*=0.52;",
      "  gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n");

    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = "none"; return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, "resolution");
    var uTime = gl.getUniformLocation(prog, "time");

    var scale = Math.min(1.5, window.devicePixelRatio || 1) * 0.8;
    function resize() {
      var w = Math.max(1, Math.round(canvas.clientWidth * scale));
      var h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(sec) { gl.uniform1f(uTime, sec); gl.drawArrays(gl.TRIANGLES, 0, 3); }

    if (reduceMotion) { draw(6.0); return; }

    var running = false, rafId = 0, t0 = 0;
    function frame(now) { if (!running) return; draw((now - t0) * 0.001); rafId = requestAnimationFrame(frame); }
    function start() { if (running) return; running = true; t0 = performance.now() - 8000; rafId = requestAnimationFrame(frame); }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) start(); else stop(); }, { threshold: 0.02 });
      io.observe(hero);
    } else { start(); }
  }

  function initPortraitMesh(hero) {
    if (!hero) return;
    var canvas = hero.querySelector(".pcanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var sig = hero.querySelector(".signature");
    var img = new Image();
    img.onload = function () { try { setup(); } catch (e) { fallback(); } };
    img.src = "assets/img/retrato.png";

    function sizeCanvas() {
      var cw = Math.max(1, canvas.offsetWidth), ch = Math.max(1, canvas.offsetHeight);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { cw: cw, ch: ch };
    }
    function imgRect(cw, ch) {
      var ir = img.width / img.height, cr = cw / ch, dw, dh;
      if (ir > cr) { dw = cw; dh = cw / ir; } else { dh = ch; dw = ch * ir; }
      return { dw: dw, dh: dh, dx: (cw - dw) / 2, dy: (ch - dh) / 2 };
    }
    function fallback() {
      var s = sizeCanvas(), r = imgRect(s.cw, s.ch);
      ctx.clearRect(0, 0, s.cw, s.ch); ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      if (sig) sig.classList.add("in");
    }
    function setup() {
      var s = sizeCanvas(), cw = s.cw, ch = s.ch, r = imgRect(cw, ch);
      if (reduceMotion) { fallback(); return; }
      var off = document.createElement("canvas"); off.width = cw; off.height = ch;
      var octx = off.getContext("2d"); octx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      var data;
      try { data = octx.getImageData(0, 0, cw, ch).data; } catch (e) { fallback(); return; }
      var S = cw < 300 ? 5 : 6, parts = [], maxr = Math.max(cw, ch);
      for (var y = 0; y < ch; y += S) {
        for (var x = 0; x < cw; x += S) {
          var idx = (y * cw + x) * 4, a = data[idx + 3];
          if (a < 45) continue;
          var rr = data[idx], gg = data[idx + 1], bb = data[idx + 2];
          var ang = Math.random() * Math.PI * 2, rad = maxr * (0.45 + Math.random() * 0.75);
          parts.push({ x: cw / 2 + Math.cos(ang) * rad, y: ch / 2 + Math.sin(ang) * rad, tx: x, ty: y, r: rr, g: gg, b: bb, gray: (rr * 0.3 + gg * 0.59 + bb * 0.11), d: Math.random() });
        }
      }
      if (!parts.length) { fallback(); return; }
      var start = null, DUR = 2200;
      function e3(t) { return 1 - Math.pow(1 - t, 3); }
      function frame(now) {
        if (!canvas.isConnected) return;
        if (hero.classList.contains("preload")) { requestAnimationFrame(frame); return; }
        if (start === null) start = now;
        var g = Math.min(1, (now - start) / DUR), e = e3(g);
        ctx.clearRect(0, 0, cw, ch);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var pe = e * 1.14 - p.d * 0.14; if (pe < 0) pe = 0; if (pe > 1) pe = 1;
          var px = p.x + (p.tx - p.x) * pe, py = p.y + (p.ty - p.y) * pe;
          var cm = (g - 0.42 - p.d * 0.1) / 0.5; if (cm < 0) cm = 0; if (cm > 1) cm = 1;
          var R = (p.gray + (p.r - p.gray) * cm) | 0, G = (p.gray + (p.g - p.gray) * cm) | 0, B = (p.gray + (p.b - p.gray) * cm) | 0;
          ctx.fillStyle = "rgb(" + R + "," + G + "," + B + ")";
          ctx.fillRect(px, py, S, S);
        }
        if (g < 1) { requestAnimationFrame(frame); return; }
        freeze();
      }
      function freeze() {
        var fstart = null;
        function ff(now) {
          if (!canvas.isConnected) return;
          if (fstart === null) fstart = now;
          var fa = Math.min(1, (now - fstart) / 420);
          ctx.clearRect(0, 0, cw, ch);
          for (var i = 0; i < parts.length; i++) { var p = parts[i]; ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")"; ctx.fillRect(p.tx, p.ty, S, S); }
          ctx.globalAlpha = fa; ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh); ctx.globalAlpha = 1;
          if (fa < 1) { requestAnimationFrame(ff); }
          else { if (sig) sig.classList.add("in"); startTrail(); }
        }
        requestAnimationFrame(ff);
      }
      function startTrail() {
        var boost = document.createElement("canvas"); boost.width = cw; boost.height = ch;
        var bc = boost.getContext("2d"); bc.filter = "brightness(1.22) saturate(1.6)"; bc.drawImage(img, r.dx, r.dy, r.dw, r.dh); bc.filter = "none";
        var dim = document.createElement("canvas"); dim.width = cw; dim.height = ch;
        var dc = dim.getContext("2d"); dc.filter = "grayscale(0.78) brightness(0.8) contrast(1.05)"; dc.drawImage(img, r.dx, r.dy, r.dw, r.dh); dc.filter = "none";
        var reveal = document.createElement("canvas"); reveal.width = cw; reveal.height = ch;
        var rc = reveal.getContext("2d");
        var trail = [], lastMove = -9999, running2 = false;
        function wake() { if (!running2) { running2 = true; requestAnimationFrame(tloop); } }
        function toLocal(e) { var b = canvas.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * cw, (e.clientY - b.top) / b.height * ch]; }
        hero.addEventListener("pointermove", function (e) {
          var p = toLocal(e);
          trail.push({ x: p[0], y: p[1], t: performance.now() });
          if (trail.length > 90) trail.shift();
          lastMove = performance.now(); wake();
        });
        function render(now) {
          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(dim, 0, 0);
          rc.clearRect(0, 0, cw, ch); rc.drawImage(boost, 0, 0);
          rc.globalCompositeOperation = "destination-in";
          var alive = false;
          for (var i = 0; i < trail.length; i++) {
            var tp = trail[i], age = (now - tp.t) / 1100; if (age >= 1) continue; alive = true;
            var a = 1 - age, rad = cw * (0.16 + 0.1 * a);
            var g = rc.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, rad);
            g.addColorStop(0, "rgba(0,0,0," + (a * 0.95).toFixed(3) + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
            rc.fillStyle = g; rc.beginPath(); rc.arc(tp.x, tp.y, rad, 0, 6.2832); rc.fill();
          }
          rc.globalCompositeOperation = "source-over";
          ctx.drawImage(reveal, 0, 0);
          ctx.globalCompositeOperation = "lighter";
          for (var j = 0; j < trail.length; j++) {
            var q = trail[j], ageq = (now - q.t) / 1100; if (ageq >= 1) continue;
            var aq = 1 - ageq, radq = cw * 0.15 * (0.5 + 0.5 * aq);
            var gg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, radq);
            gg.addColorStop(0, "rgba(29,255,171," + (aq * 0.3).toFixed(3) + ")");
            gg.addColorStop(1, "rgba(29,255,171,0)");
            ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(q.x, q.y, radq, 0, 6.2832); ctx.fill();
          }
          ctx.globalCompositeOperation = "source-over";
          return alive;
        }
        function tloop(now) {
          if (!canvas.isConnected) { running2 = false; return; }
          var alive = render(now);
          if (alive || now - lastMove < 200) requestAnimationFrame(tloop); else running2 = false;
        }
        ctx.clearRect(0, 0, cw, ch); ctx.drawImage(dim, 0, 0);
      }
      requestAnimationFrame(frame);
    }
  }

  function initPortraitHalftone(hero) {
    if (!hero) return;
    var canvas = hero.querySelector(".pcanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var sig = hero.querySelector(".signature");
    var img = new Image();
    img.onload = function () { try { setup(); } catch (e) { fallback(); } };
    img.src = "assets/img/retrato.png";

    var cw = 0, ch = 0, dpr = 1, baseOff = null, dots = [], count = 0, gap = 6;
    var px = -1e5, py = -1e5, startT = null, SETTLE = 1900, sigShown = false, visible = true, running = false;
    var emer = [21, 217, 138], warm = [33, 230, 150];

    function sizeCanvas() {
      cw = Math.max(1, canvas.offsetWidth); ch = Math.max(1, canvas.offsetHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function imgRect() {
      var ir = img.width / img.height, cr = cw / ch, dw, dh;
      if (ir > cr) { dw = cw; dh = cw / ir; } else { dh = ch; dw = ch * ir; }
      return { dw: dw, dh: dh, dx: (cw - dw) / 2, dy: (ch - dh) / 2 };
    }
    function fallback() {
      sizeCanvas(); var r = imgRect();
      ctx.clearRect(0, 0, cw, ch); ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      if (sig) sig.classList.add("in");
    }
    function setup() {
      sizeCanvas(); var r = imgRect();
      var src = document.createElement("canvas"); src.width = cw; src.height = ch;
      var sctx = src.getContext("2d", { willReadFrequently: true }); sctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      var data; try { data = sctx.getImageData(0, 0, cw, ch).data; } catch (e) { fallback(); return; }
      gap = cw < 300 ? 5 : 6;
      var minY = ch, maxY = 0;
      for (var y = 0; y < ch; y += gap) { for (var x = 0; x < cw; x += gap) { if (data[(y * cw + x) * 4 + 3] > 50) { if (y < minY) minY = y; if (y > maxY) maxY = y; } } }
      var maskTopY = minY + (maxY - minY) * 0.47;
      baseOff = document.createElement("canvas"); baseOff.width = cw; baseOff.height = ch;
      var bctx = baseOff.getContext("2d"); bctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      dots = [];
      for (var yy = 0; yy < ch; yy += gap) {
        for (var xx = 0; xx < cw; xx += gap) {
          var idx = (yy * cw + xx) * 4, a = data[idx + 3]; if (a < 50) continue;
          var rr = data[idx], gg = data[idx + 1], bb = data[idx + 2], lum = (rr * 0.3 + gg * 0.59 + bb * 0.11) / 255;
          if (!(yy < maskTopY && lum < 0.47)) continue;
          var hx = xx + gap / 2, hy = yy + gap / 2, cov = 1 - lum; if (cov < 0.3) cov = 0.3; if (cov > 1) cov = 1;
          var ang = Math.random() * 6.2832, rad2 = Math.max(cw, ch) * (0.22 + Math.random() * 0.55);
          dots.push({ hx: hx, hy: hy, sx: hx + Math.cos(ang) * rad2, sy: hy + Math.sin(ang) * rad2, x: hx, y: hy, vx: 0, vy: 0, r: rr, g: gg, b: bb, gray: Math.round(lum * 255), rad: Math.sqrt(cov) * gap * 0.74, ph: Math.random() * 6.2832, d: Math.random() });
          bctx.clearRect(xx, yy, gap, gap);
        }
      }
      count = dots.length;
      if (!count) { fallback(); return; }
      if (reduceMotion) { drawStatic(); if (sig) sig.classList.add("in"); return; }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { visible = es[0] ? es[0].isIntersecting : true; if (visible) start(); });
        io.observe(hero);
      }
      start();
    }
    function drawStatic() {
      ctx.clearRect(0, 0, cw, ch); ctx.drawImage(baseOff, 0, 0, cw, ch);
      for (var i = 0; i < count; i++) { var p = dots[i]; ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")"; ctx.beginPath(); ctx.arc(p.hx, p.hy, p.rad, 0, 6.2832); ctx.fill(); }
    }
    function zebra(x, y, t) { return Math.sin(x * 0.11 + y * 0.06 + t * 2.0 + Math.sin(y * 0.04 + t) * 1.6); }
    function start() { if (running) return; running = true; requestAnimationFrame(loop); }
    function loop(now) {
      if (!canvas.isConnected || !visible) { running = false; return; }
      if (hero.classList.contains("preload")) { requestAnimationFrame(loop); return; }
      if (startT === null) startT = now;
      var el = (now - startT) / 1000, g = Math.min(1, (now - startT) / SETTLE), e = 1 - Math.pow(1 - g, 3);
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = Math.min(1, e * 1.3); ctx.drawImage(baseOff, 0, 0, cw, ch); ctx.globalAlpha = 1;
      for (var i = 0; i < count; i++) {
        var p = dots[i];
        if (g < 1) { var pe = e * 1.14 - p.d * 0.14; if (pe < 0) pe = 0; if (pe > 1) pe = 1; p.x = p.sx + (p.hx - p.sx) * pe; p.y = p.sy + (p.hy - p.sy) * pe; }
        else { var dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy, R0 = 66; if (d2 < R0 * R0) { var dd = Math.sqrt(d2) + 0.001, f = (1 - dd / R0) * 2.6; p.vx += (dx / dd) * f; p.vy += (dy / dd) * f; } p.vx = (p.vx + (p.hx - p.x) * 0.06) * 0.84; p.vy = (p.vy + (p.hy - p.y) * 0.06) * 0.84; p.x += p.vx; p.y += p.vy; }
        var cm = (g - 0.38 - p.d * 0.1) / 0.5; if (cm < 0) cm = 0; if (cm > 1) cm = 1;
        var zb = zebra(p.hx, p.hy, el);
        var br = p.gray + (p.r - p.gray) * cm, bg = p.gray + (p.g - p.gray) * cm, bb2 = p.gray + (p.b - p.gray) * cm;
        var sh = zb > 0 ? (0.12 + 0.12 * Math.sin(el * 2.4 + p.ph)) : 0;
        var em = (1 - cm) * 0.55 * (zb > 0 ? 1 : 0); if (em > sh) sh = em;
        br = br + (emer[0] - br) * sh; bg = bg + (emer[1] - bg) * sh; bb2 = bb2 + (emer[2] - bb2) * sh;
        var disp = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy), k = Math.min(1, disp / 22);
        var Rr = (br + (warm[0] - br) * k) | 0, Gg = (bg + (warm[1] - bg) * k) | 0, Bb = (bb2 + (warm[2] - bb2) * k) | 0;
        ctx.fillStyle = "rgb(" + Rr + "," + Gg + "," + Bb + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, 6.2832); ctx.fill();
      }
      if (g >= 1 && !sigShown) { sigShown = true; if (sig) sig.classList.add("in"); }
      requestAnimationFrame(loop);
    }
    function toLocal(e) { var b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    hero.addEventListener("pointermove", function (e) { var p = toLocal(e); px = p[0]; py = p[1]; });
    hero.addEventListener("pointerleave", function () { px = -1e5; py = -1e5; });
  }

  function initHeroLight(hero) {
    if (!hero) return;
    var portrait = hero.querySelector(".portrait");
    if (!portrait) return;
    if (reduceMotion) { hero.classList.add("lit-full"); return; }
    var tx = 52, ty = 32, cx = 52, cy = 32, last = -9999, t = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = portrait.getBoundingClientRect();
      if (!r.width) return;
      tx = Math.max(-20, Math.min(120, ((e.clientX - r.left) / r.width) * 100));
      ty = Math.max(-20, Math.min(120, ((e.clientY - r.top) / r.height) * 100));
      last = performance.now();
    });
    function frame(now) {
      if (!hero.isConnected) return;
      t += 0.016;
      if (now - last > 1500) { tx = 52 + Math.cos(t * 0.55) * 24; ty = 36 + Math.sin(t * 0.8) * 15; }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty("--mx", cx.toFixed(1) + "%");
      hero.style.setProperty("--my", cy.toFixed(1) + "%");
      var dx = (cx - 50) / 50, dy = (cy - 50) / 50;
      hero.style.setProperty("--ry", (dx * 6).toFixed(2) + "deg");
      hero.style.setProperty("--rx", (-dy * 5).toFixed(2) + "deg");
      hero.style.setProperty("--px", (dx * -10).toFixed(1) + "px");
      hero.style.setProperty("--py", (dy * -8).toFixed(1) + "px");
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setupHoverPlay(scope) {
    scope.querySelectorAll("video.hoverplay").forEach(function (vid) {
      var card = vid.closest(".card") || vid.closest(".plate") || vid.closest(".hof-card");
      if (!card) return;
      card.addEventListener("mouseenter", function () { vid.play().catch(function () {}); });
      card.addEventListener("mouseleave", function () { try { vid.pause(); } catch (e) {} });
    });
  }

  function staggerReveal(nodes) {
    if (!nodes || !nodes.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { nodes.forEach(function (n) { n.classList.remove("pending"); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (ent) {
        if (!ent.isIntersecting) return;
        var node = ent.target, order = Array.prototype.indexOf.call(node.parentNode.children, node);
        var idx = node.style.getPropertyValue("--i"), n = idx !== "" ? +idx : order;
        node.style.transitionDelay = Math.min(n * 60, 420) + "ms";
        node.classList.remove("pending"); io.unobserve(node);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function drawSketches(nodes) {
    if (!nodes || !nodes.length || reduceMotion || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (ent) { if (ent.isIntersecting) { ent.target.classList.add("in"); io.unobserve(ent.target); } });
    }, { threshold: 0.15 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function updateNav() {
    var hash = location.hash || "#/";
    document.querySelectorAll(".nav a").forEach(function (a) {
      var href = a.getAttribute("href"), match = false;
      if (href === "#/acerca") match = hash === "#/acerca";
      else if (href === "#/") match = (hash === "#/" || hash === "" || hash.indexOf("#/tema/") === 0);
      if (match) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }


  /* La paleta rota sola entre las 5 (ink, neon, ember, gold, cinema). El cambio es suave
     porque los colores son propiedades registradas (@property) con transition en :root. */
  function initThemeCycle() {
    var order = ["ink", "neon", "ember", "gold", "cinema"], i = 0, root = document.documentElement;
    function apply(t) { if (t === "ink") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t); }
    apply("ink");
    if (reduceMotion) return;
    setInterval(function () { if (document.hidden) return; i = (i + 1) % order.length; apply(order[i]); }, 10000);
  }

  function onScroll() {
    var h = document.getElementById("site-header");
    if (h) {
      if (window.scrollY > 40 || currentRoute !== "home") h.classList.add("solid");
      else h.classList.remove("solid");
    }
    // historia: scroll-scrub (deriva a la derecha + zoom) + palabras clave que se encienden
    var story = document.querySelector(".story");
    if (story) {
      var svh = window.innerHeight, stotal = story.offsetHeight - svh;
      var sp = stotal > 0 ? Math.min(1, Math.max(0, (-story.getBoundingClientRect().top) / stotal)) : 0;
      if (reduceMotion) sp = 1;
      story.style.setProperty("--sp", sp.toFixed(4));
      var trk = story.querySelector(".story-track");
      if (trk) {
        var cs = trk.children, nC = cs.length, vw = window.innerWidth, focus = vw * 0.5;
        if (nC) {
          var c0 = cs[0].offsetLeft + cs[0].offsetWidth / 2, cN = cs[nC - 1].offsetLeft + cs[nC - 1].offsetWidth / 2;
          var T = focus - (c0 + sp * (cN - c0));
          trk.style.transform = "translate3d(" + T.toFixed(1) + "px,0,0)";
          for (var ci = 0; ci < nC; ci++) {
            var cx = cs[ci].offsetLeft + cs[ci].offsetWidth / 2 + T, d = (cx - focus) / vw;
            var sc = 0.7 + 0.62 * Math.exp(-(d * d) / 0.045);
            var op = Math.max(0, Math.min(1, (cx + vw * 0.05) / (vw * 0.3)));
            cs[ci].style.transform = "scale(" + sc.toFixed(3) + ")";
            cs[ci].style.opacity = op.toFixed(2);
            cs[ci].style.zIndex = Math.round(sc * 100);
          }
        }
      }
      var kws = story.querySelectorAll(".kw"), kn = kws.length;
      for (var ki = 0; ki < kn; ki++) { kws[ki].classList.toggle("on", sp > (ki + 0.6) / kn * 0.92); }
      if (sp > 0.32) { var ssg = story.querySelector(".story-sign .draw"); if (ssg) ssg.classList.add("in"); }
    }
    // rio horizontal del post: el escenario queda fijo y el scroll vertical empuja la pista de lado
    var river = document.querySelector(".river:not(.is-static)");
    if (river) {
      var rt = river.querySelector(".river-track"), maxX = Math.max(0, rt.scrollWidth - window.innerWidth), span = river.offsetHeight - window.innerHeight;
      var rpr = span > 0 ? Math.min(1, Math.max(0, -river.getBoundingClientRect().top / span)) : 0;
      rt.style.transform = "translate3d(" + (-rpr * maxX).toFixed(1) + "px,0,0)";
      river.style.setProperty("--rp", rpr.toFixed(4));
      var pis = river.querySelectorAll("[data-par]"), cap = (river.__gap || 88) * 0.3;
      for (var pk = 0; pk < pis.length; pk++) pis[pk].style.transform = "translate3d(" + Math.max(-cap, Math.min(cap, parseFloat(pis[pk].getAttribute("data-par")) * rpr * maxX)).toFixed(1) + "px,0,0)";
    }
    // scroll-expand integrado: A) crece + titulo se parte  B) gris + banners + firma
    var track = document.querySelector(".hero.scrollx");
    if (!track) return;
    var vh = window.innerHeight, total = track.offsetHeight - vh;
    var p = total > 0 ? Math.min(1, Math.max(0, (-track.getBoundingClientRect().top) / total)) : 0;
    if (reduceMotion) p = 0.6;
    var pA = Math.min(1, p / 0.55), eA = 1 - Math.pow(1 - pA, 3);
    var pB = Math.min(1, Math.max(0, (p - 0.5) / 0.42));
    var media = track.querySelector(".sx-media");
    if (media) { media.style.setProperty("--sx", (0.4 + 0.6 * eA).toFixed(3)); media.style.setProperty("--sx-g", pB.toFixed(3)); }
    var l = track.querySelector(".sx-word.l"), r = track.querySelector(".sx-word.r");
    if (l) { l.style.transform = "translateX(" + (-30 * eA).toFixed(2) + "vw)"; l.style.opacity = (1 - pB).toFixed(2); }
    if (r) { r.style.transform = "translateX(" + (30 * eA).toFixed(2) + "vw)"; r.style.opacity = (1 - pB).toFixed(2); }
    var banners = track.querySelector(".sx-banners");
    if (banners) banners.style.opacity = pB.toFixed(2);
    var solarEl = track.querySelector(".solar");
    if (solarEl) { solarEl.style.setProperty("--pty", (-p * 90).toFixed(0) + "px"); solarEl.style.setProperty("--psc", (1 + p * 0.3).toFixed(3)); }
    var hstars = track.querySelector(".hero-stars");
    if (hstars) hstars.style.transform = "translateY(" + (-p * 55).toFixed(0) + "px)";
    if (p > 0.68 && !heroSigDone) { heroSigDone = true; var firma = track.querySelector(".firma"); if (firma) firma.classList.add("in"); }
  }

  /* =======================================================================
     Router
     ======================================================================= */
  function scrollReset() { if (lenis) { lenis.scrollTo(0, { immediate: true }); } else { window.scrollTo(0, 0); } }
  function route() {
    var hash = location.hash || "#/";
    if (hash.indexOf("#/") !== 0) {
      var target = document.getElementById(hash.slice(1));
      if (target) {
        if (lenis) lenis.scrollTo(target, { offset: -66 });
        else target.scrollIntoView({ behavior: bigMotion ? "smooth" : "auto" });
        return;
      }
    }
    var temaMatch = hash.match(/^#\/tema\/([^/?#]+)/);
    if (temaMatch) { currentRoute = "tema"; viewTema(decodeURIComponent(temaMatch[1])); scrollReset(); }
    else if (hash === "#/acerca") { currentRoute = "acerca"; viewAcerca(); scrollReset(); }
    else { currentRoute = "home"; viewHome(); scrollReset(); }
    document.body.classList.toggle("route-post", currentRoute === "tema");
    onScroll();
  }

  /* ---- init ---- */
  function hideLoader() {
    var loader = document.getElementById("loader");
    document.body.classList.remove("loading");
    if (loader) loader.classList.add("done");
    var hero = document.querySelector(".hero");
    if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.remove("preload"); }); });
  }

  function diagOverlay() {
    var d = document.createElement("pre");
    d.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:9999;margin:0;padding:8px 10px;background:rgba(0,0,0,.9);color:#8fffc9;font:11px/1.45 monospace;white-space:pre-wrap;max-height:62vh;overflow:auto";
    document.body.appendChild(d);
    var frames = 0, t0 = performance.now();
    (function f() { frames++; requestAnimationFrame(f); })();
    function render() {
      var gl = false; try { var c = document.createElement("canvas"); gl = !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) {}
      var sx = document.querySelector(".sx-media");
      d.textContent = ["DIAG malo_ia", "OS reduce-motion: " + M.os, "forced full (?motion=1): " + M.full, "user motion off: " + M.off,
        "bigMotion: " + bigMotion + " | strict: " + reduceMotion, "viewport: " + innerWidth + "x" + innerHeight + "  dpr " + devicePixelRatio,
        "fps (rAF): " + Math.round(frames / ((performance.now() - t0) / 1000)), "webgl: " + gl, "lenis: " + !!lenis, "html class: [" + document.documentElement.className + "]",
        "hero --sx: " + (sx ? sx.style.getPropertyValue("--sx") : "-"), "scrollY: " + Math.round(scrollY), "planets canvas: " + document.querySelectorAll("canvas.pglobe").length,
        "errors: " + ((window.__errs || []).join(" | ") || "none"), "UA: " + navigator.userAgent].join("\n");
    }
    setInterval(render, 700); render();
  }
  function init() {
    if (/[?&]diag=1/.test(location.search)) safe(diagOverlay);
    initThemeCycle();
    if (bigMotion && typeof Lenis !== "undefined") {
      try {
        lenis = new Lenis({ duration: 1.08, smoothWheel: true });
        lenis.on("scroll", onScroll);
        requestAnimationFrame(function raf(t) { if (lenis) lenis.raf(t); requestAnimationFrame(raf); });
      } catch (e) { lenis = null; }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", route);
    route();
    onScroll();
    if (reduceMotion) { hideLoader(); }
    else {
      var done = false, go = function () { if (done) return; done = true; hideLoader(); };
      setTimeout(go, 1100);
      setTimeout(go, 3000);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
