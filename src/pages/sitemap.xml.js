import { ARTIKEL } from '../lib/blog.js';

// Alamat dasar dari astro.config.mjs (site + base) — semua URL mengikuti
// konfigurasi terbit, termasuk subpath bila nanti memakai GitHub Pages.
const site = (import.meta.env.SITE ?? '').replace(/\/$/, '');
const awalan = site + import.meta.env.BASE_URL.replace(/\/$/, '');
const statis = [
  '/',
  '/generator/',
  '/generator/whatsapp/',
  '/generator/wifi/',
  '/generator/tautan/',
  '/generator/ulasan-google/',
  '/generator/info-bayar/',
  '/generator/kartu-nama/',
  '/generator/teks/',
  '/stiker/',
  '/blog/',
  '/tentang/',
  '/kontak/',
  '/privasi/',
  '/disclaimer/',
];
const semua = [...statis, ...ARTIKEL.map((a) => `/blog/${a.slug}/`)];

export function GET() {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemaps/0.9">\n` +
    semua.map((p) => `  <url><loc>${awalan}${p}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
