// count-words.mjs — hitung kata isi utama (<main>) setiap halaman dist.
// Cara pakai: node count-words.mjs [dirDist]
// Mengeluarkan tabel: path, jumlah kata. Kata = token berisi huruf/angka.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? new URL('./dist', import.meta.url).pathname;

function* jalan(dir) {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama);
    if (statSync(p).isDirectory()) yield* jalan(p);
    else if (nama.endsWith('.html')) yield p;
  }
}

const dekode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');

const baris = [];
for (const berkas of [...jalan(dist)].sort()) {
  const html = readFileSync(berkas, 'utf8');
  const m = html.match(/<main>([\s\S]*?)<\/main>/);
  let isi = m ? m[1] : '';
  isi = isi
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const kata = dekode(isi)
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
  const rel = '/' + relative(dist, berkas).replace(/index\.html$/, '').replace(/\.html$/, '/');
  baris.push([rel === '//' ? '/' : rel.replace('//', '/'), kata.length]);
}

let total = 0;
for (const [jalur, n] of baris) {
  total += n;
  console.log(`${String(n).padStart(6)}  ${jalur}`);
}
console.log(`\n${baris.length} halaman, total ${total} kata. Di bawah 1000:`);
for (const [jalur, n] of baris) if (n < 1000) console.log(`  ${n}\t${jalur}`);
