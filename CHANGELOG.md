# Changelog

## 1.3.0 — 2026-11-23

Přístupnost a plynulý scroll na mobilu ([#1](https://github.com/koonda/stormeo-anim/issues/1), [#2](https://github.com/koonda/stormeo-anim/issues/2)).

**Přístupnost (#1)**
- Skrývání před odhalením jen průhledností (`opacity`), už ne `autoAlpha` (`visibility: hidden`). Obsah pod ohybem zůstává ve stromu přístupnosti: čtečka ho najde a Tab ho nepřeskočí (typicky kontaktní formulář s `anim-up`).
- Pre-hide CSS v `<head>` (`html.sa-prehide …`) také jen `opacity: 0`.
- Fokus z klávesnice na prvku, který se ještě neodhalil (i uvnitř `anim-stagger` / `anim-mask`), ho odhalí hned a bez animace.
- Po dokončení animace se inline styly uklidí (`clearProps`). Dřív na prvku zůstalo `translate: none; transform: …` a přebíjelo posuny a hover efekty z CSS tříd. Pozor: kdo v `custom.js` animuje transformace prvku, který má zároveň marker `anim-*`, přijde o ně po odhalení (marker a bespoke animaci nekombinovat na jednom prvku).

**Scroll na mobilu (#2)**
- `ScrollTrigger.refresh()` jen v klidu: ne při doteku a ne do 300 ms od posledního `scroll`. Refresh měří přes `scrollTo(0, 0)` a vrací uloženou pozici, což uprostřed setrvačnosti scroll na mobilu tvrdě utne. Týká se přepočtu po změně výšky stránky (dočtené obrázky, fonty), Bricks AJAX re-scanu i přepočtu po `load`.
- Refresh se nevolá, když už nečeká žádný trigger (`once` triggery se po spuštění samy zabijí).
- `ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,resize' })`: adresní řádek nespouští refresh, `load` obsluhuje engine odloženě.
- iOS: nová navigace bez kotvy začíná nahoře. iOS Safari při načítání krátce hlásí `pageYOffset` předchozí stránky a startovní refresh na něj stránku „vrátil“ (nová stránka se otevřela v polovině). Jen `navigation.type === 'navigate'`, bez `#kotvy` a dokud uživatel nic neudělal. Reload a tlačítko Zpět beze změny.
- Inline pre-hide skript má `data-no-optimize`, `data-no-defer`, `data-no-minify` a `data-cfasync="false"`, aby ho optimalizační pluginy neodložily (FlyingPress viz README).

**Ověřeno** na testovací stránce (Playwright, Chromium a emulace iPhonu, srovnání s 1.2.2): `visibility: hidden` 11 → 0 prvků; tlačítko formuláře pod ohybem dostupné přes `getByRole`; fokus formulář odhalí; `scrollTo` během scrollu se změnou výšky 6 → 0 (jeden refresh až v klidu); po animaci 0 prvků s inline transformací; první viewport se odkryje bez scrollu; po dojetí stránky nic skrytého; `prefers-reduced-motion` nic neskrývá; kotva, reload a Zpět drží pozici.

Pozn.: přepis jednorázových reveals na `IntersectionObserver` (bod 5 v #2) zůstává na další verzi.

## 1.2.2 — 2026-10-07

Oprava regrese z 1.2.1: prvky v prvním viewportu se neodkryly, dokud uživatel nezascrolloval.

- `clamp()` ořezával záporný start prvků nad ohybem na 0 a ScrollTrigger na pozici 0 `onEnter` nevyvolá → hero perex, CTA nebo H1 článku zůstaly skryté (`autoAlpha: 0`) až do prvního scrollu (i pro Googlebot).
- Start se teď volí podle polohy prvku při initu (měřeno před `gsap.set`): prvek nad spouštěcí linkou → `top 88%` bez clamp (odkryje se hned po načtení jako v 1.2.0), ostatní → `clamp(top 88%)` (oprava spodních sekcí z 1.2.1 zůstává). `ST.batch` se dělí do skupin podle startu.
- Ověřeno headless na finnessa.cz (hub služeb, článek, homepage): 0 skrytých prvků ve viewportu bez scrollu; spodní sekce se odkryjí; `prefers-reduced-motion` beze změny.

## 1.2.1 — 2026-10-06

Oprava: reveal se nespustil, když se po initu změnila výška stránky.

- Engine sleduje výšku dokumentu (`ResizeObserver` na `<body>`, `load` obrázků v capture fázi, `document.fonts.ready`) a při skutečné změně (≥ 2 px, debounce 150 ms) zavolá `ScrollTrigger.refresh()`. Dřív zůstaly pozice triggerů spočítané podle stavu při initu — typicky líně načtené obrázky bez rozměrů (Bricks lazy-load dává SVG placeholder 1×1) stránku po načtení zkrátily, starty spodních sekcí skončily za `maxScroll` a obsah zůstal schovaný.
- Starty všech triggerů jsou `clamp(top …)` (GSAP 3.12+): prvek, jehož start by vyšel za konec stránky, se odkryje nejpozději na jejím dně.
- Bez smyčky: výška se ukládá až po refreshi, takže změnu způsobenou samotným refreshem (pin spacery z `custom.js`) zachytí nanejvýš jeden další přepočet.
- `prefers-reduced-motion` beze změny (žádné triggery, žádné observery).

## 1.2.0 — 2026-07-26

Bezobslužné updaty.

- Plugin sám povoluje WP auto-update (`auto_update_plugin` filter pro vlastní basename) — release z GitHubu se nainstaluje bez kliknutí, jakmile ho WP cron uvidí.
- PUC check perioda zkrácena z 12 h na 2 h → nová verze doteče na weby typicky do pár hodin od release.
- Pozn.: WP cron běží při návštěvách webu — web zcela bez trafficu se updatne až při první návštěvě/přihlášení.

## 1.1.0 — 2026-07-26

Anti-FOUC: pre-paint skrytí markerů.

- Nový inline snippet ve `wp_head` (priorita 1): skript přidá na `<html>` třídu `sa-prehide` ještě před prvním vykreslením a inline CSS pod ní schová marker elementy (`anim-up/fade/left/right/zoom/line`, děti `anim-stagger`/`anim-mask`). Odstraňuje záblesk obsahu před startem enginu na studené cache.
- Engine po initu (`gsap.set` aplikován) třídu `sa-prehide` sundá; při chybějícím GSAP ji sundá okamžitě.
- Failsafe: když se engine do 4 s nenastartuje (CDN/JS chyba), timeout z inline skriptu třídu sundá sám — obsah nikdy nezůstane schovaný.
- Bez JS se třída vůbec nepřidá; `prefers-reduced-motion` třídu nepřidává → chování beze změny.
- V builderu (`?bricks=`) se snippet nevkládá.

## 1.0.0 — 2026-07-26

První release.

- Engine `stormeo-anim.js`: marker třídy `anim-up/fade/left/right/zoom`, `anim-stagger`, `anim-mask`, `anim-line`, `anim-count` + modifikátory `anim-fast/slow`, `anim-d1..d3`.
- Skrývání jen přes `gsap.set` (bez JS obsah viditelný), `prefers-reduced-motion` = bez animací.
- Re-scan po Bricks eventech: `bricks/ajax/query_result/displayed`, `bricks/ajax/pagination/completed`, `bricks/ajax/nodes_added`, `bricks/ajax/popup/loaded`, `bricks/popup/open`, `bricks/accordion/open`, `bricks/tabs/changed`.
- Aktivace pluginu idempotentně založí marker třídy v Bricks global classes.
- Hook na bespoke vrstvu `{child-theme}/anim/custom.js`.
- Self-hosted GSAP 3.13 + ScrollTrigger; auto-updaty přes plugin-update-checker v5.6 (GitHub releases).
