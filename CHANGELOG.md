# Changelog

## 1.0.0 — 2026-07-26

První release.

- Engine `stormeo-anim.js`: marker třídy `anim-up/fade/left/right/zoom`, `anim-stagger`, `anim-mask`, `anim-line`, `anim-count` + modifikátory `anim-fast/slow`, `anim-d1..d3`.
- Skrývání jen přes `gsap.set` (bez JS obsah viditelný), `prefers-reduced-motion` = bez animací.
- Re-scan po Bricks eventech: `bricks/ajax/query_result/displayed`, `bricks/ajax/pagination/completed`, `bricks/ajax/nodes_added`, `bricks/ajax/popup/loaded`, `bricks/popup/open`, `bricks/accordion/open`, `bricks/tabs/changed`.
- Aktivace pluginu idempotentně založí marker třídy v Bricks global classes.
- Hook na bespoke vrstvu `{child-theme}/anim/custom.js`.
- Self-hosted GSAP 3.13 + ScrollTrigger; auto-updaty přes plugin-update-checker v5.6 (GitHub releases).
