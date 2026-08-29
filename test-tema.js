/* Uji sistem tema warna lintas kelima berkas. */
const { chromium } = require('playwright');

/* Jalur berkas dihitung dari letak berkas uji ini, bukan ditulis keras.
   Sebelumnya jalurnya dipaku ke satu direktori, sehingga uji langsung patah
   begitu proyek dipindah ke komputer lain. */
const BASE = "file://" + __dirname + "/";

const BERKAS = [
  ['index.html',        'Menu utama'],
  ['jejak-aljabar.html','Modul 1'],
  ['ar-ukur.html',      'Modul 2'],
  ['latihan.html',      'Modul 3'],
  ['ar-ekspresi.html',  'Modul 4']
];
const TEMA = ['kertas', 'laut', 'malam', 'kontras'];

/* Ambang WCAG AA untuk teks biasa. Nilai ini yang menentukan apakah sebuah
   tema layak dipakai siswa, bukan selera warna. */
const AA = 4.5;

function lum(c){
  const v = c.map(x => { x /= 255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); });
  return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2];
}
function rasio(a, b){
  const L1 = lum(a), L2 = lum(b);
  return (Math.max(L1,L2) + 0.05) / (Math.min(L1,L2) + 0.05);
}
function rgb(s){
  const m = String(s).match(/(\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

(async () => {
  const browser = await chromium.launch();
  const R = [];
  const rec = (n, ok, x) => R.push((ok ? 'PASS  ' : '**FAIL**  ') + n + (x ? '  → ' + x : ''));
  const errs = [];

  // ---------- tombol tema ada di kelima berkas ----------
  for (const [f, nama] of BERKAS) {
    const p = await browser.newPage();
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    await p.goto(BASE + f);
    await p.waitForTimeout(350);
    const ada = await p.$('#btnTema');
    rec(nama + ': tombol tema ada', !!ada);
    const jml = await p.$$eval('#temaMenu button[data-tema]', n => n.length).catch(() => 0);
    rec(nama + ': empat tema ditawarkan', jml === 4, jml + ' pilihan');
    await p.close();
  }

  // ---------- kontras teks pada keempat tema ----------
  const p = await browser.newPage();
  p.on('pageerror', e => errs.push('kontras: ' + e.message));
  await p.goto(BASE + 'jejak-aljabar.html');
  await p.waitForTimeout(300);
  for (const t of TEMA) {
    const u = await p.evaluate((t) => {
      window.__tema.pakai(t);
      const cs = getComputedStyle(document.body);
      const g = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      const el = document.createElement('div');
      document.body.appendChild(el);
      const ambil = (fg, bg) => { el.style.color = fg; el.style.background = bg;
        const c = getComputedStyle(el); return [c.color, c.backgroundColor]; };
      const out = {
        body:  [cs.color, cs.backgroundColor],
        soft:  ambil(g('--ink-soft'), g('--card')),
        teal:  ambil(g('--teal'),     g('--card')),
        amber: ambil(g('--amber'),    g('--card')),
        clay:  ambil(g('--clay'),     g('--card')),
        plum:  ambil(g('--plum'),     g('--card')),
        tealB: ambil(g('--teal-ink'), g('--teal-bg')),
        amberB:ambil(g('--amber-ink'),g('--amber-bg')),
        clayB: ambil(g('--clay-ink'), g('--clay-bg'))
      };
      el.remove();
      return out;
    }, t);
    for (const k of Object.keys(u)) {
      const a = rgb(u[k][0]), b = rgb(u[k][1]);
      const r = a && b ? rasio(a, b) : 0;
      rec('tema ' + t + ': kontras ' + k + ' ≥ ' + AA, r >= AA, r.toFixed(2) + ':1');
    }
  }

  // ---------- tema tersimpan dan berlaku lintas berkas ----------
  await p.evaluate(() => window.__tema.pakai('malam'));
  await p.evaluate(() => localStorage.setItem('jejak.tema.v1', 'malam'));
  await p.goto(BASE + 'latihan.html');
  await p.waitForTimeout(350);
  rec('tema terbawa ke modul lain',
      (await p.getAttribute('html', 'data-tema')) === 'malam');
  await p.goto(BASE + 'ar-ukur.html');
  await p.waitForTimeout(350);
  rec('tema terbawa ke Modul 2',
      (await p.getAttribute('html', 'data-tema')) === 'malam');

  // ---------- memilih lewat tombol ----------
  await p.click('#btnTema'); await p.waitForTimeout(150);
  rec('menu tema terbuka', await p.isVisible('#temaMenu'));
  await p.click('#temaMenu button[data-tema="kontras"]'); await p.waitForTimeout(200);
  rec('memilih tema mengubah halaman',
      (await p.getAttribute('html', 'data-tema')) === 'kontras');
  rec('menu tertutup setelah memilih', !(await p.isVisible('#temaMenu')));
  rec('pilihan tersimpan',
      (await p.evaluate(() => localStorage.getItem('jejak.tema.v1'))) === 'kontras');
  await p.click('#btnTema'); await p.waitForTimeout(120);
  rec('tema terpilih ditandai dengan TEKS, bukan warna saja',
      (await p.textContent('#temaMenu button[data-tema="kontras"] .tick')).trim() === 'dipakai');
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);
  rec('Escape menutup menu', !(await p.isVisible('#temaMenu')));

  // ---------- nilai tak dikenal & penyimpanan rusak ----------
  await p.evaluate(() => localStorage.setItem('jejak.tema.v1', 'warna-ngawur'));
  await p.reload(); await p.waitForTimeout(300);
  rec('nilai tema tak dikenal jatuh ke bawaan',
      (await p.evaluate(() => window.__tema.baca())) === 'kertas');

  // ---------- tema TIDAK menyentuh kemajuan ----------
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => {
    localStorage.setItem('jejak.modul1.v1', JSON.stringify({v:1, xp:99, done:{a:1}}));
  });
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btnTema'); await p.waitForTimeout(120);
  await p.click('#temaMenu button[data-tema="malam"]'); await p.waitForTimeout(250);
  rec('mengganti tema tidak menghapus kemajuan',
      (await p.evaluate(() => JSON.parse(localStorage.getItem('jejak.modul1.v1')).xp)) === 99);

  // ---------- LEMBAR KARTU CETAK HARUS KEBAL TEMA ----------
  /* Ini uji terpenting di berkas ini. Kartu harus tetap hitam pekat di atas
     kertas putih; pengenal kartu Modul 4 bergantung pada kontras itu. Kalau
     lembar ikut menggelap, hasil cetak rusak dan deteksinya gagal. */
  await p.goto(BASE + 'ar-ekspresi.html'); await p.waitForTimeout(400);
  for (const t of TEMA) {
    const w = await p.evaluate((t) => {
      window.__tema.pakai(t);
      const l = document.getElementById('lembar');
      const sq = l.querySelector('.sq'), ar = l.querySelector('.arena');
      return {
        lembar: getComputedStyle(l).backgroundColor,
        kartu:  sq ? getComputedStyle(sq).backgroundColor : null,
        arena:  ar ? getComputedStyle(ar).borderTopColor : null
      };
    }, t);
    rec('tema ' + t + ': latar lembar cetak tetap putih',
        rgb(w.lembar) && rgb(w.lembar).every(v => v === 255), w.lembar);
    rec('tema ' + t + ': kartu tetap hitam pekat',
        rgb(w.kartu) && rgb(w.kartu).every(v => v === 0), w.kartu);
    rec('tema ' + t + ': bingkai arena tetap hitam',
        rgb(w.arena) && rgb(w.arena).every(v => v === 0), w.arena);
  }

  // ---------- mencetak selalu memakai tema terang ----------
  await p.evaluate(() => window.__tema.pakai('malam'));
  await p.emulateMedia({ media: 'print' });
  await p.waitForTimeout(150);
  const cetak = await p.evaluate(() => {
    const g = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return { paper: g('--paper'), ink: g('--ink'), card: g('--card') };
  });
  rec('mencetak memakai kertas terang walau tema Malam',
      cetak.paper.toLowerCase() === '#faf7f2', cetak.paper);
  rec('mencetak memakai tinta gelap walau tema Malam',
      cetak.ink.toLowerCase() === '#1f2a2e', cetak.ink);
  await p.emulateMedia({ media: 'screen' });

  // ---------- penyimpanan diblokir ----------
  const q = await browser.newPage();
  const e2 = [];
  q.on('pageerror', e => e2.push(e.message));
  await q.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get(){ throw new Error('diblokir'); } });
  });
  await q.goto(BASE + 'index.html'); await q.waitForTimeout(400);
  rec('penyimpanan diblokir: tombol tema tetap ada', !!(await q.$('#btnTema')));
  await q.click('#btnTema'); await q.waitForTimeout(120);
  await q.click('#temaMenu button[data-tema="malam"]'); await q.waitForTimeout(200);
  rec('penyimpanan diblokir: tema tetap bisa diganti untuk sesi ini',
      (await q.getAttribute('html', 'data-tema')) === 'malam');
  rec('penyimpanan diblokir: tanpa galat', e2.length === 0, e2.join('|').slice(0, 70));
  await q.close();

  await p.close();
  await browser.close();
  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? errs.join(' | ') : 'tidak ada'));
  const gagal = R.filter(x => x.startsWith('**FAIL**')).length;
  console.log('GAGAL: ' + gagal + ' / ' + R.length);
  process.exitCode = gagal ? 1 : 0;
})();
