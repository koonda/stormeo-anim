<?php
/**
 * Plugin Name:       STORMEO Anim
 * Plugin URI:        https://github.com/koonda/stormeo-anim
 * Description:       Generická GSAP animační vrstva pro STORMEO weby (Bricks). Marker třídy anim-* přiřazuješ v class pickeru; bespoke choreografie webu patří do {child-theme}/anim/custom.js.
 * Version:           1.1.0
 * Author:            STORMEO
 * Author URI:        https://stormeo.cz
 * License:           GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP:      7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('STORMEO_ANIM_VERSION', '1.1.0');
define('STORMEO_ANIM_URL', plugin_dir_url(__FILE__));
define('STORMEO_ANIM_DIR', plugin_dir_path(__FILE__));

/**
 * Frontend enqueue. Nikdy v adminu ani v Bricks builderu (?bricks=run).
 */
add_action('wp_enqueue_scripts', function () {
    if (isset($_GET['bricks'])) {
        return;
    }

    wp_enqueue_script('stormeo-gsap', STORMEO_ANIM_URL . 'assets/gsap.min.js', [], '3.13.0', true);
    wp_enqueue_script('stormeo-gsap-st', STORMEO_ANIM_URL . 'assets/ScrollTrigger.min.js', ['stormeo-gsap'], '3.13.0', true);
    wp_enqueue_script('stormeo-anim', STORMEO_ANIM_URL . 'assets/stormeo-anim.js', ['stormeo-gsap-st'], STORMEO_ANIM_VERSION, true);

    // Bespoke vrstva webu: {child-theme}/anim/custom.js (hero timeline, pinované sekce, parallaxy…)
    $custom = get_stylesheet_directory() . '/anim/custom.js';
    if (file_exists($custom)) {
        wp_enqueue_script(
            'stormeo-anim-custom',
            get_stylesheet_directory_uri() . '/anim/custom.js',
            ['stormeo-anim'],
            (string) filemtime($custom),
            true
        );
    }
});

/**
 * Pre-paint skrytí markerů (anti-FOUC).
 *
 * Skrývání dělá jinak až JS (gsap.set) — na pomalé lince to znamená záblesk
 * obsahu před startem enginu. Inline skript v <head> proto přidá na <html>
 * třídu `sa-prehide` ještě před prvním vykreslením a CSS pod ní markery schová.
 *
 * Pojistky (obsah NIKDY nezůstane schovaný):
 *   - bez JS se třída vůbec nepřidá → obsah viditelný
 *   - prefers-reduced-motion → třída se nepřidá
 *   - engine po initu třídu sundá (viz stormeo-anim.js)
 *   - failsafe: když se engine do 4 s nenastartuje, třídu sundá timeout
 */
add_action('wp_head', function () {
    if (isset($_GET['bricks'])) {
        return;
    }
    ?>
<style id="stormeo-anim-prehide">html.sa-prehide .anim-up,html.sa-prehide .anim-fade,html.sa-prehide .anim-left,html.sa-prehide .anim-right,html.sa-prehide .anim-zoom,html.sa-prehide .anim-line,html.sa-prehide .anim-stagger>*,html.sa-prehide .anim-mask>*{visibility:hidden}</style>
<script id="stormeo-anim-prehide-js">(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.classList.add('sa-prehide');window.stormeoAnimFailsafe=setTimeout(function(){d.classList.remove('sa-prehide')},4000);}catch(e){}})();</script>
    <?php
}, 1);

/**
 * Aktivace: založí marker třídy v Bricks global classes (idempotentně).
 * Třídy nenesou žádné styly — jsou to čisté markery pro engine,
 * díky registraci jsou ale k dispozici v Bricks class pickeru.
 */
register_activation_hook(__FILE__, 'stormeo_anim_register_marker_classes');

function stormeo_anim_register_marker_classes() {
    $markers = [
        'anim-up', 'anim-fade', 'anim-left', 'anim-right', 'anim-zoom',
        'anim-stagger', 'anim-mask', 'anim-line', 'anim-count',
        'anim-fast', 'anim-slow', 'anim-d1', 'anim-d2', 'anim-d3',
    ];

    $classes = get_option('bricks_global_classes', []);
    if (!is_array($classes)) {
        return; // Bricks není k dispozici / nečekaný stav — nesahat
    }

    $existing_names = array_column($classes, 'name');
    $existing_ids   = array_column($classes, 'id');
    $added = false;

    foreach ($markers as $name) {
        if (in_array($name, $existing_names, true)) {
            continue;
        }
        do {
            $id = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 1)
                . substr(md5($name . wp_rand()), 0, 5);
        } while (in_array($id, $existing_ids, true));
        $existing_ids[] = $id;
        $classes[] = ['id' => $id, 'name' => $name, 'settings' => []];
        $added = true;
    }

    if ($added) {
        update_option('bricks_global_classes', $classes);
    }
}

/**
 * Auto-updaty z GitHub releases (plugin-update-checker).
 */
require STORMEO_ANIM_DIR . 'lib/plugin-update-checker/plugin-update-checker.php';

$stormeo_anim_update_checker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
    'https://github.com/koonda/stormeo-anim/',
    __FILE__,
    'stormeo-anim'
);
$stormeo_anim_update_checker->getVcsApi()->enableReleaseAssets();
