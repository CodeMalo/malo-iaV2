/* Portado de mal-gusto-site (palabras.js = WordsPullUp) para malo_ia. */
/* ════════════════════════════════════════════════════════════════════════════
   palabras.js — WordsPullUp en JS vanilla, sin framer-motion.
   ============================================================================
   Puerto del componente de referencia: cada palabra entra desde abajo con un
   escalón de 80 ms entre hermanas, curva [0.16, 1, 0.3, 1] y 600 ms de tirada.

   Cómo se usa:
     <h1 data-palabras>Mal Gusto</h1>
     <h1 data-palabras data-asterisco>Mal Gusto</h1>

   Y para mezclar estilos por tramo, igual que WordsPullUpMultiStyle:
     <h1 data-palabras>
       Mal <em class="tono-oro">Gusto</em>
     </h1>
   Los elementos hijos conservan su etiqueta y sus clases; solo se parten sus
   palabras.

   Decisiones que importan:
   · La animación la hace CSS con `animation-delay`, no JS por frame. Corre en
     el compositor y no compite con el hilo principal mientras carga la página.
   · Cada palabra va envuelta en dos capas: la de fuera recorta (`overflow:
     hidden`) y la de dentro se desliza. Así la palabra nace DEBAJO de su propia
     línea base y aparece por detrás del borde, no flotando sobre el fondo.
   · Con prefers-reduced-motion no se parte nada: el texto se queda tal cual y
     no se toca el DOM.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var ESCALON = 80;    // ms entre palabras
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  function envolver(palabra, indice, asterisco) {
    var fuera = document.createElement("span");
    fuera.className = "palabra";
    var dentro = document.createElement("span");
    dentro.className = "palabra__int";
    dentro.style.animationDelay = (indice * ESCALON) + "ms";
    dentro.textContent = palabra;
    if (asterisco) {
      var a = document.createElement("span");
      a.className = "palabra__ast";
      a.setAttribute("aria-hidden", "true");
      a.textContent = "*";
      dentro.appendChild(a);
    }
    fuera.appendChild(dentro);
    return fuera;
  }

  // Recorre el árbol y reemplaza cada nodo de texto por sus palabras envueltas,
  // conservando los elementos intermedios (<em>, <span class="...">) y su estilo.
  function partir(raiz, estado) {
    var hijos = Array.prototype.slice.call(raiz.childNodes);
    hijos.forEach(function (nodo) {
      if (nodo.nodeType === 3) {
        var palabras = nodo.textContent.split(/\s+/).filter(Boolean);
        if (!palabras.length) return;
        var frag = document.createDocumentFragment();
        palabras.forEach(function (p) {
          frag.appendChild(envolver(p, estado.i++, false));
          frag.appendChild(document.createTextNode(" "));
        });
        raiz.replaceChild(frag, nodo);
      } else if (nodo.nodeType === 1 && !nodo.classList.contains("palabra")) {
        partir(nodo, estado);
      }
    });
  }

  function montar(el) {
    if (el.dataset.partido) return;
    el.dataset.partido = "1";

    // El texto original se conserva como etiqueta accesible: el lector de
    // pantalla oye la frase completa, no palabra suelta por palabra suelta.
    var texto = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", texto);

    if (quieto.matches) { el.classList.add("es-visible"); return; }

    var estado = { i: 0 };
    partir(el, estado);
    Array.prototype.forEach.call(el.querySelectorAll(".palabra__int"), function (n) {
      n.setAttribute("aria-hidden", "true");
    });
    if (el.hasAttribute("data-asterisco")) {
      var ultima = el.querySelectorAll(".palabra__int");
      if (ultima.length) {
        var a = document.createElement("span");
        a.className = "palabra__ast";
        a.setAttribute("aria-hidden", "true");
        a.textContent = "*";
        ultima[ultima.length - 1].appendChild(a);
      }
    }

    // Arranca al entrar en pantalla, una sola vez.
    if (!("IntersectionObserver" in window)) { el.classList.add("es-visible"); return; }
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("es-visible");
        vigia.unobserve(e.target);
      });
    }, { threshold: 0.1 });
    vigia.observe(el);
  }

  function montarTodos() {
    document.querySelectorAll("[data-palabras]").forEach(montar);
  }

  document.addEventListener("mg:pintado", montarTodos);
  if ("MutationObserver" in window) {
    var t = 0;
    new MutationObserver(function () {
      clearTimeout(t); t = setTimeout(montarTodos, 50);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montarTodos);
  } else {
    montarTodos();
  }
})();
