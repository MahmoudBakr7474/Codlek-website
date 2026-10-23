<?php

/*
 * One-off export from the Laravel site (read only: it never boots the app,
 * so nothing touches its cache, storage or database).
 *
 * Writes, as UTF-8 JSON, what the .NET API starts from:
 *   site-defaults.json   Site::default() for every settings key (the originals)
 *   site-constants.json  lists the site validates against (sections, loader modes...)
 *   seed-data.json       the services and testimonials a fresh database starts with
 *   lang/ar.json, lang/en.json   lang/{ar,en}/site.php flattened to dot keys
 *
 * Usage: php export.php <laravel-dir> <out-dir>
 */

use App\Content\Site;
use App\Models\Service;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Support\Env;

[, $laravel, $out] = $argv + [null, null, null];

if (! $laravel || ! $out) {
    fwrite(STDERR, "usage: php export.php <laravel-dir> <out-dir>\n");
    exit(1);
}

$laravel = rtrim($laravel, '/\\');
$out = rtrim($out, '/\\');

require $laravel.'/vendor/autoload.php';

// Site::default() only reads config('codlek.*'): a bare container is enough.
Dotenv\Dotenv::create(Env::getRepository(), $laravel)->safeLoad();
Container::setInstance($app = new Container);
$app->instance('config', new Repository(['codlek' => require $laravel.'/config/codlek.php']));

$keys = [
    'home.hero_stats', 'home.hero_visual', 'home.hero_image', 'home.hero_trust_visible',
    'home.hero_main_project', 'home.hero_second_project', 'home.sections', 'home.why',
    'home.technologies', 'home.industries', 'home.journey', 'home.team',
    'about.stats', 'about.story', 'about.values', 'about.why', 'about.satisfaction',
    'legal.privacy', 'legal.terms',
    'contact.email', 'contact.phone', 'contact.phone_international', 'contact.whatsapp',
    'company.founded', 'social.links', 'mail.notify_emails', 'mail.send_confirmation',
    'seo.og_image', 'appearance.loader', 'appearance.theme', 'appearance.floating_contact',
];

$defaults = [];
foreach ($keys as $key) {
    $defaults[$key] = Site::default($key);
}

$constants = [
    'home_sections' => Site::HOME_SECTIONS,
    'hero_visuals' => Site::HERO_VISUALS,
    'hero_image' => Site::HERO_IMAGE,
    'tech_color' => Site::TECH_COLOR,
    'loader_modes' => Site::LOADER_MODES,
    'themes' => Site::THEMES,
    'social_platforms' => Site::SOCIAL_PLATFORMS,
    'service_tones' => Service::TONES,
];

$seed = [
    'services' => Site::defaultServices(),
    'testimonials' => Site::defaultTestimonials(),
];

function flatten(array $lines, string $prefix = ''): array
{
    $flat = [];
    foreach ($lines as $key => $value) {
        if (is_array($value)) {
            $flat += flatten($value, $prefix.$key.'.');
        } else {
            $flat[$prefix.$key] = $value;
        }
    }

    return $flat;
}

function write_json(string $path, mixed $data): void
{
    if (! is_dir(dirname($path))) {
        mkdir(dirname($path), 0777, true);
    }

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    file_put_contents($path, $json."\n");
    echo basename(dirname($path)).'/'.basename($path).': '.(is_array($data) ? count($data) : 1)." entries\n";
}

write_json($out.'/site-defaults.json', $defaults);
write_json($out.'/site-constants.json', $constants);
write_json($out.'/seed-data.json', $seed);

foreach (['ar', 'en'] as $locale) {
    write_json($out.'/lang/'.$locale.'.json', flatten(require $laravel.'/lang/'.$locale.'/site.php'));
}
