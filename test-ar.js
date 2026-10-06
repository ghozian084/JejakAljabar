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

  // ---- Langkah 5: soal buatan siswa ----
  // Media memeriksa KUNCI JAWABAN terhadap model, tidak pernah menilai kalimatnya.
  {
    const ctxS = await browser.newContext({ viewport: { width: 820, height: 1200 } });
    const q = await ctxS.newPage();
    q.on('pageerror', e => errs.push('SOAL PAGEERROR: ' + e.message));
    await q.goto(BASE + 'ar-ukur.html'); await q.waitForTimeout(300);
    const redup = () => q.$eval('#cSoal', e => e.classList.contains('dim'));
    const fbS = async () => (await q.textContent('#fb-soal')).replace(/\s+/g, ' ');
    const kelasFb = () => q.getAttribute('#fb-soal', 'class');
    const xp = () => q.evaluate(() => window.__g.G.xp);
    const jj = () => q.evaluate(() => Object.assign({}, window.__ar.ST.jejak));
    const isiSoal = async (jenis, teks, isi, pilihan) => {
      if (jenis) await q.click('[data-soal="' + jenis + '"]');
      if (teks !== undefined) await q.fill('#soalTeks', teks);
      for (const [id, v] of Object.entries(isi || {})) await q.fill('#' + id, v);
      for (const [id, v] of Object.entries(pilihan || {})) await q.selectOption('#' + id, v);
      await q.click('#btnSoal');
    };
    rec('soal: Langkah 5 redup sebelum papan dipindai', await redup());
    await q.click('#btnSim'); await q.waitForTimeout(150); await q.click('#btnDetect'); await q.waitForTimeout(150);
    await q.click('#btnLock'); await q.waitForTimeout(150);
    const rS = await q.evaluate(() => window.__ar.ST.ratio), PS = +(50 * rS).toFixed(1);
    await q.fill('#inP', String(PS)); await q.fill('#inL', '50'); await q.click('#btnCheck');
    rec('soal: masih redup sebelum keliling benar', await redup());
    await q.fill('#inK', String(2 * PS + 100)); await q.click('#btnK');
    rec('soal: terbuka setelah keliling benar', !(await redup()));

    await q.click('[data-soal="mundur"]');
    rec('soal: jenis terpilih ditandai lambang dan kata, bukan warna saja',
        (await q.textContent('[data-soal="mundur"]')) === '✓ Mundur' &&
        (await q.getAttribute('[data-soal="mundur"]', 'aria-pressed')) === 'true' &&
        (await q.textContent('[data-soal="maju"]')) === 'Maju');
    const xp0 = await xp();
    await isiSoal(null, 'Berapa?', { soalA: '300', soalB: '50', soalJawab: '100' });
    rec('soal: kalimat terlalu pendek → petunjuk, tidak dinilai', (await kelasFb()).includes('hint') &&
        (await jj()).soal === '' && (await xp()) === xp0);
    const TEKS = 'Pak Budi punya lis 300 cm untuk papan selebar 50 cm. Berapa panjang papan paling besar?';
    await isiSoal(null, TEKS, { soalA: '300', soalB: '50', soalJawab: '' });
    rec('soal: angka kunci belum lengkap → petunjuk', (await kelasFb()).includes('hint') && (await fbS()).includes('Isi semua angka'));

    await isiSoal(null, TEKS, { soalA: '80', soalB: '50', soalJawab: '5' });
    rec('soal: soal mundur yang mustahil (dua sisi melebihi keliling) dijelaskan, bukan dinilai kuncinya',
        (await kelasFb()).includes('bad') && (await fbS()).includes('belum bisa dijawab'), (await fbS()).slice(0, 80));
    await isiSoal(null, TEKS, { soalA: '300', soalB: '50', soalJawab: '250' });
    const salahS = await fbS();
    rec('soal: kunci keliru → diajak memeriksa dengan substitusi balik', (await kelasFb()).includes('bad') &&
        salahS.includes('2 × 250 + 2 × 50 = 600') && salahS.includes('keliling 300'), salahS.slice(0, 120));
    rec('soal: umpan balik tidak membocorkan kunci yang benar', !/\b100\b/.test(salahS));
    rec('soal: kunci keliru tetap dicatat di jejak (untuk kartu)', (await jj()).soal === 'mundur' && (await jj()).soalOk === false);
    await isiSoal(null, TEKS, { soalJawab: '100' });
    rec('soal: kunci mundur yang benar diterima', (await kelasFb()).includes('ok') && (await fbS()).includes('berjalan mundur'));
    rec('soal: diperbaiki sendiri → dibayar 12 + jejak pemulihan',
        (await xp()) - xp0 === 12 + await q.evaluate(() => window.__g.XP_PULIH), String((await xp()) - xp0));
    const xp1 = await xp();
    await isiSoal(null, TEKS, { soalJawab: '100' });
    rec('soal: jenis yang sama tidak dibayar dua kali', (await xp()) === xp1);
    await q.fill('#soalTeks', TEKS + ' Jawab dalam cm.');
    rec('soal: menyunting setelah diperiksa → diingatkan memeriksa lagi', (await fbS()).includes('berubah sejak diperiksa'));

    await isiSoal('perubahan', 'Kalau papan ini dipanjangkan 10 cm, kelilingnya bertambah berapa?',
                  { soalA: '10', soalJawab: '10' }, { soalSisi: 'p', soalTanya: 'K' });
    rec('soal: perubahan keliling yang lupa dua sisi → diingatkan ada dua sisi',
        (await kelasFb()).includes('bad') && (await fbS()).includes('dua sisi panjang'));
    await isiSoal(null, undefined, { soalJawab: '20' });
    rec('soal: perubahan keliling benar → ditunjukkan bahwa jawabannya tidak bergantung pada papan',
        (await fbS()).includes('tidak memakai ukuran papanmu'));
    await isiSoal(null, 'Kalau papan ini dipanjangkan 10 cm, luasnya bertambah berapa?',
                  { soalA: '10', soalJawab: '20' }, { soalSisi: 'p', soalTanya: 'L' });
    rec('soal: perubahan luas dengan jawaban keliling ditolak', (await kelasFb()).includes('bad'));
    await isiSoal(null, undefined, { soalJawab: '500' });
    rec('soal: perubahan luas memakai lebar papan yang diukur sendiri (10 × 50)',
        (await kelasFb()).includes('ok') && (await fbS()).includes('bergantung pada papanmu'));

    await isiSoal('maju', 'Papan panjangnya delapan puluh cm dan lebarnya lima puluh cm. Kelilingnya?',
                  { soalA: '80', soalB: '50', soalJawab: '260' }, { soalTanya: 'K' });
    const majuS = await fbS();
    rec('soal: maju benar, siswa didorong mencoba jenis yang lebih menantang', majuS.includes('Coba juga soal'));
    rec('soal: angka yang tidak tertulis di kalimat → catatan lunak, tetap diterima',
        (await kelasFb()).includes('ok') && majuS.includes('angka 80 dan 50 belum terlihat') && majuS.includes('abaikan catatan ini'));
    await isiSoal(null, 'Papan panjangnya 80,5 cm dan lebarnya 50 cm. Kelilingnya?', { soalA: '80.5', soalJawab: '261' });
    rec('soal: desimal dengan koma di kalimat dikenali', !(await fbS()).includes('belum terlihat'));

    const bungkus = await q.evaluate(() => {
      const x = document.createElement('canvas').getContext('2d'); x.font = '17px sans-serif';
      const panjang = 'Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh. '.repeat(12);
      return { biasa: window.__soal.bungkus(x, 'Soal pendek.', 664, 4),
               potong: window.__soal.bungkus(x, panjang, 664, 4),
               kata: window.__soal.bungkus(x, 'x'.repeat(200), 664, 4),
               lebar: Math.max(...window.__soal.bungkus(x, panjang, 664, 4).map(b => x.measureText(b).width)) };
    });
    rec('soal: kalimat dibungkus tanpa melewati lebar kartu, paling banyak 4 baris berakhir "…"',
        bungkus.biasa.length === 1 && bungkus.potong.length === 4 && bungkus.potong[3].endsWith('…') &&
        bungkus.lebar <= 664 && bungkus.kata.length >= 2, bungkus.potong.length + ' baris, ' + Math.round(bungkus.lebar) + ' px');

    // pindaian baru = papan baru = soal baru
    await q.click('#btnSim'); await q.waitForTimeout(150); await q.click('#btnDetect'); await q.waitForTimeout(150);
    await q.click('#btnLock'); await q.waitForTimeout(150);
    rec('soal: pindaian baru mengosongkan soal dan meredupkan Langkah 5', (await redup()) &&
        (await jj()).soal === '' && (await q.inputValue('#soalTeks')) === '' &&
        (await q.getAttribute('[data-soal="maju"]', 'aria-pressed')) === 'false');
    await ctxS.close();
  }

  // ---- penghitung waktu 20 menit: pengingat, bukan batas ----
  // Jam palsu Playwright: 20 menit diuji tanpa menunggu 20 menit sungguhan.
  const ctxW = await browser.newContext({ viewport: { width: 820, height: 1000 } });
  const w = await ctxW.newPage();
  w.on('pageerror', e => errs.push('WAKTU PAGEERROR: ' + e.message));
  await w.clock.install({ time: new Date('2026-10-05T08:00:00+07:00') });
  await w.goto(BASE + 'ar-ukur.html'); await w.waitForTimeout(300);
  const cip = async () => (await w.textContent('#tmChip')).replace(/\s+/g, ' ').trim();
  rec('waktu: sebelum mulai, tombol "Mulai 20 menit" tampil dan penghitung tersembunyi',
      await w.isVisible('#btnTimer') && !(await w.isVisible('#tmChip')) &&
      (await w.textContent('#btnTimer')).includes('Mulai 20 menit'));
  rec('waktu: belum ada waktu tercatat sebelum tombol ditekan', await w.evaluate(() => window.__waktu.TM.mulai === null));
  await w.click('#btnTimer'); await w.clock.runFor(500);
  const mulai = await w.evaluate(() => window.__waktu.TM.mulai);
  rec('waktu: setelah Mulai, penghitung tampil 20:00 dan tombolnya hilang',
      (await cip()).includes('sisa 20:00') && !(await w.isVisible('#btnTimer')), await cip());
  await w.evaluate(() => document.getElementById('btnTimer').click());
  rec('waktu: menekan Mulai lagi tidak mengulang penghitung', await w.evaluate(m => window.__waktu.TM.mulai === m, mulai));
  await w.clock.runFor('15:03');   // jauh dari detik peralihan: angkanya dibulatkan ke atas
  rec('waktu: lima menit terakhir diberi peringatan berkata, bukan warna saja',
      (await w.getAttribute('#tmChip', 'class')).includes('akhir') && (await cip()).includes('sisa 04:5') &&
      (await w.textContent('#toastWrap')).includes('5 menit lagi'), await cip());
  await w.clock.runFor('07:12');
  rec('waktu: saat habis tertulis "Waktu habis" dan berapa lama lewatnya',
      (await w.getAttribute('#tmChip', 'class')).includes('habis') && (await cip()).includes('Waktu habis · lewat 02:1'), await cip());
  // pengingat, bukan batas: langkah ukur tetap bisa diselesaikan
  await w.click('#btnSim'); await w.clock.runFor(200); await w.click('#btnDetect'); await w.clock.runFor(200);
  await w.click('#btnLock'); await w.clock.runFor(200);
  const rW = await w.evaluate(() => window.__ar.ST.ratio);
  await w.fill('#inP', String(+(50 * rW).toFixed(1))); await w.fill('#inL', '50'); await w.click('#btnCheck');
  rec('waktu: setelah habis, siswa tetap boleh menyelesaikan ukurannya',
      (await w.textContent('#fb-ukur')).startsWith('Cocok') && !(await w.$eval('#cSub', e => e.classList.contains('dim'))));
  await w.reload(); await w.waitForTimeout(300);
  rec('waktu: muat ulang halaman tidak mengulang penghitung dari nol',
      await w.evaluate(m => window.__waktu.TM.mulai === m, mulai) && (await cip()).includes('Waktu habis'), await cip());
  // tiga jam kemudian: sesi pelajaran sudah lewat, penghitung lama dilupakan
  await w.clock.runFor('03:00:00'); await w.reload(); await w.waitForTimeout(300);
  rec('waktu: penghitung yang lebih tua dari 3 jam dilupakan',
      await w.evaluate(() => window.__waktu.TM.mulai === null) && await w.isVisible('#btnTimer'));
  await w.click('#btnTimer'); await w.clock.runFor(500);
  await w.click('#btnMulaiBaru'); await w.waitForTimeout(400);
  rec('waktu: "Mulai baru" ikut menghapus penghitung', await w.evaluate(() => window.__waktu.TM.mulai === null));
  await ctxW.close();

  // penyimpanan diblokir: penghitung tetap jalan, hanya tanpa ingatan
  const ctxB = await browser.newContext();
  const wb = await ctxB.newPage(); const eb = [];
  wb.on('pageerror', e => eb.push(e.message));
  await wb.addInitScript(() => {
    const tolak = () => { throw new DOMException('diblokir', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: tolak });
  });
  await wb.goto(BASE + 'ar-ukur.html'); await wb.waitForTimeout(300);
  await wb.click('#btnTimer'); await wb.waitForTimeout(1200);
  rec('waktu: penyimpanan diblokir, penghitung tetap berjalan tanpa galat',
      (await wb.isVisible('#tmChip')) && eb.length === 0, eb.join('|').slice(0, 70));
  await ctxB.close();

  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
