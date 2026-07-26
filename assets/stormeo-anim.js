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
 *   - LCP: hero H1 / LCP obrázek marker třídy nedostávají (řeší bespoke vrstva)
 *
 * Bespoke choreografie webu patří do {child-theme}/anim/custom.js (načítá plugin).
 */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'power2.out';
  var SEEN = 'saInit';

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
      gsap.set(els, PRESETS[name]);
      ST.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          batch.forEach(function (el, i) {
            gsap.to(el, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: dur(el), delay: i * 0.12 + delay(el), ease: EASE, overwrite: true });
          });
        }
      });
    });

    // ---- anim-stagger: kaskáda přímých dětí ----
    $$('.anim-stagger', root).filter(fresh).forEach(function (parent) {
      mark(parent);
      var kids = Array.prototype.slice.call(parent.children);
      if (!kids.length || reduced) return;
      gsap.set(kids, { y: 28, autoAlpha: 0 });
      ST.create({
        trigger: parent,
        start: 'top 88%',
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
      gsap.set(kids, { yPercent: 115 });
      ST.create({
        trigger: parent,
        start: 'top 87%',
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
      gsap.set(el, { scaleX: 0, transformOrigin: '0 50%' });
      ST.create({
        trigger: el,
        start: 'top 88%',
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
        start: 'top 85%',
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

  window.addEventListener('load', function () { ST.refresh(); });
})();
