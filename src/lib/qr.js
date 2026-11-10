// qr.js — inti QR QRUsaha: enkode 100% di browser (qrcode-generator,
// Kazuhiko Arase), pembangun muatan (payload) per jenis QR, dan utilitas
// warna/kontras. Tidak ada satu pun fungsi di sini yang memanggil jaringan:
// semua QR dibuat lokal di perangkat pengunjung.
import qrcode from 'qrcode-generator';

// ---------- Enkode QR ----------
// level: 'L' | 'M' | 'Q' | 'H'. Mengembalikan objek QR dengan
// getModuleCount() dan isDark(baris, kolom).
export function buatQR(teks, level = 'M') {
  const qr = qrcode(0, level);
  qr.addData(teks, 'Byte');
  qr.make();
  return qr;
}

// ---------- Render SVG (string) ----------
export function qrKeSVG(teks, { level = 'M', gelap = '#22303A', terang = '#FFFFFF', tepi = 4 } = {}) {
  const qr = buatQR(teks, level);
  const n = qr.getModuleCount();
  const total = n + tepi * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c + tepi} ${r + tepi}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="Kode QR"><rect width="${total}" height="${total}" fill="${terang}"/><path d="${d}" fill="${gelap}"/></svg>`;
}

// ---------- Render ke canvas (untuk unduhan PNG & logo) ----------
// ukuran = sisi canvas dalam piksel (persegi, termasuk zona tenang).
export function gambarKeCanvas(teks, { level = 'M', gelap = '#22303A', terang = '#FFFFFF', ukuran = 1024, logo = null } = {}) {
  const qr = buatQR(teks, level);
  const n = qr.getModuleCount();
  const tepi = 4;
  const total = n + tepi * 2;
  const sel = Math.floor(ukuran / total);
  const sisi = sel * total;
  const kanvas = document.createElement('canvas');
  kanvas.width = sisi;
  kanvas.height = sisi;
  const ctx = kanvas.getContext('2d');
  ctx.fillStyle = terang;
  ctx.fillRect(0, 0, sisi, sisi);
  ctx.fillStyle = gelap;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + tepi) * sel, (r + tepi) * sel, sel, sel);
    }
  }
  if (logo) {
    // Logo di tengah dengan bantalan putih; aman karena level dipaksa 'H'
    // oleh panel saat logo aktif (30% modul boleh tertutup).
    const lebarLogo = Math.round(sisi * 0.22);
    const bantalan = Math.round(sisi * 0.03);
    const x = Math.round((sisi - lebarLogo) / 2);
    const y = Math.round((sisi - lebarLogo) / 2);
    ctx.fillStyle = terang;
    ctx.fillRect(x - bantalan, y - bantalan, lebarLogo + bantalan * 2, lebarLogo + bantalan * 2);
    ctx.drawImage(logo, x, y, lebarLogo, lebarLogo);
  }
  return kanvas;
}

// ---------- Warna & kontras ----------
function luminansiRelatif(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  const kanal = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((s) => {
    const c = s / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * kanal[0] + 0.7152 * kanal[1] + 0.0722 * kanal[2];
}

// Rasio kontras WCAG antara dua warna hex. null bila format salah.
export function rasioKontras(hexA, hexB) {
  const la = luminansiRelatif(hexA);
  const lb = luminansiRelatif(hexB);
  if (la === null || lb === null) return null;
  const [atas, bawah] = la >= lb ? [la, lb] : [lb, la];
  return (atas + 0.05) / (bawah + 0.05);
}

// Penilaian keterpindaian: modul harus jauh lebih gelap dari latar.
export function nilaiKontras(gelap, terang) {
  const lg = luminansiRelatif(gelap);
  const lt = luminansiRelatif(terang);
  if (lg === null || lt === null) return { ok: false, pesan: 'Format warna tidak dikenal.' };
  if (lg > lt) return { ok: false, terbalik: true, pesan: 'Warna modul lebih terang dari latar — QR terbalik seperti ini sering gagal dipindai kamera lama. Tukar kedua warna.' };
  const rasio = (lt + 0.05) / (lg + 0.05);
  if (rasio < 3) return { ok: false, rasio, pesan: `Kontras terlalu rendah (rasio ${rasio.toFixed(1)} : 1). Pemindai butuh perbedaan terang–gelap yang tegas; pilih modul lebih gelap atau latar lebih terang.` };
  return { ok: true, rasio };
}

// ---------- Pembangun muatan (payload) ----------

// WhatsApp: normalisasi nomor Indonesia ke format internasional 62…
export function normalisasiWA(mentah) {
  let d = String(mentah ?? '').replace(/\D/g, '');
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
}

export function muatanWhatsApp(nomor, pesan) {
  const n = normalisasiWA(nomor);
  const dasar = `https://wa.me/${n}`;
  const p = String(pesan ?? '').trim();
  return p ? `${dasar}?text=${encodeURIComponent(p)}` : dasar;
}

// WiFi: escape sesuai spesifikasi format WIFI: (ZXing) — karakter
// backslash, titik koma, koma, titik dua, dan kutip ganda diawali backslash.
export function escapeWiFi(s) {
  return String(s ?? '').replace(/([\\;,":])/g, '\\$1');
}

export function muatanWiFi({ ssid, sandi, enkripsi = 'WPA', tersembunyi = false }) {
  let p = `WIFI:T:${enkripsi};S:${escapeWiFi(ssid)};`;
  if (enkripsi !== 'nopass') p += `P:${escapeWiFi(sandi)};`;
  if (tersembunyi) p += 'H:true;';
  return p + ';';
}

// Tautan: tambahkan https:// bila pengguna mengetik domain polos.
export function muatanTautan(mentah) {
  let t = String(mentah ?? '').trim();
  if (!t) return '';
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) t = 'https://' + t;
  return t;
}

// Info pembayaran: TEKS biasa (bukan QRIS) yang tampil di layar pelanggan.
export function muatanInfoBayar({ jenis, nomor, atasNama, usaha = '', catatan = '' }) {
  const baris = ['INFO PEMBAYARAN'];
  if (usaha.trim()) baris.push(usaha.trim());
  baris.push(`${jenis}: ${nomor.trim()}`);
  baris.push(`Atas nama: ${atasNama.trim()}`);
  if (catatan.trim()) baris.push(catatan.trim());
  return baris.join('\n');
}

// vCard 3.0 untuk kartu nama digital usaha.
function escapeVCard(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

export function muatanVCard({ usaha, telepon, whatsapp, alamat, jamBuka, situs }) {
  const baris = ['BEGIN:VCARD', 'VERSION:3.0'];
  baris.push(`FN:${escapeVCard(usaha)}`);
  baris.push(`ORG:${escapeVCard(usaha)}`);
  if (telepon?.trim()) baris.push(`TEL;TYPE=WORK,VOICE:${telepon.trim()}`);
  if (whatsapp?.trim()) baris.push(`TEL;TYPE=CELL,MSG:${normalisasiWA(whatsapp)}`);
  if (alamat?.trim()) baris.push(`ADR;TYPE=WORK:;;${escapeVCard(alamat)};;;;`);
  if (situs?.trim()) baris.push(`URL:${muatanTautan(situs)}`);
  if (jamBuka?.trim()) baris.push(`NOTE:${escapeVCard('Jam buka: ' + jamBuka)}`);
  baris.push('END:VCARD');
  return baris.join('\r\n');
}
