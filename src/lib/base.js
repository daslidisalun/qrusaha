// base.js — SATU-SATUNYA helper jalur dasar (base path) situs.
//
// Nilai BASE diambil dari konfigurasi Astro (astro.config.mjs → base),
// terbaca lewat import.meta.env.BASE_URL yang selalu diakhiri '/'.
// Semua URL internal WAJIB dibangun lewat u() agar otomatis mengikuti
// base — mis. di GitHub Pages project site: '/qrusaha/'.
export const BASE = import.meta.env.BASE_URL;

// u('/generator/wifi/') → '/generator/wifi/' (atau '/qrusaha/generator/wifi/')
// u('/')                → '/' (atau '/qrusaha/')
export const u = (path) => BASE + String(path).replace(/^\/+/, '');
