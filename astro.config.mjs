import { defineConfig } from 'astro/config';

// Demo ini diterbitkan sebagai GitHub Pages project site:
// https://daslidisalun.github.io/qrusaha/
// Saat naik ke domain produksi sendiri (qrusaha.click), kembalikan
// site ke 'https://qrusaha.click' dan hapus/kosongkan base.
// Semua URL internal dibangun lewat helper u() di src/lib/base.js yang
// membaca base dari konfigurasi ini.
export default defineConfig({
  site: 'https://daslidisalun.github.io',
  base: '/qrusaha/',
  trailingSlash: 'always',
});
