const { chromium } = require('playwright');

/* Jalur berkas dihitung dari letak berkas uji ini, bukan ditulis keras.
   Sebelumnya jalurnya dipaku ke satu direktori, sehingga uji langsung patah
   begitu proyek dipindah ke komputer lain. */
const BASE = "file://" + __dirname + "/";

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 820, height: 1200 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(BASE + 'ar-ukur.html');
  await page.waitForTimeout(300);

  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));

  // ---- 30 adegan simulasi acak: seberapa sering detektor menemukan papan? ----
  const trial = await page.evaluate(() => {
    const out = [];
    for (let k = 0; k < 30; k++) {
      window.__ar.simulate();
      const q = window.__ar.detectQuad();
      if (!q) { out.push({ hit: false }); continue; }
      const truth = window.__ar.ST.truth;
      // jarak rata-rata sudut terdeteksi ke sudut sebenarnya terdekat
      let tot = 0;
      for (const t of truth) {
        let bd = 1e9;
        for (const c of q) bd = Math.min(bd, Math.hypot(c.x - t.x, c.y - t.y));
        tot += bd;
      }
      const sp = window.__ar.sidePairs(q);
      // rasio sebenarnya dari sisi papan yang digambar
      const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const ts = [d(truth[0], truth[1]), d(truth[1], truth[2]), d(truth[2], truth[3]), d(truth[3], truth[0])];
      const tR = Math.max((ts[0] + ts[2]) / 2, (ts[1] + ts[3]) / 2) / Math.min((ts[0] + ts[2]) / 2, (ts[1] + ts[3]) / 2);
      const dR = Math.max(sp.pair1, sp.pair2) / Math.min(sp.pair1, sp.pair2);
      out.push({ hit: true, err: tot / 4, ratioTruth: tR, ratioDet: dR, ratioErr: Math.abs(dR - tR) / tR });
    }
    return out;
  });
  const hits = trial.filter(t => t.hit);
  const good = hits.filter(t => t.err < 14);
  const ratioOK = good.filter(t => t.ratioErr < 0.12);
  rec('deteksi menemukan bangun pada ≥26/30 adegan', hits.length >= 26, hits.length + '/30');
  // Tolok ukur 150 adegan memberi 77% kunci-tepat; pada sampel 30 adegan sebarannya
  // wajar bergerak. Ambang 20/30 adalah penjaga regresi, bukan klaim akurasi.
  rec('sudut meleset < 14 px pada ≥20/30 (tolok ukur 77%)', good.length >= 20, good.length + '/30');
  rec('perbandingan sisi meleset < 12% pada ≥19/30', ratioOK.length >= 19,
      ratioOK.length + '/30, rata-rata galat ' +
      (good.reduce((s, t) => s + t.ratioErr, 0) / Math.max(1, good.length) * 100).toFixed(1) + '%');

  // ---- alur ujung-ke-ujung lewat UI ----
  await page.click('#btnSim'); await page.waitForTimeout(250);
  await page.click('#btnDetect'); await page.waitForTimeout(250);
  rec('UI: tombol kunci aktif setelah deteksi', !(await page.getAttribute('#btnLock', 'disabled') !== null));
  await page.click('#btnLock'); await page.waitForTimeout(250);
  rec('UI: model aljabar dibuat otomatis', (await page.textContent('#eqK')).includes('2p + 2l'),
      (await page.textContent('#eqK')).trim());
  rec('UI: langkah ukur terbuka', !(await page.getAttribute('#cMeasure', 'class')).includes('dim'));

  const ratio = await page.evaluate(() => window.__ar.ST.ratio);
  // ukuran yang konsisten dengan perbandingan kamera
  const P = 150, L = +(150 / ratio).toFixed(1);
  await page.fill('#inP', String(P));
  await page.fill('#inL', String(+(L / 2.4).toFixed(1)));   // sengaja meleset dulu
  await page.click('#btnCheck'); await page.waitForTimeout(150);
  await page.fill('#inL', String(L));
  await page.click('#btnCheck'); await page.waitForTimeout(200);
  rec('ukuran konsisten diterima', (await page.getAttribute('#fb-ukur', 'class')).includes('ok'),
      'p=' + P + ' l=' + L + ' (rasio kamera ' + ratio.toFixed(2) + ')');

  // ukuran yang jelas tidak konsisten harus DITOLAK
  await page.fill('#inL', String(+(150 / ratio / 2.2).toFixed(1)));
  await page.click('#btnCheck'); await page.waitForTimeout(200);
  rec('ukuran tidak konsisten ditolak', (await page.getAttribute('#fb-ukur', 'class')).includes('bad'));

  // kembalikan, lalu substitusi
  await page.fill('#inL', String(L));
  await page.click('#btnCheck'); await page.waitForTimeout(200);
  await page.fill('#inK', String(2 * P + 2 * L));
  await page.click('#btnK'); await page.waitForTimeout(200);
  rec('substitusi keliling benar diterima', (await page.getAttribute('#fb-k', 'class')).includes('ok'));
  await page.fill('#inK', String(P * L));
  await page.click('#btnK'); await page.waitForTimeout(200);
  rec('luas dikenali sebagai bukan keliling', (await page.textContent('#fb-k')).includes('luas'));
  await page.fill('#inK', String(P + L));
  await page.click('#btnK'); await page.waitForTimeout(200);
  rec('dua sisi saja didiagnosis M2', (await page.textContent('#fb-k')).includes('M2'));

  // ---------- lapisan ekspedisi ----------
  const g = await page.evaluate(() => {
    const { G, BADGES, XP_STEP, XP_PULIH, levelName } = window.__g;
    return { xp: G.xp, badges: Object.keys(G.badges), nb: BADGES.length, lv: levelName(G.xp),
             ukur: XP_STEP.cMeasure, pulih: XP_STEP.cMeasure + XP_PULIH };
  });
  rec('ekspedisi mengumpulkan jejak', g.xp > 0, g.xp + ' jejak · ' + g.lv);
  rec('memperbaiki hasil ukur dibayar lebih mahal daripada tepat sejak awal',
      g.pulih > g.ukur, g.ukur + ' vs ' + g.pulih + ' jejak');
  rec('lencana "teliti" diberikan karena mengukur ulang', g.badges.includes('teliti'));
  rec('lencana "tuntas" diberikan setelah empat tahap', g.badges.includes('tuntas'), g.badges.join(','));
  rec('kartu bekal menampilkan seluruh lencana',
      (await page.$$eval('#badgeGrid .badge', n => n.length)) === g.nb, g.nb + ' lencana');
  rec('peta ekspedisi menandai tahap tuntas',
      (await page.getAttribute('[data-go="cSub"]', 'data-state')) === 'done',
      await page.getAttribute('[data-go="cSub"]', 'data-state'));
  rec('rel ekspedisi terisi penuh',
      parseFloat(await page.evaluate(() => document.getElementById('railfill').style.width)) >= 75);

  // kamera tidak tersedia di headless → harus gagal dengan anggun
  await page.click('#btnCam'); await page.waitForTimeout(600);
  rec('kamera gagal dengan anggun (tanpa crash)', (await page.textContent('#hud')).includes('HTTPS'),
      (await page.textContent('#hud')).slice(0, 50));

  await page.click('#btnSim'); await page.waitForTimeout(200);
  await page.click('#btnDetect'); await page.waitForTimeout(200);
  await page.click('#btnLock'); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shot-ar.png' });

  // ---------- simpan kemajuan ----------
  const xpSblm = await page.textContent('#xpVal');
  const bdSblm = await page.evaluate(() => Object.keys(window.__g.G.badges).sort().join(','));
  await page.reload(); await page.waitForTimeout(400);
  rec('jejak ekspedisi bertahan setelah dimuat ulang',
      (await page.textContent('#xpVal')) === xpSblm, xpSblm + ' jejak');
  rec('lencana ekspedisi bertahan',
      (await page.evaluate(() => Object.keys(window.__g.G.badges).sort().join(','))) === bdSblm);
  rec('tahap yang tuntas tetap tuntas',
      (await page.getAttribute('[data-go="cSub"]', 'data-state')) === 'done');
  rec('spanduk pemulihan tampil', await page.isVisible('#restoreBar'));
  await page.click('#btnMulaiBaru'); await page.waitForTimeout(500);
  rec('"Mulai dari awal" menghapus simpanan', (await page.textContent('#xpVal')) === '0');


  // ---------- kode simpan lintas perangkat ----------
  const ks = await page.evaluate(() => {
    const t = [];
    G.xp = 75; G.done = {cScan:1, cModel:1, cMeasure:1};
    G.badges = {pemindai:1, tegak:1, struktur:1, teliti:1, meteran:1};
    G.gagalUkur = 2; G.gagalKeliling = 1; G.pernahGeser = true;
    const asli = window.__ks.buat();
    t.push(['kode terbentuk dengan awalan yang benar', asli.indexOf('SMP2-') === 0, asli]);
    t.push(['kode cukup pendek untuk disalin tangan', asli.length <= 34, asli.length + ' karakter']);
    // salah ketik satu karakter harus ditolak
    const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const inti = asli.replace(/-/g, '').slice(4);
    let tolak = 0, coba = 0;
    for (let i = 0; i < inti.length; i++) for (const c of AB) {
      if (c === inti[i]) continue; coba++;
      const rusak = 'SMP2' + inti.slice(0, i) + c + inti.slice(i + 1);
      if (window.__ks.pakai(rusak) !== 'ok') tolak++;
    }
    t.push(['checksum menolak >97% salah ketik satu karakter', tolak / coba > 0.97,
            Math.round(100 * tolak / coba) + '% dari ' + coba + ' variasi']);
    // transposisi dua karakter bersebelahan
    let tt = 0, tc = 0;
    for (let i = 0; i + 1 < inti.length; i++) {
      if (inti[i] === inti[i + 1]) continue; tt++;
      const r = 'SMP2' + inti.slice(0, i) + inti[i + 1] + inti[i] + inti.slice(i + 2);
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
