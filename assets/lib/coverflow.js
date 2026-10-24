/* ════════════════════════════════════════════════════════════════════════════
   coverflow.js — Carrusel coverflow en JS vanilla, sin React.
   ============================================================================
   Puerto de CoverflowCarousel. Se conserva la matemática del original, que es
   lo que lo hace ver bien:

   · `pos` es un índice FRACCIONARIO y es la única fuente de verdad. Todo lo
     demás (giro, profundidad, opacidad, apilado) se deriva de él.
   · El bucle se hace plegando la distancia por el lado corto del anillo. No se
     clonan nodos ni se reordena el DOM: la tarjeta se teletransporta al otro
     extremo justo a media vuelta, cuando su opacidad ya es cero.
   · `ramp = distancia ^ falloff` con falloff < 1 hace que el giro y el retroceso
     se aflojen conforme la tarjeta se aleja. Con una rampa lineal la segunda
     tarjeta se cierra de canto y deja de leerse.
   · El giro se topa antes del canto (82°) para que ninguna tarjeta llegue a dar
     la espalda.

   DIFERENCIA CON EL ORIGINAL — mejora deliberada:
   El componente de React construía las tarjetas desde un arreglo. Aquí el HTML
   ya trae los artículos como enlaces normales y este script los ACOMODA. Si el
   JS no carga, la revista sigue siendo una lista navegable y enlazable, no un
   hueco. Y el buscador de Google indexa los enlaces igual.

   USO
     <div class="cf" data-coverflow>
       <div class="cf__pista" data-cf-pista>
         <a class="cf__lamina" href="...">…</a>
         …
       </div>
     </div>
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var OPC = {
    rotate: 44,        // grados que gira la primera vecina
    depth: 0.6,        // cuánto retrocede, en fracciones del ancho de tarjeta
    perspective: 3,    // distancia del ojo, en múltiplos del ancho
    falloff: 0.56,     // exponente sobre la distancia (<1 afloja al alejarse)
    fade: 0.1,         // opacidad que pierde por paso desde el centro
    gap: 0.05,         // separación entre tarjetas, en fracciones del ancho
    tiltMax: 82,       // tope de giro: nunca de canto
    inercia: 0.16,     // factor del asentado exponencial
    flickMax: 2        // el envión nunca arrastra más de dos tarjetas
  };

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  function montar(raiz) {
    if (raiz.dataset.montado) return;
    var pista = raiz.querySelector("[data-cf-pista]");
    if (!pista) return;
    var laminas = Array.prototype.slice.call(pista.children);
    var n = laminas.length;
    if (n < 2) return;
    raiz.dataset.montado = "1";
    raiz.classList.add("es-activo");

    var o = Object.assign({}, OPC);
    ["rotate", "depth", "perspective", "falloff", "fade", "gap"].forEach(function (k) {
      if (raiz.dataset[k]) o[k] = parseFloat(raiz.dataset[k]);
    });

    var pos = 0, destino = 0, ancho = 0, raf = null, arrastre = null, sel = 0;

    raiz.setAttribute("role", "region");
    raiz.setAttribute("aria-roledescription", "carousel");
    if (!raiz.hasAttribute("aria-label")) raiz.setAttribute("aria-label", "Hall of fame clips");
    pista.style.perspective = "calc(var(--cf-card) * " + o.perspective + ")";

    laminas.forEach(function (l, i) {
      l.setAttribute("role", "group");
      l.setAttribute("aria-roledescription", "slide");
      l.setAttribute("aria-label", (i + 1) + " of " + n);
    });

    function indiceEn(p) { return ((Math.round(p) % n) + n) % n; }

    // Se pinta DIRECTO al DOM. Sesenta actualizaciones de estado por segundo
    // repintarían todas las tarjetas por números que nadie necesita ver.
    function pintar() {
      if (!ancho) return;
      var paso = ancho * (1 + o.gap);
      for (var i = 0; i < n; i++) {
        var l = laminas[i];
        var off = i - pos;
        off = ((off % n) + n) % n;
        if (off > n / 2) off -= n;              // el lado corto del anillo

        var dist = Math.abs(off);
        var rampa = Math.pow(dist, o.falloff);
        var giro = Math.min(o.rotate * rampa, o.tiltMax) * Math.sign(off);

        l.style.transform =
          "translateX(calc(-50% + " + (off * paso) + "px)) " +
          "translateZ(" + (-o.depth * ancho * rampa) + "px) " +
          "rotateY(" + (-giro) + "deg)";

        // A media vuelta la tarjeta salta al otro extremo: tiene que haberse
        // apagado para entonces o el brinco se ve.
        var borde = Math.min(1, Math.max(0, n / 2 - dist));
        l.style.opacity = String(Math.max(0, 1 - o.fade * dist) * borde);
        l.style.zIndex = String(100 - Math.round(dist));
        var centro = Math.round(pos) === i;
        l.classList.toggle("es-centro", centro);
        l.tabIndex = centro ? 0 : -1;
        l.setAttribute("aria-hidden", dist > n / 2 - 0.5 ? "true" : "false");
      }
    }

    function asentar(t) {
      if (raf !== null) cancelAnimationFrame(raf);
      destino = t;
      var nuevo = indiceEn(t);
      if (nuevo !== sel) { sel = nuevo; marcarPuntos(); }
      if (quieto.matches) { pos = t; pintar(); raf = null; return; }
      (function paso() {
        var falta = destino - pos;
        if (Math.abs(falta) < 0.0004) { pos = destino; pintar(); raf = null; return; }
        pos += falta * o.inercia;               // ease-out exponencial, no resorte
        pintar();
        raf = requestAnimationFrame(paso);
      })();
    }

    // `destino` y no `pos`: si se pulsa a media transición, partir de `pos`
    // se comería la pulsación hasta que el redondeo alcanzara a moverse.
    function empujar(d) { asentar(Math.round(destino) + d); }
    function irA(i) { asentar(i + Math.round((destino - i) / n) * n); }

    // ── Arrastre ─────────────────────────────────────────────────────────────
    pista.addEventListener("pointerdown", function (e) {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      pista.setPointerCapture(e.pointerId);
      destino = pos;
      arrastre = { id: e.pointerId, x: e.clientX, pos: pos, v: 0, t: performance.now() };
      raiz.classList.add("es-arrastrando");
    });

    pista.addEventListener("pointermove", function (e) {
      if (!arrastre || arrastre.id !== e.pointerId) return;
      var paso = ancho * (1 + o.gap);
      if (!paso) return;
      var ahora = performance.now(), previo = pos;
      pos = arrastre.pos - (e.clientX - arrastre.x) / paso;
      arrastre.v = ((pos - previo) / Math.max(ahora - arrastre.t, 1)) * 1000;  // tarjetas/s
      arrastre.t = ahora;
      var i = indiceEn(pos);
      if (i !== sel) { sel = i; marcarPuntos(); }
      pintar();
    });

    function soltar(e) {
      if (!arrastre || arrastre.id !== e.pointerId) return;
      var v = arrastre.v;
      arrastre = null;
      raiz.classList.remove("es-arrastrando");
      var lleva = Math.max(-o.flickMax, Math.min(o.flickMax, v * 0.18));
      asentar(Math.round(pos + lleva));
    }
    pista.addEventListener("pointerup", soltar);
    pista.addEventListener("pointercancel", soltar);

    // Un arrastre no debe disparar el enlace de la tarjeta.
    laminas.forEach(function (l) {
      l.addEventListener("click", function (e) {
        if (raiz.dataset.arrastrado === "1") { e.preventDefault(); raiz.dataset.arrastrado = "0"; }
      });
    });
    pista.addEventListener("pointermove", function () {
      if (arrastre && Math.abs(arrastre.v) > 0.05) raiz.dataset.arrastrado = "1";
    });

    // ── Teclado ──────────────────────────────────────────────────────────────
    pista.tabIndex = 0;
    pista.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); empujar(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); empujar(1); }
    });

    // ── Puntos ───────────────────────────────────────────────────────────────
    var puntos = document.createElement("div");
    puntos.className = "cf__puntos";
    for (var j = 0; j < n; j++) {
      (function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cf__punto";
        b.setAttribute("aria-label", "Go to clip " + (k + 1));
        b.addEventListener("click", function () { irA(k); });
        puntos.appendChild(b);
      })(j);
    }
    raiz.appendChild(puntos);
    function marcarPuntos() {
      for (var i = 0; i < n; i++) {
        puntos.children[i].classList.toggle("es-activo", i === sel);
        puntos.children[i].setAttribute("aria-current", i === sel ? "true" : "false");
      }
    }
    marcarPuntos();

    // ── Medición ─────────────────────────────────────────────────────────────
    // El ancho de tarjeta manda sobre el paso, la profundidad y la perspectiva.
    // Es lo único que vale la pena medir, y solo cuando la caja cambia.
    function medir() {
      var a = laminas[0].offsetWidth;
      if (a && a !== ancho) { ancho = a; pintar(); }
      else if (a) { ancho = a; pintar(); }
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(raiz);
    else window.addEventListener("resize", medir);
    laminas.forEach(function (l) {
      var img = l.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", medir, { once: true });
    });
  }

  function montarTodos() {
    document.querySelectorAll("[data-coverflow]").forEach(montar);
  }

  document.addEventListener("mg:pintado", montarTodos);
  if ("MutationObserver" in window) {
    var t = 0;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(montarTodos, 60); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montarTodos);
  } else { montarTodos(); }
})();
