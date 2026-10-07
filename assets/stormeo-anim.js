/*!
 * STORMEO Anim — generická GSAP animační vrstva pro Bricks weby
 * https://github.com/koonda/stormeo-anim
 *
 * Marker třídy (přiřazuj v Bricks class pickeru, žádné CSS nenesou):
 *   anim-up | anim-fade | anim-left | anim-right | anim-zoom   reveal daného elementu
 *   anim-stagger   na RODIČE — přímé děti se odkryjí kaskádou (děti nepotřebují třídy)
 *   anim-mask      na RODIČE — děti vyjedou zpod masky (overflow hidden dodá engine)
 *   anim-line      dokreslení linky (scaleX 0→1 zleva)
 *   anim-count     číselný counter (text "120+" se dopočítá od 0)
 *   Modifikátory: anim-fast | anim-slow | anim-d1 | anim-d2 | anim-d3
 *
 * Zásady:
 *   - skrývání POUZE přes gsap.set (JS mimo provoz = obsah normálně vidět)
 *   - prefers-reduced-motion: žádné animace, žádné skrývání
 *   - neviditelné elementy (zavřený akordeon, popup) se přeskakují a doanimují
 *     až po Bricks eventu — obsah nikdy nezůstane schovaný
 *   - Bricks AJAX (query filtry, stránkování, popupy) → re-scan nových uzlů
 *   - změna výšky stránky (líně načtené obrázky, webfonty…) → přepočet triggerů
 *   - starty triggerů mimo první viewport jsou clamp() → prvek u konce stránky se odkryje nejpozději
 *     na jejím dně; prvky v prvním viewportu bez clamp() → odkryjí se hned po načtení
 *   - LCP: hero H1 / LCP obrázek marker třídy nedostávají (řeší bespoke vrstva)
 *
 * Bespoke choreografie webu patří do {child-theme}/anim/custom.js (načítá plugin).
 */
(function () {
  'use strict';

  // pre-paint skrytí z <head> (anti-FOUC) — sundat, jakmile skrývání převezme gsap.set;
  // při chybějícím GSAP okamžitě, jinak by failsafe držel obsah schovaný 4 s
  function releasePrehide() {
    if (window.stormeoAnimFailsafe) clearTimeout(window.stormeoAnimFailsafe);
    document.documentElement.classList.remove('sa-prehide');
  }

  if (!window.gsap || !window.ScrollTrigger) { releasePrehide(); return; }
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'power2.out';
  var SEEN = 'saInit';

  // Start triggeru. clamp() (GSAP 3.12+) ořízne start do rozsahu stránky → prvek u samého konce
  // stránky se odkryje nejpozději na jejím dně. Prvky, které jsou už při načtení nad spouštěcí
  // linkou (první viewport), ale clamp() dostat NESMÍ: jejich záporný start by se ořízl na 0
  // a ScrollTrigger by onEnter vyvolal až po prvním scrollu → obsah nad ohybem (hero perex,
  // CTA, H1 článku) zůstal skrytý (chyba 1.2.1). Měřit PŘED gsap.set (transformy posouvají box).
  function startAt(pos, el) {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var top = el.getBoundingClientRect().top + scrollTop;
    return top < window.innerHeight * parseFloat(pos) / 100 ? 'top ' + pos : 'clamp(top ' + pos + ')';
  }

  // overflow hidden pro masky — jediné CSS, které engine přidává
  var style = document.createElement('style');
  style.textContent = '.anim-mask{overflow:hidden}';
  document.head.appendChild(style);

  var PRESETS = {
    'anim-up':    { y: 36, autoAlpha: 0 },
    'anim-fade':  { autoAlpha: 0 },
    'anim-left':  { x: -48, autoAlpha: 0 },
    'anim-right': { x: 48, autoAlpha: 0 },
    'anim-zoom':  { scale: 0.94, autoAlpha: 0 }
  };

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function visible(el) { return el.offsetParent !== null || getComputedStyle(el).position === 'fixed'; }
  function fresh(el) { return !el.dataset[SEEN] && visible(el); }
  function mark(el) { el.dataset[SEEN] = '1'; }
  function dur(el) {
    return el.classList.contains('anim-fast') ? 0.8 : el.classList.contains('anim-slow') ? 2.2 : 1.5;
  }
  function delay(el) {
    return el.classList.contains('anim-d1') ? 0.12 : el.classList.contains('anim-d2') ? 0.24 : el.classList.contains('anim-d3') ? 0.36 : 0;
  }

  function initScope(root) {
    root = root || document;

    // ---- single reveals (batch + stagger dle blízkosti) ----
    Object.keys(PRESETS).forEach(function (name) {
      var els = $$('.' + name, root).filter(fresh);
      if (!els.length) return;
      els.forEach(mark);
      if (reduced) return;
      // skupiny podle startu (první viewport bez clamp, zbytek s clamp) - změřit před gsap.set
      var groups = {};
      els.forEach(function (el) { var s = startAt('88%', el); (groups[s] = groups[s] || []).push(el); });
      gsap.set(els, PRESETS[name]);
      Object.keys(groups).forEach(function (start) {
        ST.batch(groups[start], {
          start: start,
          once: true,
          onEnter: function (batch) {
            batch.forEach(function (el, i) {
              gsap.to(el, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: dur(el), delay: i * 0.12 + delay(el), ease: EASE, overwrite: true });
            });
          }
        });
      });
    });

    // ---- anim-stagger: kaskáda přímých dětí ----
    $$('.anim-stagger', root).filter(fresh).forEach(function (parent) {
      mark(parent);
      var kids = Array.prototype.slice.call(parent.children);
      if (!kids.length || reduced) return;
      var staggerStart = startAt('88%', parent);
      gsap.set(kids, { y: 28, autoAlpha: 0 });
      ST.create({
        trigger: parent,
        start: staggerStart,
        once: true,
        onEnter: function () {
          gsap.to(kids, { y: 0, autoAlpha: 1, duration: dur(parent), delay: delay(parent), stagger: 0.1, ease: EASE, overwrite: true });
        }
      });
    });

    // ---- anim-mask: děti vyjedou zpod masky ----
    $$('.anim-mask', root).filter(fresh).forEach(function (parent) {
      mark(parent);
      var kids = Array.prototype.slice.call(parent.children);
      if (!kids.length || reduced) return;
      var maskStart = startAt('87%', parent);
      gsap.set(kids, { yPercent: 115 });
      ST.create({
        trigger: parent,
        start: maskStart,
        once: true,
        onEnter: function () {
          gsap.to(kids, { yPercent: 0, duration: dur(parent), delay: delay(parent), stagger: 0.08, ease: 'power3.out', overwrite: true });
        }
      });
    });

    // ---- anim-line: dokreslení zleva ----
    $$('.anim-line', root).filter(fresh).forEach(function (el) {
      mark(el);
      if (reduced) return;
      var lineStart = startAt('88%', el);
      gsap.set(el, { scaleX: 0, transformOrigin: '0 50%' });
      ST.create({
        trigger: el,
        start: lineStart,
        once: true,
        onEnter: function () {
          gsap.to(el, { scaleX: 1, duration: dur(el), delay: delay(el), ease: EASE, overwrite: true });
        }
      });
    });

    // ---- anim-count: dopočítání čísla (respektuje prefix/suffix, mezery) ----
    $$('.anim-count', root).filter(fresh).forEach(function (el) {
      mark(el);
      if (reduced) return;
      var m = el.textContent.trim().match(/^([^\d]*)([\d\s ]+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[2].replace(/[\s ]/g, ''), 10);
      if (isNaN(target)) return;
      var prefix = m[1] || '', suffix = m[3] || '';
      var obj = { v: 0 };
      ST.create({
        trigger: el,
        start: startAt('85%', el),
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 2.2, delay: delay(el), ease: EASE,
            onUpdate: function () { el.textContent = prefix + Math.round(obj.v) + suffix; }
          });
        }
      });
    });
  }

  function rescan() {
    requestAnimationFrame(function () {
      initScope(document);
      ST.refresh();
    });
  }

  initScope(document);
  releasePrehide();

  // Bricks AJAX a interaktivní obsah — nové/odkryté uzly doanimovat, nikdy nenechat schované
  [
    'bricks/ajax/query_result/displayed',
    'bricks/ajax/pagination/completed',
    'bricks/ajax/nodes_added',
    'bricks/ajax/popup/loaded',
    'bricks/popup/open',
    'bricks/accordion/open',
    'bricks/tabs/changed'
  ].forEach(function (ev) { document.addEventListener(ev, rescan); });

  // ---- Přepočet triggerů při změně výšky stránky ----
  // ScrollTrigger si pozice spočítá při initu. Když se pak stránka zkrátí/prodlouží
  // (líně načtený obrázek bez rozměrů, webfont, rozbalený obsah), starty zůstanou na
  // starých místech — prvek u konce stránky by se nikdy neodkryl. Proto sledujeme výšku
  // dokumentu a při skutečné změně (≥ 2 px) přepočítáme, s debounce a bez smyčky
  // (výška se zapisuje až PO refreshi, takže změna způsobená samotným refreshem
  // — např. pin spacery z custom.js — vyvolá nanejvýš jeden další přepočet).
  var lastHeight = document.documentElement.scrollHeight;
  var refreshTimer = null;
  function refreshNow() {
    ST.refresh();
    lastHeight = document.documentElement.scrollHeight;
  }
  function refreshIfResized() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      if (Math.abs(document.documentElement.scrollHeight - lastHeight) >= 2) refreshNow();
    }, 150);
  }

  if (!reduced) {
    if ('ResizeObserver' in window) {
      new ResizeObserver(refreshIfResized).observe(document.body);
    }
    // načtení obrázku (load nebublá → capture fáze) — pojistka pro prohlížeče bez ResizeObserveru
    document.addEventListener('load', function (e) {
      if (e.target && e.target.tagName === 'IMG') refreshIfResized();
    }, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshIfResized);
  }

  window.addEventListener('load', refreshNow);
})();
