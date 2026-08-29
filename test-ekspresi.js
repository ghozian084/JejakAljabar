const { chromium } = require('playwright');

/* Jalur berkas dihitung dari letak berkas uji ini, bukan ditulis keras.
   Sebelumnya jalurnya dipaku ke satu direktori, sehingga uji langsung patah
   begitu proyek dipindah ke komputer lain. */
const BASE = "file://" + __dirname + "/";

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 880, height: 1300 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(BASE + 'ar-ekspresi.html');
  await page.waitForTimeout(300);

  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));

  // ---- pengenal kartu pada 150 susunan acak ----
  const det = await page.evaluate(() => {
    let okSq = 0, okCi = 0, exact = 0, n = 0;
    for (let k = 0; k < 150; k++) {
      const t = window.__ae.simulate();
      const d = window.__ae.detectCards();
      const sq = d.filter(o => o.kind === 'sq').length, ci = d.filter(o => o.kind === 'ci').length;
      n++; if (sq === t.sq) okSq++; if (ci === t.ci) okCi++; if (sq === t.sq && ci === t.ci) exact++;
    }
    return { n, okSq, okCi, exact };
  });
  rec('hitungan kotak & satuan tepat pada ≥90% susunan', det.exact / det.n >= 0.90,
      det.exact + '/' + det.n + ' (' + Math.round(100 * det.exact / det.n) + '%)');
  rec('kotak tidak pernah tertukar jadi satuan secara sistematis', det.okSq / det.n >= 0.93,
      det.okSq + '/' + det.n);

  // ---- rotasi tidak boleh mengubah klasifikasi ----
  const rot = await page.evaluate(() => {
    const R = { sq: [], ci: [] };
    for (let k = 0; k < 40; k++) {
      window.__ae.simulate(4, 0); window.__ae.detectCards().forEach(o => R.sq.push(o.ratio));
      window.__ae.simulate(0, 6); window.__ae.detectCards().forEach(o => R.ci.push(o.ratio));
    }
    const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length * p)]; };
    return { sqLo: q(R.sq, 0.02), ciHi: q(R.ci, 0.98), nsq: R.sq.length, nci: R.ci.length };
  });
  rec('sebaran persegi & lingkaran tidak bertumpang tindih (persegi diputar acak)',
      rot.sqLo > rot.ciHi,
      'lingkaran maks ' + rot.ciHi.toFixed(3) + ' < persegi min ' + rot.sqLo.toFixed(3));

  // ---- lapisan misi bengkel ----
  rec('delapan misi terbentuk', (await page.$$eval('.misidot', n => n.length)) === 8);
  rec('misi 1 memaksa arah benda \u2192 simbol',
      (await page.evaluate(() => window.__ae.ST.mode)) === 'baca');
  rec('pemilih arah disembunyikan saat misi aktif', !(await page.isVisible('#modeRow')));

  const setKartu = async (sq, ci) => {
    await page.evaluate(() => { window.__ae.ST.sq = 0; window.__ae.ST.ci = 0; });
    for (let i = 0; i < sq; i++) await page.click('[data-adj="sq:1"]');
    for (let i = 0; i < ci; i++) await page.click('[data-adj="ci:1"]');
  };
  await setKartu(2, 3);
  rec('tombol manual memberi lencana "Tangan Sendiri"',
      await page.evaluate(() => !!window.__mi.MI.badges.tangan));

  await page.evaluate(() => { window.__mi.MI.i = 3; window.__mi.terapkanMisi(); });   // butuh >=3 kotak
  await setKartu(1, 2);
  await page.fill('#jwb', 'n+2'); await page.click('#btnCek'); await page.waitForTimeout(150);
  rec('jawaban benar untuk susunan yang salah TIDAK meluluskan misi',
      (await page.getAttribute('#fb-jawab', 'class')).includes('hint') &&
      (await page.evaluate(() => !window.__mi.MI.selesai[3])),
      (await page.textContent('#fb-jawab')).slice(0, 44));
  await setKartu(3, 1);
  await page.fill('#jwb', '3n+1'); await page.click('#btnCek'); await page.waitForTimeout(250);
  rec('misi lulus setelah syarat susunan terpenuhi',
      await page.evaluate(() => !!window.__mi.MI.selesai[3]));
  await page.waitForTimeout(1600);
  rec('misi berikutnya otomatis terbuka', await page.evaluate(() => window.__mi.MI.i === 4));

  // JANGAN hapus MI.selesai di sini — misi 4 (arah baca) yang barusan lulus
  // adalah separuh syarat lencana "Bolak-Balik".
  await page.evaluate(() => { window.__mi.MI.i = 2; window.__mi.terapkanMisi(); });
  rec('misi n + 4 memaksa arah simbol \u2192 benda',
      (await page.evaluate(() => window.__ae.ST.mode)) === 'susun' &&
      (await page.evaluate(() => JSON.stringify(window.__ae.ST.target))) === '{"a":1,"b":4}');
  await setKartu(4, 1);
  await page.click('#btnCekSusun'); await page.waitForTimeout(120);
  rec('susunan keliru ditolak dan dicatat',
      (await page.getAttribute('#fb-jawab', 'class')).includes('bad') &&
      (await page.evaluate(() => window.__mi.MI.keliru)) > 0);
  const xpSblm = await page.evaluate(() => window.__mi.MI.xp);
  await setKartu(1, 4);
  await page.click('#btnCekSusun'); await page.waitForTimeout(250);
  rec('lencana "Angka Tak Terlihat" untuk koefisien 1',
      await page.evaluate(() => !!window.__mi.MI.badges.satu));
  rec('memperbaiki dibayar lebih mahal daripada tepat sejak awal',
      (await page.evaluate(() => window.__mi.MI.xp)) - xpSblm >=
      (await page.evaluate(() => window.__mi.XP_MISI + window.__mi.XP_PULIH)),
      '+' + ((await page.evaluate(() => window.__mi.MI.xp)) - xpSblm) + ' jejak');
  rec('lencana "Bangkit" diberikan setelah pemulihan',
      await page.evaluate(() => !!window.__mi.MI.badges.bangkit));

  await page.waitForTimeout(1600);
  await page.evaluate(() => { window.__mi.MI.i = 7; window.__mi.terapkanMisi(); });
  rec('BOS mulai di arah susun', (await page.evaluate(() => window.__ae.ST.mode)) === 'susun');
  await setKartu(3, 5);
  await page.click('#btnCekSusun'); await page.waitForTimeout(250);
  rec('BOS tahap 1 belum meluluskan misi',
      await page.evaluate(() => !window.__mi.MI.selesai[7] && window.__mi.MI.bosTahap === 1));
  rec('BOS beralih ke arah tulis',
      (await page.evaluate(() => window.__ae.ST.mode)) === 'baca' && await page.isVisible('#jwb'));
  await page.fill('#jwb', '3n+5'); await page.click('#btnCek'); await page.waitForTimeout(250);
  rec('BOS lulus setelah kedua arah dituntaskan',
      await page.evaluate(() => !!window.__mi.MI.selesai[7]));
  rec('lencana "Bolak-Balik" diberikan',
      await page.evaluate(() => !!window.__mi.MI.badges.bolakbalik));

  const xpS = await page.evaluate(() => window.__mi.MI.xp);
  await page.reload(); await page.waitForTimeout(400);
  rec('kemajuan bengkel bertahan setelah dimuat ulang',
      (await page.evaluate(() => window.__mi.MI.xp)) === xpS, xpS + ' jejak');
  rec('spanduk pemulihan tampil', await page.isVisible('#restoreBar'));

  // ---- mode bebas: uji alur lama tanpa misi ----
  await page.click('#btnBebas'); await page.waitForTimeout(250);
  rec('mode bebas membuka pemilih arah', await page.isVisible('#modeRow'));

  // ---- alur mode BACA ----
  await page.click('#btnSim'); await page.waitForTimeout(250);
  await page.click('#btnPindai'); await page.waitForTimeout(300);
  rec('pindai memberi hitungan', (await page.getAttribute('#fb-pindai', 'class')).includes('ok'),
      (await page.textContent('#fb-pindai')).slice(0, 42));
  rec('mode baca MENYEMBUNYIKAN ekspresi sebelum siswa mencoba',
      (await page.textContent('#eq')).trim() === '?', (await page.textContent('#eq')).trim());

  // set jumlah kartu secara pasti lewat tombol manual
  await page.evaluate(() => { window.__ae.ST.sq = 0; window.__ae.ST.ci = 0; });
  for (let i = 0; i < 3; i++) await page.click('[data-adj="sq:1"]');
  for (let i = 0; i < 5; i++) await page.click('[data-adj="ci:1"]');
  rec('tombol manual membetulkan hitungan kamera',
      (await page.textContent('#nSq')) === '3' && (await page.textContent('#nCi')) === '5');

  await page.fill('#jwb', '3n+5');
  await page.click('#btnCek'); await page.waitForTimeout(150);
  rec('3n+5 diterima', (await page.getAttribute('#fb-jawab', 'class')).includes('ok'));
  rec('ekspresi baru ditampilkan SETELAH dijawab', (await page.textContent('#eq')).includes('3n'));

  await page.fill('#jwb', '5+3n');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('urutan terbalik 5+3n juga diterima', (await page.getAttribute('#fb-jawab', 'class')).includes('ok'));

  await page.fill('#jwb', '8n');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('konkatenasi 8n didiagnosis M2', (await page.textContent('#fb-jawab')).includes('M2'));

  await page.fill('#jwb', '8');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('jawaban 8 didiagnosis M1', (await page.textContent('#fb-jawab')).includes('M1'));

  // huruf pilihan siswa harus dipakai
  await page.fill('#huruf', 'k'); await page.waitForTimeout(100);
  await page.fill('#jwb', '3k+5');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('huruf pilihan siswa dipakai (3k+5)', (await page.getAttribute('#fb-jawab', 'class')).includes('ok'));
  /* Huruf lain DITERIMA — hurufnya bebas, strukturnya yang tidak.
     Sebelumnya jawaban seperti 2a+5 ditolak dan diberi umpan balik
     konkatenasi, padahal pemodelannya benar. Itu salah diagnosis. */
  await page.fill('#jwb', '3n+5');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('huruf lain tetap diterima (3n+5 saat kotak huruf berisi k)',
      (await page.getAttribute('#fb-jawab', 'class')).includes('ok'));
  rec('pergantian huruf disebut kepada siswa',
      (await page.textContent('#fb-jawab')).includes('hurufnya bebas'));
  rec('kotak huruf ikut ke pilihan siswa', (await page.inputValue('#huruf')) === 'n');
  /* Dua huruf berbeda tetap keliru: bagian yang sudah diketahui diberi huruf. */
  await page.fill('#jwb', '3n+5m');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('dua huruf berbeda tetap ditolak', (await page.getAttribute('#fb-jawab', 'class')).includes('bad'));
  rec('dua huruf didiagnosis sebagai memberi huruf pada yang sudah diketahui',
      (await page.textContent('#fb-jawab')).includes('kedua'));
  await page.fill('#huruf', 'n');

  // kasus 1 kotak: harus "n", bukan "1n" wajib
  await page.evaluate(() => { window.__ae.ST.sq = 1; window.__ae.ST.ci = 0; });
  await page.click('[data-adj="ci:1"]'); await page.click('[data-adj="ci:-1"]');
  await page.fill('#jwb', 'n');
  await page.click('#btnCek'); await page.waitForTimeout(120);
  rec('satu kotak boleh ditulis n saja', (await page.getAttribute('#fb-jawab', 'class')).includes('ok'));

  // ---- alur mode SUSUN ----
  await page.click('#mSusun'); await page.waitForTimeout(200);
  rec('mode susun memberi tugas', (await page.isVisible('#tugas')) &&
      (await page.textContent('#tugas')).includes('Tugasmu'));
  const tgt = await page.evaluate(() => window.__ae.ST.target);
  await page.evaluate(() => { window.__ae.ST.sq = 0; window.__ae.ST.ci = 0; });
  for (let i = 0; i < tgt.a; i++) await page.click('[data-adj="sq:1"]');
  for (let i = 0; i < tgt.b; i++) await page.click('[data-adj="ci:1"]');
  await page.click('#btnCekSusun'); await page.waitForTimeout(150);
  rec('susunan benar diterima', (await page.getAttribute('#fb-jawab', 'class')).includes('ok'),
      'target ' + tgt.a + 'n+' + tgt.b);

  // salah: semua dijadikan kotak
  await page.evaluate(() => { window.__ae.ST.sq = 0; window.__ae.ST.ci = 0; });
  for (let i = 0; i < tgt.a + tgt.b; i++) await page.click('[data-adj="sq:1"]');
  await page.click('#btnCekSusun'); await page.waitForTimeout(150);
  const f = await page.textContent('#fb-jawab');
  rec('menyusun a+b kotak didiagnosis M2', tgt.b === 0 || f.includes('M2'), f.slice(0, 60));

  await page.click('#btnTugasBaru'); await page.waitForTimeout(150);
  const tgt2 = await page.evaluate(() => window.__ae.ST.target);
  rec('tugas baru bisa diminta', !!tgt2 && (await page.textContent('#tugas')).includes('Tugasmu'));

  // ---- lembar cetak ----
  const kartu = await page.$$eval('#kartuGrid .cut', n => n.length);
  rec('lembar kartu berisi 24 kartu (8 kotak + 16 satuan)', kartu === 24, kartu + ' kartu');
  rec('lembar punya arena bertanda sudut', (await page.$$eval('#lembar .arena .mark', n => n.length)) === 4);
  const printHidden = await page.evaluate(() => {
    const el = document.querySelector('details.sheetwrap');
    el.open = true; return getComputedStyle(document.getElementById('lembar')).display;
  });
  rec('lembar cetak bisa dilihat dulu sebelum dicetak', printHidden !== 'none');

  // ---- kamera gagal dengan anggun ----
  await page.click('#btnCam'); await page.waitForTimeout(600);
  rec('kamera gagal dengan anggun', (await page.textContent('#hud')).includes('HTTPS'));

  await page.evaluate(() => window.__ae.setMode('baca'));
  await page.click('#btnSim'); await page.waitForTimeout(200);
  await page.click('#btnPindai'); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shot-ekspresi.png', fullPage: true });
  await page.emulateMedia({ media: 'print' }); await page.waitForTimeout(200);
  await page.screenshot({ path: 'shot-lembar.png', fullPage: true });


  // ---- kode simpan lintas perangkat ----
  const ks = await page.evaluate(() => {
    const t = [];
    const { MI } = window.__mi;
    MI.xp = 96; MI.i = 6; MI.selesai = {0:1,1:1,2:1,3:1,4:1,5:1};
    MI.badges = {pembaca:1, penyusun:1, satu:1, bangkit:1, tangan:1}; MI.pernahAdj = true;
    const asli = window.__ks.buat();
    t.push(['kode berawalan SMP4', asli.indexOf('SMP4-') === 0, asli]);
    t.push(['cukup pendek untuk disalin tangan', asli.length <= 34, asli.length + ' karakter']);
    const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const inti = asli.replace(/-/g, '').slice(4);
    let tolak = 0, coba = 0;
    for (let i = 0; i < inti.length; i++) for (const c of AB) {
      if (c === inti[i]) continue; coba++;
      if (window.__ks.pakai('SMP4' + inti.slice(0, i) + c + inti.slice(i + 1)) !== 'ok') tolak++;
    }
    t.push(['checksum menolak >97% salah ketik satu karakter', tolak / coba > 0.97,
            Math.round(100 * tolak / coba) + '% dari ' + coba + ' variasi']);
    let tt = 0, tc = 0;
    for (let i = 0; i + 1 < inti.length; i++) {
      if (inti[i] === inti[i + 1]) continue; tt++;
      if (window.__ks.pakai('SMP4' + inti.slice(0, i) + inti[i + 1] + inti[i] + inti.slice(i + 2)) !== 'ok') tc++;
    }
    t.push(['checksum menolak semua transposisi', tc === tt, tc + '/' + tt]);
    t.push(['teks sembarang ditolak', window.__ks.pakai('halo apa kabar') !== 'ok']);
    t.push(['huruf kecil tetap terbaca', window.__ks.pakai(asli.toLowerCase()) === 'ok']);
    const snap = window.__snap();
    window.__kosongkan();
    const hasil = window.__ks.pakai(asli);
    t.push(['keadaan penuh pulih persis dari kode', hasil === 'ok' && window.__snap() === snap]);
    return t;
  });
  ks.forEach(([n, ok, x]) => rec('simpan: ' + n, ok, x));

  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
