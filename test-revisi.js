const { chromium } = require('playwright');
const fs = require('fs');

/* Revisi "siswa memodelkan, kamera hanya memeriksa".
   Modul 2: Tebak Model sebelum kamera mengunci (petunjuk bertingkat, opsi guru,
   baris kartu hasil). Modul 4: tulis-dulu-lalu-pindai, umpan balik berupa
   petunjuk, batas 3× periksa + kunci guru, mode Periksa teman.
   Mode cadangan (simulasi, unggah foto, kerangka manual, hitung manual)
   diperiksa tetap berjalan. */
const BASE = "file://" + __dirname + "/";
// PNG polos 64×48 abu-abu: tidak ada bangun yang bisa dideteksi → kerangka bantu manual
const PNG_POLOS = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAT0lEQVR4nO3PMQ0AMAzAsPJHNlgFscOqFCNI5h03OuBXA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oD2gL3MCGliNTTOwAAAABJRU5ErkJggg==', 'base64');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));
  const errs = [];
  const buka = async (berkas, init) => {
    const ctx = await browser.newContext({ viewport: { width: 880, height: 1300 }, acceptDownloads: true });
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(berkas + ' PAGEERROR: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(berkas + ' ' + m.text()); });
    await p.goto(BASE + berkas); await p.waitForTimeout(300);
    return { p, ctx };
  };
  const kelas = async (p, sel) => (await p.getAttribute(sel, 'class')) || '';
  const nonaktif = async (p, sel) => (await p.getAttribute(sel, 'disabled')) !== null;

  // ================= MODUL 2 · TEBAK MODEL =================
  {
    const src = fs.readFileSync(__dirname + '/ar-ukur.html', 'utf8');
    rec('M2: tanpa eval / new Function', !/\beval\s*\(|new\s+Function\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')));
    rec('M2: judul tab tidak lagi memakai "AR"', !/<title>[^<]*\bAR\b/.test(src));

    const { p, ctx } = await buka('ar-ukur.html');
    // pemeriksa ekuivalensi
    const ekuiv = await p.evaluate(() => {
      const ok = ['2p+2l', '2l+2p', '2(p+l)', 'p+l+p+l', 'p+p+l+l', 'K = 2p + 2l', '2·p + 2×l', '2*a+2*b',
                  '(l+p)*2', 'p + l + l + p', '4p+2l-2p', '2 ( p + l )'];
      const salah = ['p+l', '2p+l', '4p', 'pl', '2pl', 'p×l', '2p+2l+1', '4(p+l)', '2p+2q+2r'];
      const takTerbaca = ['', '2p+', '2p+2l)', '((p', '2p+*2l', 'p#l'];
      return { ok: ok.filter(t => tebakCocok(t) !== true), salah: salah.filter(t => tebakCocok(t) !== false),
               tak: takTerbaca.filter(t => tebakCocok(t) !== null) };
    });
    rec('M2: semua bentuk ekuivalen diterima (2(p+l), p+l+p+l, a/b, ×, ·)', ekuiv.ok.length === 0, ekuiv.ok.join(' | '));
    rec('M2: rumus keliru ditolak (p+l, 2p+l, luas, 4p…)', ekuiv.salah.length === 0, ekuiv.salah.join(' | '));
    rec('M2: tulisan rusak dikenali sebagai tak terbaca, bukan keliru', ekuiv.tak.length === 0, ekuiv.tak.join(' | '));

    // --- rumus benar langsung lolos ---
    await p.click('#btnSim'); await p.waitForTimeout(150);
    rec('M2: kotak tebakan tersembunyi sebelum deteksi', !(await p.isVisible('#tebakBox')));
    await p.click('#btnDetect'); await p.waitForTimeout(150);
    rec('M2: setelah deteksi kotak tebakan muncul, kunci menunggu', (await p.isVisible('#tebakBox')) && await nonaktif(p, '#btnLock'));
    await p.evaluate(() => document.getElementById('btnLock').click());          // paksa: tetap tidak boleh mengunci
    rec('M2: tombol kunci tidak bisa dipaksa sebelum menebak', await p.evaluate(() => !window.__ar.ST.locked));
    await p.click('#btnTebak');
    rec('M2: tebakan kosong → diminta menulis, tidak dihitung petunjuk', (await kelas(p, '#fb-tebak')).includes('hint') &&
        await p.evaluate(() => TEBAK.petunjuk === 0 && TEBAK.pertama === ''));
    await p.fill('#inTebak', '2p + 2l'); await p.press('#inTebak', 'Enter'); await p.waitForTimeout(80);
    rec('M2: rumus benar langsung lolos (tombol Enter)', (await kelas(p, '#fb-tebak')).includes('ok') && !(await nonaktif(p, '#btnLock')));

    // --- alur lama setelahnya tidak berubah ---
    await p.click('#btnLock'); await p.waitForTimeout(150);
    rec('M2: alur lama — Langkah 2 & 3 terbuka, model 2p + 2l tampil',
        !(await kelas(p, '#cModel')).includes('dim') && !(await kelas(p, '#cMeasure')).includes('dim') &&
        (await p.textContent('#eqK')).includes('2p + 2l'));
    const r = await p.evaluate(() => window.__ar.ST.ratio);
    await p.fill('#inP', String(Math.round(r * 1000) / 10)); await p.fill('#inL', '100');
    await p.click('#btnCheck'); await p.waitForTimeout(100);
    rec('M2: alur lama — ukur cocok', (await kelas(p, '#fb-ukur')).includes('ok'));
    const K = await p.evaluate(() => 2 * window.__ar.ST.ratio * 100 + 200);
    await p.fill('#inK', K.toFixed(1)); await p.click('#btnK'); await p.waitForTimeout(100);
    rec('M2: alur lama — keliling benar, Langkah 5 terbuka', (await kelas(p, '#fb-k')).includes('ok') &&
        !(await kelas(p, '#cSoal')).includes('dim'));
    rec('M2: urutan trail tetap Pindai → Model → Ukur → Keliling',
        JSON.stringify(await p.$$eval('#trail .node', n => n.map(x => x.dataset.go))) === '["cScan","cModel","cMeasure","cSub"]');
    await p.click('#btnKartu'); await p.waitForSelector('#kartuLihat', { state: 'visible', timeout: 5000 }).catch(() => {});
    rec('M2: kartu hasil dibuat, tombol unduh tampil', (await p.isVisible('#kartuLihat')) && await p.isVisible('#btnKartuUnduh'));
    rec('M2: baris kartu "Dugaan model" — cocok tanpa petunjuk',
        await p.evaluate(() => teksTebakKartu(window.__ar.ST.jejak.tebak)) === '“2p + 2l” · ✓ cocok tanpa petunjuk');
    const [unduh] = await Promise.all([p.waitForEvent('download'), p.click('#btnKartuUnduh')]);
    rec('M2: kartu hasil bisa diunduh', /^kartu-lapangan-.*\.png$/.test(unduh.suggestedFilename()), unduh.suggestedFilename());
    const kartuOk = await p.evaluate(() => {
      const c = gambarKartu(); return c.width === KARTU.W && c.height === KARTU.H;
    });
    rec('M2: ukuran kartu tidak berubah (720×1210)', kartuOk);

    // --- uji ulang: benda lain → tebak lagi, rumus salah → petunjuk 1, 2, model ---
    await p.click('#btnSim'); await p.waitForTimeout(150); await p.click('#btnDetect'); await p.waitForTimeout(150);
    rec('M2: uji ulang — benda baru wajib ditebak lagi', (await p.isVisible('#tebakBox')) && await nonaktif(p, '#btnLock') &&
        (await p.textContent('#fb-tebak')).includes('Benda baru'));
    await p.fill('#inTebak', '2p+'); await p.click('#btnTebak');
    rec('M2: tulisan tak terbaca → petunjuk cara menulis, bukan petunjuk 1',
        (await p.textContent('#fb-tebak')).includes('belum terbaca') && await p.evaluate(() => TEBAK.petunjuk === 0));
    await p.fill('#inTebak', 'p+l'); await p.click('#btnTebak');
    const f1 = await p.textContent('#fb-tebak');
    rec('M2: salah pertama → Petunjuk 1 (4 sisi)', f1.includes('Petunjuk 1') && f1.includes('4 sisi') && await nonaktif(p, '#btnLock'), f1);
    await p.fill('#inTebak', '2p+l'); await p.click('#btnTebak');
    const f2 = await p.textContent('#fb-tebak');
    rec('M2: salah kedua → Petunjuk 2 (sisi berhadapan)', f2.includes('Petunjuk 2') && f2.includes('berhadapan') && await nonaktif(p, '#btnLock'), f2);
    rec('M2: petunjuk tidak membocorkan rumusnya', !/2\s*p\s*\+\s*2\s*l/.test(f1 + f2) && !(await p.isVisible('#tebakJelas')));
    await p.fill('#inTebak', 'p+p+l'); await p.click('#btnTebak');
    rec('M2: salah ketiga → model kamera ditampilkan + isian penjelasan',
        (await p.isVisible('#tebakJelas')) && (await p.textContent('#tebakModel')).includes('2p + 2l') && await nonaktif(p, '#btnLock'));
    await p.fill('#inJelas', 'kurang'); await p.click('#btnJelas');
    rec('M2: penjelasan terlalu pendek ditolak', (await kelas(p, '#fb-tebak')).includes('hint') && await nonaktif(p, '#btnLock'));
    await p.fill('#inJelas', 'Sisi l-nya cuma satu, padahal ada dua sisi l.'); await p.click('#btnJelas');
    rec('M2: setelah menjelaskan, kunci terbuka', !(await nonaktif(p, '#btnLock')));
    await p.click('#btnLock'); await p.waitForTimeout(150);
    rec('M2: dugaan PERTAMA & jumlah petunjuk dicatat di jejak pindaian',
        await p.evaluate(() => { const t = window.__ar.ST.jejak.tebak; return t.pertama === '2p+' && t.petunjuk === 2 && t.jelas.length > 8; }));
    rec('M2: baris kartu menyebut petunjuk & penjelasan',
        (await p.evaluate(() => teksTebakKartu(window.__ar.ST.jejak.tebak))).includes('2 petunjuk, lalu menjelaskan'));
    await p.click('#btnKartu'); await p.waitForSelector('#kartuLihat', { state: 'visible', timeout: 5000 }).catch(() => {});
    rec('M2: kartu tetap terbuat setelah jalur petunjuk', await p.isVisible('#kartuLihat'));

    // --- benar setelah 1 petunjuk ---
    await p.click('#btnSim'); await p.waitForTimeout(150); await p.click('#btnDetect'); await p.waitForTimeout(150);
    await p.fill('#inTebak', '4p'); await p.click('#btnTebak');
    await p.fill('#inTebak', '2(p+l)'); await p.click('#btnTebak');
    rec('M2: 2(p+l) diterima setelah petunjuk, pujian pemulihan', (await kelas(p, '#fb-tebak')).includes('ok') &&
        (await p.textContent('#fb-tebak')).includes('memperbaiki') && !(await nonaktif(p, '#btnLock')));
    await p.click('#btnLock'); await p.waitForTimeout(100);
    rec('M2: kartu — cocok setelah 1 petunjuk',
        await p.evaluate(() => teksTebakKartu(window.__ar.ST.jejak.tebak)) === '“4p” · ✓ cocok setelah 1 petunjuk');

    // --- mode cadangan: unggah foto tanpa bangun → kerangka bantu manual tetap lewat tebakan ---
    await p.setInputFiles('#file', { name: 'polos.png', mimeType: 'image/png', buffer: PNG_POLOS });
    await p.waitForTimeout(300);
    rec('M2: unggah foto menyetel ulang tebakan', !(await p.isVisible('#tebakBox')) && await nonaktif(p, '#btnLock'));
    await p.click('#btnDetect'); await p.waitForTimeout(150);
    rec('M2: kerangka bantu manual → tebakan tetap diminta', (await kelas(p, '#fb-det')).includes('hint') &&
        (await p.isVisible('#tebakBox')) && await nonaktif(p, '#btnLock'));
    await p.fill('#inTebak', 'l+p+l+p'); await p.click('#btnTebak');
    await p.click('#btnLock'); await p.waitForTimeout(150);
    rec('M2: kerangka manual + tebakan → model terkunci', await p.evaluate(() => window.__ar.ST.locked));

    // --- opsi guru: matikan ---
    await p.click('#opsiGuru summary');
    await p.uncheck('#optTebak');
    rec('M2: opsi guru tersimpan (try/catch)', await p.evaluate(() => { try { return localStorage.getItem('jejak.modul2.tebak.v1') === '0'; } catch (e) { return false; } }));
    await p.click('#btnSim'); await p.waitForTimeout(150); await p.click('#btnDetect'); await p.waitForTimeout(150);
    rec('M2: opsi mati → perilaku lama: kunci langsung aktif, tanpa kotak tebakan',
        !(await nonaktif(p, '#btnLock')) && !(await p.isVisible('#tebakBox')));
    await p.click('#btnLock'); await p.waitForTimeout(100);
    rec('M2: opsi mati → kartu menulis "tidak diminta"',
        (await p.evaluate(() => teksTebakKartu(window.__ar.ST.jejak.tebak))).includes('tidak diminta'));
    await p.reload(); await p.waitForTimeout(300);
    rec('M2: opsi guru bertahan setelah muat ulang', !(await p.isChecked('#optTebak')));
    await ctx.close();

    // tautan ?tebak=1 menyalakan lagi; ?tebak=0 mematikan
    const a = await buka('ar-ukur.html?tebak=0');
    rec('M2: tautan ?tebak=0 mematikan', !(await a.p.isChecked('#optTebak')));
    await a.p.goto(BASE + 'ar-ukur.html?tebak=1'); await a.p.waitForTimeout(250);
    rec('M2: tautan ?tebak=1 menyalakan', await a.p.isChecked('#optTebak'));
    await a.ctx.close();

    // penyimpanan ditolak sepenuhnya: media tetap hidup, bawaan ON
    const b = await buka('ar-ukur.html', () => {
      const tolak = () => { throw new Error('ditolak'); };
      Object.defineProperty(window, 'localStorage', { get: tolak });
    });
    await b.p.click('#btnSim'); await b.p.waitForTimeout(150); await b.p.click('#btnDetect'); await b.p.waitForTimeout(150);
    rec('M2: tanpa localStorage — tebakan tetap wajib dan berjalan', (await b.p.isVisible('#tebakBox')) && await b.p.isChecked('#optTebak'));
    await b.ctx.close();

    // bahasa Inggris: petunjuk memakai huruf l/w
    const e = await buka('ar-ukur.html', () => { try { localStorage.setItem('jejak.bahasa.v1', 'en'); } catch (x) {} });
    await e.p.click('#btnSim'); await e.p.waitForTimeout(150); await e.p.click('#btnDetect'); await e.p.waitForTimeout(150);
    rec('EN: label rumus memakai P =', (await e.p.textContent('#tebakAwal')).trim() === 'P =');
    await e.p.fill('#inTebak', 'l+w'); await e.p.click('#btnTebak');
    await e.p.fill('#inTebak', 'l+w+l'); await e.p.click('#btnTebak');
    rec('EN: petunjuk 2 dalam bahasa Inggris, huruf l dan w', (await e.p.textContent('#fb-tebak')).includes('How many l sides and w sides'));
    await e.p.fill('#inTebak', '2l+2w'); await e.p.click('#btnTebak');   // salah ketiga? tidak — ini benar
    rec('EN: 2l + 2w diterima', !(await nonaktif(e.p, '#btnLock')));
    await e.ctx.close();
  }

  // ================= MODUL 4 · BENGKEL KARTU =================
  {
    const { p, ctx } = await buka('ar-ekspresi.html');
    const setKartu = async (sq, ci) => {
      await p.evaluate(() => { window.__ae.ST.sq = 0; window.__ae.ST.ci = 0; });
      for (let i = 0; i < sq; i++) await p.click('[data-adj="sq:1"]');
      for (let i = 0; i < ci; i++) await p.click('[data-adj="ci:1"]');
    };
    const urutan = () => p.evaluate(() => {
      const j = document.getElementById('cJawab'), q = document.getElementById('cPindai');
      return (j.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'tulis-pindai' : 'pindai-tulis';
    });
    const coba = () => p.evaluate(() => window.__mi.MI.coba);

    // --- misi 1 (baca): tulis dulu, lalu pindai ---
    rec('M4: misi baca — kartu Tulis di atas kartu Pindai', (await urutan()) === 'tulis-pindai');
    rec('M4: nomor langkah ikut tertukar (Tulis = Langkah 2)',
        (await p.textContent('#stepJawab')) === 'LANGKAH 2' && (await p.textContent('#stepPindai')) === 'LANGKAH 3');
    rec('M4: kartu Tulis tidak redup sebelum ada pindaian', !(await kelas(p, '#cJawab')).includes('dim'));
    await p.click('#btnSim'); await p.waitForTimeout(200);
    await p.click('#btnPindai'); await p.waitForTimeout(150);
    rec('M4: pindai sebelum menulis ditolak dengan petunjuk', (await p.textContent('#fb-pindai')).includes('Tulis dulu') &&
        await p.evaluate(() => !window.__ae.ST.scanned));
    await p.fill('#jwb', '2n+3'); await p.click('#btnCek'); await p.waitForTimeout(100);
    rec('M4: periksa sebelum memindai → diminta memindai, kesempatan utuh',
        (await p.textContent('#fb-jawab')).includes('pindai') && (await coba()) === 0);
    await p.click('#btnPindai'); await p.waitForTimeout(300);
    rec('M4: setelah menulis, simulasi + pindai berjalan', await p.evaluate(() => window.__ae.ST.scanned));
    await setKartu(2, 3);                                     // hitungan manual (mode cadangan)
    // --- salah: petunjuk, bukan jawaban ---
    await p.fill('#jwb', '3n+3'); await p.click('#btnCek'); await p.waitForTimeout(80);
    const s1 = await p.textContent('#fb-jawab');
    rec('M4: salah kotak → "Jumlah kotak di ekspresimu belum sama dengan di meja"', s1.includes('Jumlah kotak di ekspresimu belum sama'), s1);
    rec('M4: petunjuk tidak menyebut hitungan kamera / jawaban', !/kamera membaca|terbaca 3|2n ?\+ ?3|seharusnya/.test(s1));
    rec('M4: sisa kesempatan 2 dari 3 ditampilkan', (await p.textContent('#sisaCoba')).includes('2 dari 3'));
    await p.fill('#jwb', '2n+4'); await p.click('#btnCek'); await p.waitForTimeout(80);
    rec('M4: salah satuan → "Cek lagi banyaknya ikan satuan"', (await p.textContent('#fb-jawab')).includes('Cek lagi banyaknya ikan satuan'));
    await p.fill('#jwb', '5n'); await p.click('#btnCek'); await p.waitForTimeout(80);
    const s3 = await p.textContent('#fb-jawab');
    rec('M4: M2 tetap didiagnosis tanpa membocorkan jawaban', s3.includes('M2') && !/2n ?\+ ?3|seharusnya/.test(s3), s3.slice(0, 80));
    // --- terkunci ---
    rec('M4: setelah 3× periksa keliru → terkunci', (await p.isVisible('#kunciBox')) && await nonaktif(p, '#btnCek') &&
        (await p.textContent('#kunciBox')).includes('Diskusikan dengan kelompokmu'));
    rec('M4: status kunci memakai lambang + kata, bukan warna saja', (await p.textContent('#kunciBox')).includes('🔒'));
    await p.reload(); await p.waitForTimeout(400);
    rec('M4: kunci bertahan setelah muat ulang', (await p.isVisible('#kunciBox')) && await nonaktif(p, '#btnCek'));
    await p.fill('#inKodeGuru', 'GURU2'); await p.click('#btnBukaKunci');
    rec('M4: kode guru keliru ditolak', (await p.textContent('#fb-kunci')).includes('belum tepat') && await p.isVisible('#kunciBox'));
    await p.fill('#inKodeGuru', 'guru 1'); await p.click('#btnBukaKunci');
    rec('M4: guru membuka kunci (GURU + nomor misi, huruf kecil/spasi boleh)',
        !(await p.isVisible('#kunciBox')) && !(await nonaktif(p, '#btnCek')) && (await coba()) === 0);
    // --- pulih → bonus tetap dibayar ---
    const xp0 = await p.evaluate(() => window.__mi.MI.xp);
    await p.click('#btnSim'); await p.waitForTimeout(200);
    await p.fill('#jwb', '2n+3');
    await p.click('#btnPindai'); await p.waitForTimeout(300);
    await setKartu(2, 3);
    await p.evaluate(() => { window.__mi.MI.keliru = Math.max(1, window.__mi.MI.keliru); });   // keliru sebelum muat ulang
    await p.click('#btnCek'); await p.waitForTimeout(250);
    const xp1 = await p.evaluate(() => window.__mi.MI.xp);
    rec('M4: misi lulus setelah kunci dibuka', await p.evaluate(() => !!window.__mi.MI.selesai[0]));
    rec('M4: memperbaiki tetap dibayar lebih mahal (bonus pemulihan)',
        xp1 - xp0 >= (await p.evaluate(() => window.__mi.XP_MISI + window.__mi.XP_PULIH)), '+' + (xp1 - xp0));
    await p.waitForTimeout(1600);

    // --- misi susun: urutan lama, umpan balik tanpa "seharusnya" ---
    rec('M4: misi berikutnya (susun) — urutan lama Pindai → Periksa', (await urutan()) === 'pindai-tulis' &&
        (await p.textContent('#stepPindai')) === 'LANGKAH 2');
    rec('M4: kesempatan disetel ulang untuk misi baru', (await coba()) === 0);
    await setKartu(1, 0);
    await p.click('#btnCekSusun'); await p.waitForTimeout(80);
    const sz = await p.textContent('#fb-jawab');
    rec('M4: susunan keliru → petunjuk, tanpa "seharusnya"', !sz.includes('seharusnya') && sz.includes('kotak'), sz.slice(0, 80));

    // --- Periksa teman (misi 7) ---
    await p.evaluate(() => { window.__mi.MI.i = 6; window.__mi.terapkanMisi(); });
    rec('M4: misi 7 — Periksa teman, kamera tersembunyi', (await p.isVisible('#temanBox')) &&
        !(await p.isVisible('#btnPindai')) && !(await p.isVisible('#btnCam')) && (await p.textContent('#l2title')) === 'Periksa teman');
    rec('M4: tombol − + tetap ada untuk hitungan teman', await p.isVisible('[data-adj="sq:1"]'));
    await p.evaluate(() => { window.__ae.ST.scanned = false; window.__ae.ST.sq = 0; window.__ae.ST.ci = 0; });
    await p.click('#btnCekSusun'); await p.waitForTimeout(80);
    rec('M4: periksa tanpa hitungan teman → diminta menghitung, kesempatan utuh',
        (await p.textContent('#fb-jawab')).includes('temanmu menghitung') && (await coba()) === 0);
    await setKartu(4, 5);
    await p.click('#btnCekSusun'); await p.waitForTimeout(80);
    rec('M4: hitungan teman keliru → 1 kesempatan terpakai', (await coba()) === 1);
    await p.click('#btnPenengah'); await p.waitForTimeout(80);
    rec('M4: "Minta penengah" memakai 1 kesempatan dan memunculkan kamera',
        (await coba()) === 2 && await p.isVisible('#btnPindai'));
    await p.click('#btnSim'); await p.waitForTimeout(200);
    await p.click('#btnPindai'); await p.waitForTimeout(300);
    rec('M4: penengah memindai (simulasi) dengan normal', (await kelas(p, '#fb-pindai')).includes('show'));
    await setKartu(4, 6);
    await p.click('#btnCekSusun'); await p.waitForTimeout(250);
    rec('M4: Periksa teman — misi lulus', await p.evaluate(() => !!window.__mi.MI.selesai[6]));
    await p.waitForTimeout(1600);
    rec('M4: misi 8 (BOS) juga Periksa teman, kamera mati lagi', (await p.isVisible('#temanBox')) && !(await p.isVisible('#btnPindai')));
    await p.evaluate(() => { window.__mi.MI.coba = 2; window.__mi.terapkanMisi(); });
    await p.click('#btnPenengah'); await p.waitForTimeout(80);
    rec('M4: penengah ditolak bila kesempatan tinggal satu', !(await p.isVisible('#btnPindai')) &&
        (await p.textContent('#fb-pindai')).includes('tinggal satu'));
    await p.evaluate(() => { window.__mi.MI.coba = 0; window.__mi.terapkanMisi(); });
    await setKartu(3, 5);
    await p.click('#btnCekSusun'); await p.waitForTimeout(150);
    await p.fill('#jwb', '3n+5'); await p.click('#btnCek'); await p.waitForTimeout(250);
    rec('M4: BOS lulus tanpa kamera (teman menghitung, siswa menulis)', await p.evaluate(() => !!window.__mi.MI.selesai[7]));

    // --- mode bebas: tanpa batas, alur lama ---
    await p.click('#btnBebas'); await p.waitForTimeout(200);
    await p.click('#btnSim'); await p.waitForTimeout(200);
    await p.click('#btnPindai'); await p.waitForTimeout(300);
    rec('M4: mode bebas — pindai tanpa harus menulis dulu', (await kelas(p, '#fb-pindai')).includes('show') &&
        await p.isVisible('#btnPindai'));
    await setKartu(1, 1);
    for (let i = 0; i < 5; i++) { await p.fill('#jwb', '9n'); await p.click('#btnCek'); await p.waitForTimeout(40); }
    rec('M4: mode bebas — tidak ada batas periksa', !(await p.isVisible('#kunciBox')) && !(await nonaktif(p, '#btnCek')));

    // --- unggah foto (mode cadangan) ---
    await p.setInputFiles('#file', { name: 'polos.png', mimeType: 'image/png', buffer: PNG_POLOS });
    await p.waitForTimeout(300); await p.click('#btnPindai'); await p.waitForTimeout(300);
    rec('M4: unggah foto tetap terbaca (tanpa kartu → diminta hitung manual)', (await p.textContent('#fb-pindai')).includes('Tidak ada kartu'));
    rec('M4: salah ketik "karya satuan" sudah dibetulkan', !fs.readFileSync(__dirname + '/ar-ekspresi.html', 'utf8').includes('karya satuan'));
    await ctx.close();
  }

  // ================= MENU UTAMA =================
  {
    const { p, ctx } = await buka('index.html');
    rec('Menu: kalimat prinsip di bagian Tentang', (await p.textContent('#tentang')).includes('Siswa memodelkan, kamera hanya memeriksa'));
    await ctx.close();
  }

  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
