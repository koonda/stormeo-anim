# STORMEO Anim

Generická GSAP animační vrstva pro STORMEO weby stavěné v Bricks Builderu. Jeden plugin, stejný na každém webu — animace se řídí **marker třídami**, které přiřazuješ elementům v Bricks class pickeru.

## Instalace

1. Stáhni poslední release a nahraj do `wp-content/plugins/stormeo-anim/` (nebo nainstaluj do default staging setupu — klony ho zdědí).
2. Aktivuj. Aktivace automaticky založí marker třídy v Bricks global classes.
3. Updaty chodí z GitHub releases samy (plugin-update-checker, kontrola každé 2 h) — plugin si sám zapíná WP auto-update, takže se nová verze nainstaluje bez kliknutí, jakmile ji WP cron uvidí (typicky do pár hodin od release).

## Marker třídy

Třídy nenesou žádné CSS — jsou to čisté markery pro engine.

| Třída | Efekt |
|---|---|
| `anim-up` | fade + posun zdola (výchozí reveal) |
| `anim-fade` | čistý fade |
| `anim-left` / `anim-right` | fade + posun ze strany |
| `anim-zoom` | fade + jemný zoom |
| `anim-stagger` | **na rodiče** — přímé děti se odkryjí kaskádou (děti třídy nepotřebují) |
| `anim-mask` | **na rodiče** — děti vyjedou zpod masky (overflow hidden dodá engine) |
| `anim-line` | dokreslení linky zleva (scaleX 0→1) |
| `anim-count` | číselný counter — text „120+" se dopočítá od nuly |

Modifikátory (kombinuj s markerem): `anim-fast` (0,8 s) · `anim-slow` (2,2 s) · `anim-d1/d2/d3` (zpoždění 0,12/0,24/0,36 s).

## Pravidla použití

- **Grid/seznam = `anim-stagger` na wrapper**, ne `anim-up` na každou kartu.
- **Hero H1 a LCP obrázek marker třídy NIKDY nedostávají** — Google čeká na vykreslení LCP; hero řeší bespoke vrstva, která běží okamžitě po loadu.
- Skrývání probíhá **jen přes JS** (`gsap.set`) — bez JS je obsah normálně viditelný (SEO, přístupnost). Proti záblesku obsahu před startem enginu (studená cache) plugin vkládá do `<head>` pre-paint skrytí (`html.sa-prehide` + inline CSS) s failsafe timeoutem 4 s — když se engine nenastartuje, obsah se odkryje sám.
- `prefers-reduced-motion: reduce` → žádné animace, žádné skrývání.
- Bricks AJAX (query filtry, stránkování, popupy, akordeony, taby) — engine poslouchá Bricks eventy a nové/odkryté uzly doanimuje; obsah nikdy nezůstane schovaný.

## Bespoke vrstva webu

Choreografie vázaná na konkrétní design (hero timeline, pinovaný horizontální scroll, parallaxy) do marker tříd nepatří. Patří do **`{child-theme}/anim/custom.js`** — plugin ho automaticky načte po enginu (s `filemtime` verzí). GSAP + ScrollTrigger jsou v té chvíli registrované a k dispozici.

## Verzování

Semver, změny v [CHANGELOG.md](CHANGELOG.md). Release na GitHubu = update nabídnutý ve wp-adminu všech webů.
