# Changelog

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
