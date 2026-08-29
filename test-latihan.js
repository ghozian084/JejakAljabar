const { chromium } = require('playwright');

/* Jalur berkas dihitung dari letak berkas uji ini, bukan ditulis keras.
   Sebelumnya jalurnya dipaku ke satu direktori, sehingga uji langsung patah
   begitu proyek dipindah ke komputer lain. */
const BASE = "file://" + __dirname + "/";

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 800, height: 1200 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(BASE + 'latihan.html');
  await page.waitForTimeout(300);

  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));

  // ---------- pembangkit soal ----------
  const gen = await page.evaluate(() => {
    const { GEN, UNITS, equiv } = window.__lt;
    let n = 0; const bad = [];
    for (const u of UNITS) for (let lvl = 0; lvl < GEN[u.code].length; lvl++) for (let k = 0; k < 50; k++) {
      const it = GEN[u.code][lvl](); n++;
      let ok = it.type === 'pilih' ? (it.ans >= 0 && it.ans < it.opts.length)
             : it.type === 'num' ? (typeof it.ans === 'number' && isFinite(it.ans))
             : equiv(it.ans, it.ans, it.vars);
      if (!ok || !it.q || !it.why) bad.push(u.code + '/L' + (lvl + 1));
    }
    return { n, nbad: bad.length, sample: bad.slice(0, 4).join(',') };
  });
  rec('semua kerangka soal sehat (' + gen.n + ' pembangkitan)', gen.nbad === 0, gen.sample);

  // ---------- struktur jalur ----------
  rec('enam unit terbentuk', (await page.$$eval('.unit', n => n.length)) === 6);
  rec('24 level (6 unit × 4)', (await page.$$eval('.lvlnode', n => n.length)) === 24);
  rec('hanya level pertama unit 1 yang terbuka di awal',
      (await page.getAttribute('.lvlnode[data-u="0"][data-i="0"]', 'data-s')) === 'open' &&
      (await page.getAttribute('.lvlnode[data-u="0"][data-i="1"]', 'data-s')) === 'lock' &&
      (await page.getAttribute('.lvlnode[data-u="1"][data-i="0"]', 'data-s')) === 'lock');
  rec('unit terkunci ditandai secara visual',
      (await page.$$eval('.unitbar.locked', n => n.length)) === 5);

  // helper: jawab soal saat ini
  const jawab = async (benar) => {
    const t = await page.evaluate(() => window.__lt.L.cur.type);
    if (t === 'pilih') {
      const a = await page.evaluate(b => b ? window.__lt.L.cur.ans
        : (window.__lt.L.cur.ans + 1) % window.__lt.L.cur.opts.length, benar);
      await page.click('[data-opt="' + a + '"]');
    } else {
      const a = benar ? await page.evaluate(() => String(window.__lt.L.cur.ans)) : '999999';
      await page.fill('#jwb', a);
    }
    await page.click('#btnCek'); await page.waitForTimeout(60);
  };

  // ---------- mainkan level 1 unit 1, sempurna ----------
  await page.click('.lvlnode[data-u="0"][data-i="0"]'); await page.waitForTimeout(200);
  rec('layar bermain terbuka', !(await page.getAttribute('#scPlay', 'class')).includes('hide'));
  rec('nyawa awal 5 pada level 1', (await page.$$eval('#hearts svg', n => n.length)) === 5);
  rec('nyawa semua penuh', (await page.$$eval('#hearts svg.off', n => n.length)) === 0);
  for (let i = 0; i < 5; i++) { await jawab(true); await page.click('#btnLanjut'); await page.waitForTimeout(60); }
  rec('lulus tanpa keliru', (await page.textContent('#endBig')).includes('Lulus'));
  const xp1 = await page.evaluate(() => window.__lt.P.xp);
  rec('jejak diberikan untuk kelulusan pertama', xp1 === 10, xp1 + ' jejak');

  await page.click('#btnKeMap'); await page.waitForTimeout(200);
  rec('level 1 jadi selesai, level 2 terbuka',
      (await page.getAttribute('.lvlnode[data-u="0"][data-i="0"]', 'data-s')) === 'done' &&
      (await page.getAttribute('.lvlnode[data-u="0"][data-i="1"]', 'data-s')) === 'open');
  rec('mahkota bertambah', (await page.textContent('#stCrown')) === '1/24');
  rec('unit 2 masih terkunci sebelum BOS unit 1',
      (await page.getAttribute('.lvlnode[data-u="1"][data-i="0"]', 'data-s')) === 'lock');

  // ---------- mekanik nyawa: salah lalu benar mengembalikan nyawa ----------
  await page.click('.lvlnode[data-u="0"][data-i="1"]'); await page.waitForTimeout(200);
  await jawab(false);
  rec('jawaban keliru mengurangi satu nyawa', (await page.$$eval('#hearts svg.off', n => n.length)) === 1);
  rec('umpan balik keliru menyertakan kode diagnostik + janji kesempatan kedua',
      /M[1-6] —/.test(await page.textContent('#fb')) &&
      (await page.textContent('#fb')).includes('nyawamu kembali'));
  await page.click('#btnLanjut'); await page.waitForTimeout(80);
  rec('soal kesempatan kedua ditandai', (await page.textContent('#qCode')).includes('kesempatan kedua'));
  const keSebelum = await page.evaluate(() => window.__lt.L.ke);
  await jawab(true);
  rec('NYAWA KEMBALI setelah kekeliruan diperbaiki',
      (await page.$$eval('#hearts svg.off', n => n.length)) === 0,
      (await page.textContent('#fb')).slice(0, 34));
  rec('soal kesempatan kedua tetap dihitung sebagai kemajuan',
      (await page.evaluate(() => window.__lt.L.ke)) === keSebelum + 1);
  rec('pemulihan tercatat', (await page.evaluate(() => window.__lt.L.pulih)) === 1);
  await page.click('#btnLanjut'); await page.waitForTimeout(60);
  for (let i = 0; i < 4; i++) { await jawab(true); await page.click('#btnLanjut'); await page.waitForTimeout(60); }
  const xp2 = await page.evaluate(() => window.__lt.P.xp);
  rec('memulihkan nyawa memberi jejak tambahan', xp2 === 10 + 12 + 4, xp2 + ' jejak (10+12+4)');
  rec('hasil menyebut pemulihan sebagai hal yang dibayar',
      (await page.textContent('#endNote')).includes('memperbaiki dibayar'));

  // ---------- nyawa habis → level gagal ----------
  await page.click('#btnKeMap'); await page.waitForTimeout(150);
  await page.click('.lvlnode[data-u="0"][data-i="2"]'); await page.waitForTimeout(200);
  rec('level 3 memberi nyawa lebih sedikit', (await page.$$eval('#hearts svg', n => n.length)) === 4);
  for (let i = 0; i < 4; i++) { await jawab(false); await page.click('#btnLanjut'); await page.waitForTimeout(70); }
  rec('nyawa habis menghentikan level', (await page.textContent('#endBig')).includes('Nyawa habis'));
  rec('level gagal tidak memberi mahkota',
      (await page.evaluate(() => !window.__lt.P.cleared[window.__lt.key('M1', 2)])));
  rec('hasil gagal mengarahkan balik ke Modul 1',
      (await page.textContent('#endNote')).includes('Modul 1'));

  // ---------- buka semua untuk guru ----------
  await page.click('#btnKeMap'); await page.waitForTimeout(150);
  await page.click('#bukaSemua'); await page.waitForTimeout(200);
  rec('mode guru membuka seluruh level',
      (await page.getAttribute('.lvlnode[data-u="5"][data-i="3"]', 'data-s')) === 'open');

  // ---------- selesaikan semua BOS → layar tamat ----------
  await page.evaluate(() => {
    const { P, UNITS, key } = window.__lt;
    UNITS.forEach(u => { for (let i = 0; i < 4; i++) P.cleared[key(u.code, i)] = true;
      P.mainUnit[u.code] = true; });
    P.salahUnit.M3 = 2; P.pulihUnit.M3 = 2;      // M3: pulih setelah keliru
  });
  await page.evaluate(() => window.__lt.cekTamat()); await page.waitForTimeout(250);
  rec('layar tamat muncul setelah keenam BOS lulus',
      !(await page.getAttribute('#scDone', 'class')).includes('hide'));
  const kode = await page.textContent('#kodeBox');
  rec('kode latihan berawalan JLT, bukan JJK', /^JLT-[0-9A-Z]{4}-[0-9A-Z]{3}$/.test(kode), kode);
  const tamat = await page.textContent('#tamatHasil');
  rec('ringkasan menampilkan status per unit',
      tamat.includes('sudah kuat') && tamat.includes('pulih setelah keliru'));
  const st = await page.evaluate(() => window.__lt.UNITS.map(u => window.__lt.statusUnit(u.code)));
  // M1 punya riwayat keliru dari uji sebelumnya → pulih; M2 bersih → kuat
  rec('unit dengan riwayat keliru berstatus pulih, unit bersih berstatus kuat',
      st[0] === 2 && st[1] === 3 && st[2] === 2, JSON.stringify(st));
  const salahM1 = await page.evaluate(() => window.__lt.P.salahUnit.M1);
  rec('riwayat keliru per unit memang terhitung', salahM1 > 0, salahM1 + ' kali keliru di M1');

  await page.click('#btnKeMap2'); await page.waitForTimeout(250);
  rec('peta menyediakan jalan kembali ke ringkasan setelah tamat',
      await page.isVisible('#btnRingkas'));
  await page.click('#btnRingkas'); await page.waitForTimeout(200);
  rec('tombol ringkasan membuka layar tamat lagi',
      !(await page.getAttribute('#scDone', 'class')).includes('hide'));
  await page.click('#btnKeMap2'); await page.waitForTimeout(200);
  await page.screenshot({ path: 'shot-jalur.png', fullPage: true });

  // ---------- simpan kemajuan ----------
  const crSblm = await page.textContent('#stCrown'), xpSblm = await page.textContent('#stXp');
  await page.reload(); await page.waitForTimeout(400);
  rec('mahkota bertahan setelah halaman dimuat ulang',
      (await page.textContent('#stCrown')) === crSblm, crSblm);
  rec('jejak bertahan', (await page.textContent('#stXp')) === xpSblm, xpSblm);
  rec('level yang lulus tetap terbuka kuncinya',
      (await page.getAttribute('.lvlnode[data-u="0"][data-i="0"]', 'data-s')) === 'done');
  rec('riwayat keliru per unit ikut pulih',
      (await page.evaluate(() => window.__lt.P.salahUnit.M1)) > 0);
  rec('spanduk pemulihan tampil', await page.isVisible('#restoreBar'));
  await page.click('#btnMulaiBaru'); await page.waitForTimeout(500);
  rec('"Mulai dari awal" menghapus simpanan',
      (await page.textContent('#stCrown')) === '0/24' &&
      (await page.getAttribute('.lvlnode[data-u="0"][data-i="1"]', 'data-s')) === 'lock');


  // ---------- kode simpan lintas perangkat ----------
  const ks = await page.evaluate(() => {
    const t = [];
    const { P, UNITS, key } = window.__lt;
    P.xp = 317; P.openAll = false;
    UNITS.forEach((u, i) => { for (let j = 0; j <= i % 4; j++) P.cleared[key(u.code, j)] = true;
      P.mainUnit[u.code] = true; P.salahUnit[u.code] = i * 2 + 1; P.pulihUnit[u.code] = i; });
    const asli = window.__ks.buat();
    t.push(['kode terbentuk dengan awalan yang benar', asli.indexOf('SMP3-') === 0, asli]);
    t.push(['kode cukup pendek untuk disalin tangan', asli.length <= 34, asli.length + ' karakter']);
    // salah ketik satu karakter harus ditolak
    const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const inti = asli.replace(/-/g, '').slice(4);
    let tolak = 0, coba = 0;
    for (let i = 0; i < inti.length; i++) for (const c of AB) {
      if (c === inti[i]) continue; coba++;
      const rusak = 'SMP3' + inti.slice(0, i) + c + inti.slice(i + 1);
      if (window.__ks.pakai(rusak) !== 'ok') tolak++;
    }
    t.push(['checksum menolak >97% salah ketik satu karakter', tolak / coba > 0.97,
            Math.round(100 * tolak / coba) + '% dari ' + coba + ' variasi']);
    // transposisi dua karakter bersebelahan
    let tt = 0, tc = 0;
    for (let i = 0; i + 1 < inti.length; i++) {
      if (inti[i] === inti[i + 1]) continue; tt++;
      const r = 'SMP3' + inti.slice(0, i) + inti[i + 1] + inti[i] + inti.slice(i + 2);
      if (window.__ks.pakai(r) !== 'ok') tc++;
    }
    t.push(['checksum menolak semua transposisi', tc === tt, tc + '/' + tt]);
    t.push(['kode dengan awalan salah ditolak', window.__ks.pakai('XXXX' + inti) !== 'ok']);
    t.push(['teks sembarang ditolak', window.__ks.pakai('halo apa kabar') !== 'ok']);
    t.push(['tanda hubung & huruf kecil tetap terbaca',
            window.__ks.pakai(asli.toLowerCase()) === 'ok']);
    // bongkar total, lalu pulihkan dari kode — harus identik
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
