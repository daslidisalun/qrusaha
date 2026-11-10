// qr-ui.js — pengendali panel generator: menghubungkan formulir halaman
// dengan PanelQR (pratinjau stiker, peringatan kontras, unduhan, stiker).
// Semua proses lokal di browser; tidak ada data yang dikirim ke mana pun.
import { qrKeSVG, gambarKeCanvas, nilaiKontras } from './qr.js';

export function pasangPanel(akar, { buatMuatan, namaBerkas = 'qr-usaha' }) {
  const q = (peran) => akar.querySelector(`[data-peran="${peran}"]`);
  const wadah = q('wadah-qr');
  const elMuatan = q('muatan');
  const elLabel = q('label-bawah');
  const elPeringatan = q('peringatan');
  const inGelap = q('warna-gelap');
  const inTerang = q('warna-terang');
  const inLevel = q('level');
  const inUkuran = q('ukuran');
  const inLogo = q('logo');
  const inLabel = q('label-teks');
  const btnPNG = q('unduh-png');
  const btnSVG = q('unduh-svg');
  const tautanStiker = q('tautan-stiker');
  const dasarStiker = tautanStiker ? tautanStiker.getAttribute('href') : '#';

  let logoImg = null;
  let muatan = '';

  const levelEfektif = () => (logoImg ? 'H' : inLevel.value);

  function unduhBlob(blob, nama) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 400);
  }

  function segarkan() {
    try {
      muatan = buatMuatan() || '';
    } catch {
      muatan = '';
    }
    const nama = typeof namaBerkas === 'function' ? namaBerkas() : namaBerkas;
    if (!muatan) {
      wadah.innerHTML =
        '<p style="border:2px dashed #c9b992;border-radius:12px;padding:34px 14px;color:#4a5a66;font-size:.95rem">Isi formulir di samping — QR Anda muncul di sini.</p>';
      elMuatan.textContent = '—';
      btnPNG.disabled = true;
      btnSVG.disabled = true;
      elPeringatan.classList.remove('tampil');
      return;
    }
    btnPNG.disabled = false;
    btnSVG.disabled = false;
    wadah.innerHTML = qrKeSVG(muatan, {
      level: levelEfektif(),
      gelap: inGelap.value,
      terang: inTerang.value,
    });
    elMuatan.textContent = muatan;
    elLabel.textContent = inLabel.value;
    const nilai = nilaiKontras(inGelap.value, inTerang.value);
    if (nilai.ok) {
      elPeringatan.classList.remove('tampil');
      elPeringatan.textContent = '';
    } else {
      elPeringatan.textContent = '⚠ ' + nilai.pesan;
      elPeringatan.classList.add('tampil');
    }
    if (tautanStiker) {
      tautanStiker.href =
        dasarStiker +
        '?isi=' +
        encodeURIComponent(muatan) +
        '&label=' +
        encodeURIComponent(inLabel.value || '');
    }
    wadah.dataset.namaBerkas = nama;
  }

  akar.addEventListener('input', segarkan);
  akar.addEventListener('change', segarkan);

  inLogo?.addEventListener('change', () => {
    const berkas = inLogo.files?.[0];
    if (!berkas) {
      logoImg = null;
      inLevel.disabled = false;
      segarkan();
      return;
    }
    const img = new Image();
    img.onload = () => {
      logoImg = img;
      inLevel.value = 'H';
      inLevel.disabled = true;
      segarkan();
    };
    img.src = URL.createObjectURL(berkas);
  });

  btnPNG?.addEventListener('click', () => {
    if (!muatan) return;
    const kanvas = gambarKeCanvas(muatan, {
      level: levelEfektif(),
      gelap: inGelap.value,
      terang: inTerang.value,
      ukuran: parseInt(inUkuran.value, 10) || 1024,
      logo: logoImg,
    });
    kanvas.toBlob((blob) => {
      if (blob) unduhBlob(blob, `${wadah.dataset.namaBerkas || 'qr-usaha'}.png`);
    }, 'image/png');
  });

  btnSVG?.addEventListener('click', () => {
    if (!muatan) return;
    const svg = qrKeSVG(muatan, {
      level: levelEfektif(),
      gelap: inGelap.value,
      terang: inTerang.value,
    });
    unduhBlob(new Blob([svg], { type: 'image/svg+xml' }), `${wadah.dataset.namaBerkas || 'qr-usaha'}.svg`);
  });

  segarkan();
}
