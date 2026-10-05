const { chromium } = require('playwright');
const fs = require('fs');

/* Kartu lapangan: Modul 2 menulis kartu, Panel Guru di Modul 1 membacanya.
   Diuji lintas berkas karena kedua sisi harus sepakat soal format pita —
   kalau salah satu berubah sendirian, kartu siswa diam-diam tidak terbaca. */
const BASE = "file://" + __dirname + "/";

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));
  const errs = [];

  // ---- cuplikan bersama disalin, bukan ditaut: ketiga salinan harus sama persis ----
  const sumber = fs.readFileSync(__dirname + '/kartulapangan.js', 'utf8');
  for (const f of ['ar-ukur.html', 'partC.html', 'jejak-aljabar.html'])
    rec('salinan kartulapangan.js di ' + f + ' sama persis', fs.readFileSync(__dirname + '/' + f, 'utf8').includes(sumber));

  // ================= sisi siswa: Modul 2 =================
  const m2 = await browser.newPage({ viewport: { width: 820, height: 1200 } });
  m2.on('pageerror', e => errs.push('M2 PAGEERROR: ' + e.message));
  m2.on('console', m => { if (m.type() === 'error') errs.push('M2 ' + m.text()); });
  await m2.goto(BASE + 'ar-ukur.html');
  await m2.waitForTimeout(300);
  const redup = () => m2.$eval('#cKirim', e => e.classList.contains('dim'));
  const fbKirim = () => m2.textContent('#fb-kirim');

  rec('kartu kirim redup sebelum papan dikunci', await redup());
  await m2.click('#btnSim'); await m2.waitForTimeout(150);
  await m2.click('#btnDetect'); await m2.waitForTimeout(150);

  // geser satu sudut dengan "jari" sebelum mengunci
  const sudut = await m2.evaluate(() => {
    const q = window.__ar.ST.quad[0], cv = document.getElementById('cv'), r = cv.getBoundingClientRect();
    return { x: r.left + q.x * r.width / cv.width, y: r.top + q.y * r.height / cv.height };
  });
  await m2.mouse.move(sudut.x, sudut.y); await m2.mouse.down();
  await m2.mouse.move(sudut.x + 3, sudut.y + 2, { steps: 3 }); await m2.mouse.up();
  rec('sudut yang digeser tercatat untuk pindaian ini', await m2.evaluate(() => window.__ar.ST.digeser === true));

  await m2.click('#btnLock'); await m2.waitForTimeout(150);
  rec('kartu kirim aktif setelah papan dikunci', !(await redup()));
  const rasio = await m2.evaluate(() => window.__ar.ST.ratio);

  /* Ukuran yang PASTI meleset: dua kali rasio papan yang sebenarnya. Ukuran
     tetap seperti 100 × 100 kebetulan cocok bila papan simulasi acaknya
     hampir persegi — uji jadi lolos atau gagal tergantung undian. */
  const ukurMeleset = r => [String(+(100 * r).toFixed(1)), '50'];
  // ukur salah dulu, lalu cocok
  let [mp, ml] = ukurMeleset(rasio);
  await m2.fill('#inP', mp); await m2.fill('#inL', ml); await m2.click('#btnCheck');
  let j = await m2.evaluate(() => Object.assign({}, window.__ar.ST.jejak));
  rec('ukuran yang belum cocok tercatat (status 2, ulang 1)', j.statusUkur === 2 && j.ukurUlang === 1, JSON.stringify(j));
  const P = +(50 * rasio).toFixed(1);
  await m2.fill('#inP', String(P)); await m2.fill('#inL', '50'); await m2.click('#btnCheck');
  j = await m2.evaluate(() => Object.assign({}, window.__ar.ST.jejak));
  rec('ukuran yang cocok tercatat beserta p dan l', j.statusUkur === 1 && j.p === P && j.l === 50);

  // kartu dibuat lalu dibaca balik dari gambarnya sendiri
  await m2.click('#btnKartu'); await m2.waitForTimeout(400);
  rec('pratinjau kartu tampil', !(await m2.$eval('#kartuLihat', e => e.classList.contains('hide'))));
  rec('tombol unduh tampil', !(await m2.$eval('#btnKartuUnduh', e => e.classList.contains('hide'))));
  rec('siswa diingatkan bahwa namanya tidak ikut', (await fbKirim()).includes('tidak memuat namamu'));
  const balik = await m2.evaluate(async () => {
    const im = document.getElementById('kartuLihat');
    if (!im.complete) await new Promise(r => im.onload = r);
    return { w: im.naturalWidth, h: im.naturalHeight, baca: window.__kartu.baca(im), data: window.__kartu.data() };
  });
  rec('kartu berukuran 720×1040', balik.w === 720 && balik.h === 1040, balik.w + '×' + balik.h);
  const samaData = (a, b) => ['id','rasio','p','l','statusUkur','ukurUlang','kDua','kLuas','kLain','digeser','hari','waktu']
    .every(k => k === 'rasio' ? Math.abs(a[k] - Math.round(b[k] * 100) / 100) < 1e-9 : a[k] === b[k]) &&
    Object.keys(b.selesai).every(k => a.selesai[k] === b.selesai[k]);
  rec('pita kartu PNG terbaca balik sama dengan datanya', !!balik.baca.d && samaData(balik.baca.d, balik.data));

  // keliling: dua sisi (M2), luas, angka lain, lalu benar
  await m2.fill('#inK', String(P + 50)); await m2.click('#btnK');
  rec('kartu lama dinyatakan basi setelah jejak bertambah',
      await m2.$eval('#kartuLihat', e => e.classList.contains('hide')) && (await fbKirim()).includes('Buat kartu hasil'));
  await m2.fill('#inK', String(+(P * 50).toFixed(1))); await m2.click('#btnK');
  await m2.fill('#inK', '7'); await m2.click('#btnK');
  await m2.fill('#inK', String(2 * P + 100)); await m2.click('#btnK');
  j = await m2.evaluate(() => Object.assign({}, window.__ar.ST.jejak));
  rec('kekeliruan keliling tercatat per jenis (dua sisi, luas, lain)',
      j.kDua === 1 && j.kLuas === 1 && j.kLain === 1 && j.kBenar === true, JSON.stringify(j));

  // ketahanan pita: pampatan WhatsApp, perkecil, perbesar
  const tahan = await m2.evaluate(async () => {
    const c = window.__kartu.gambar(), d = window.__kartu.data();
    const muat = u => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = u; });
    const skala = async (s, q) => {
      const k = document.createElement('canvas'); k.width = Math.round(720 * s); k.height = Math.round(1040 * s);
      k.getContext('2d').drawImage(c, 0, 0, k.width, k.height);
      return window.__kartu.baca(await muat(k.toDataURL('image/jpeg', q)));
    };
    const ok = r => !!r.d && r.d.id === d.id && r.d.p === Math.round(d.p * 10) / 10 && r.d.kDua === d.kDua;
    const out = { q60: ok(await skala(1, .6)), q30: ok(await skala(1, .3)),
                  kecil: ok(await skala(.5, .6)), besar: ok(await skala(2, .6)) };
    // terpotong: rasio berubah
    const pt = document.createElement('canvas'); pt.width = 720; pt.height = 860;
    pt.getContext('2d').drawImage(c, 0, 0);
    out.potong = window.__kartu.baca(pt).alasan;
    // foto sembarang dengan rasio yang kebetulan pas
    const ac = document.createElement('canvas'); ac.width = 720; ac.height = 1040;
    const ax = ac.getContext('2d');
    for (let i = 0; i < 2500; i++) { ax.fillStyle = 'hsl(' + (i * 47 % 360) + ',50%,' + (i * 31 % 100) + '%)';
      ax.fillRect((i * 97) % 720, (i * 53) % 1040, 24, 24); }
    out.acak = window.__kartu.baca(ac).alasan;
    // coretan putih di atas pita: sel acuan utuh, sebagian data hilang
    const cr = document.createElement('canvas'); cr.width = 720; cr.height = 1040;
    const cx = cr.getContext('2d'); cx.drawImage(c, 0, 0);
    cx.fillStyle = '#fff'; cx.fillRect(300, 924, 140, 40);
    out.coret = window.__kartu.baca(cr).alasan;
    // kartu versi 1 sungguhan: tata bit lama, 110 bit = 24 simbol, tanpa waktu
    const w1 = new BitTulis();
    w1.put(KARTU.TANDA, 8).put(1, 4).put(12345, 20).put(1, 1).put(1, 1).put(1, 1).put(0, 1)
      .put(178, 11).put(5, 7).put(891, 14).put(500, 14).put(1, 2).put(0, 4)
      .put(0, 3).put(0, 3).put(0, 3).put(0, 1).put(277, 12);
    const s1 = w1.selesai(KARTU.AWALAN).slice(KARTU.AWALAN.length).replace(/-/g, '');
    const k1 = document.createElement('canvas'); k1.width = 720; k1.height = 1040;
    const x1 = k1.getContext('2d'); x1.fillStyle = '#fff'; x1.fillRect(0, 0, 720, 1040);
    kartuGambarPita(x1, s1);
    out.panjangV1 = s1.length;
    out.versi = window.__kartu.baca(k1).alasan;
    // Kartu v2 yang 24 simbol pertamanya KEBETULAN lolos checksum versi 1
    // (1 dari 1024). Dicari sungguhan, bukan diandaikan.
    const pita = s => { const k = document.createElement('canvas'); k.width = 720; k.height = 1040;
      const x = k.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 720, 1040); kartuGambarPita(x, s); return k; };
    let jebakan = null, coba = 0;
    for (; coba < 100000 && !jebakan; coba++) {
      const s = kartuSandi(Object.assign({}, window.__kartu.data(), { id: coba, waktu: 9 }));
      if (BitBaca(KARTU.AWALAN + s.slice(0, 24), KARTU.AWALAN)) jebakan = s;
    }
    out.jebakan = jebakan ? { coba: coba, potong: kartuBacaSandi(jebakan.slice(0, 24)),
                              utuh: (window.__kartu.baca(pita(jebakan)).d || {}).waktu } : null;
    return out;
  });
  rec('pita terbaca setelah JPEG kualitas 60% (≈ WhatsApp)', tahan.q60);
  rec('pita terbaca setelah JPEG kualitas 30%', tahan.q30);
  rec('pita terbaca setelah diperkecil separuh', tahan.kecil);
  rec('pita terbaca setelah diperbesar dua kali', tahan.besar);
  rec('kartu terpotong ditolak, bukan dibaca keliru', tahan.potong === 'rasio', tahan.potong);
  rec('foto sembarang ditolak', !!tahan.acak, tahan.acak);
  rec('pita tercoret ditolak oleh checksum, bukan dibaca keliru', tahan.coret === 'sandi', tahan.coret);
  rec('kartu versi 1 sungguhan (24 simbol) ditolak dengan alasan versi, bukan "pita rusak"',
      tahan.panjangV1 === 24 && tahan.versi === 'versi', tahan.panjangV1 + ' simbol → ' + tahan.versi);
  rec('kartu v2 yang lolos checksum v1 secara kebetulan tidak terbaca sebagai v1',
      !!tahan.jebakan && tahan.jebakan.potong === null,
      tahan.jebakan ? 'ditemukan setelah ' + tahan.jebakan.coba + ' percobaan' : 'tidak ditemukan');
  rec('kartu jebakan itu tetap terbaca utuh beserta waktunya', !!tahan.jebakan && tahan.jebakan.utuh === 9);

  // kartu kebal tema: pita harus hitam di atas putih di tema apa pun
  const kebal = await m2.evaluate(() => {
    window.__tema.pakai('kertas'); const a = window.__kartu.gambar().toDataURL();
    window.__tema.pakai('malam');  const b = window.__kartu.gambar().toDataURL();
    window.__tema.pakai('kertas');
    return a === b;
  });
  rec('kartu identik piksel demi piksel di tema Kertas dan Malam', kebal);

  // bahan untuk Panel Guru: tiga pindaian berbeda, JPEG seperti dari WhatsApp
  const jpeg = () => m2.evaluate(() => window.__kartu.gambar().toDataURL('image/jpeg', .6));
  const buf = u => Buffer.from(u.split(',')[1], 'base64');
  const kartu = { A_akhir: buf(await jpeg()) };
  const kunciBaru = async () => {
    await m2.click('#btnSim'); await m2.waitForTimeout(120); await m2.click('#btnDetect'); await m2.waitForTimeout(120);
    await m2.click('#btnLock'); await m2.waitForTimeout(120);
    return m2.evaluate(() => window.__ar.ST.ratio);
  };
  const r2 = await kunciBaru();
  rec('pindaian baru memulai jejak baru', await m2.evaluate(() =>
    window.__ar.ST.jejak.statusUkur === 0 && window.__ar.ST.jejak.kDua === 0 && window.__ar.ST.digeser === false));
  const P2 = +(40 * r2).toFixed(1);
  await m2.fill('#inP', String(P2)); await m2.fill('#inL', '40'); await m2.click('#btnCheck');
  kartu.B_awal = buf(await jpeg());
  await m2.fill('#inK', String(2 * P2 + 80)); await m2.click('#btnK');
  kartu.B_akhir = buf(await jpeg());
  [mp, ml] = ukurMeleset(await kunciBaru());
  await m2.fill('#inP', mp); await m2.fill('#inL', ml); await m2.click('#btnCheck');
  kartu.C = buf(await jpeg());
  kartu.potong = buf(await m2.evaluate(() => { const c = window.__kartu.gambar(), k = document.createElement('canvas');
    k.width = 720; k.height = 880; k.getContext('2d').drawImage(c, 0, 0); return k.toDataURL('image/jpeg', .6); }));

  // ================= sisi guru: Panel Guru di Modul 1 =================
  const m1 = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  m1.on('pageerror', e => errs.push('M1 PAGEERROR: ' + e.message));
  m1.on('console', m => { if (m.type() === 'error') errs.push('M1 ' + m.text()); });
  // masuk lewat jalur guru yang sebenarnya: tautan Panel Guru di menu utama
  await m1.goto(BASE + 'index.html');
  await m1.waitForTimeout(300);
  await m1.click('a[href="jejak-aljabar.html#panelGuru"]');
  await m1.waitForTimeout(500);
  rec('kotak kartu lapangan terlihat begitu Panel Guru dibuka dari menu', await m1.isVisible('#kartuZona'));
  const petaSebelum = await m1.evaluate(() => window.__snap());
  const isiSimpanan = () => m1.evaluate(() => {
    const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); }
    return JSON.stringify(o);
  });
  const simpananSebelum = await isiSimpanan();
  const fb = async () => (await m1.textContent('#fb-lapangan')).replace(/\s+/g, ' ');
  const isi = () => m1.evaluate(() => window.__lapangan.L.kartu.map(k => k.d));

  // B_akhir dikirim DULUAN, B_awal belakangan: yang lengkap tetap harus menang
  await m1.setInputFiles('#kartuBerkas', [
    { name: 'A.jpg', mimeType: 'image/jpeg', buffer: kartu.A_akhir },
    { name: 'B-akhir.jpg', mimeType: 'image/jpeg', buffer: kartu.B_akhir },
    { name: 'C.jpg', mimeType: 'image/jpeg', buffer: kartu.C },
    { name: 'terpotong.jpg', mimeType: 'image/jpeg', buffer: kartu.potong },
    { name: 'catatan.txt', mimeType: 'text/plain', buffer: Buffer.from('bukan gambar') },
  ]);
  await m1.waitForTimeout(800);
  let k = await isi();
  rec('panel membaca tiga kartu lewat pilih berkas', k.length === 3, k.length + ' kartu');
  rec('kartu terpotong disebut namanya beserta alasan penolakan',
      (await fb()).includes('terpotong.jpg') && (await fb()).includes('dipotong'));
  rec('berkas bukan gambar diabaikan tanpa galat', !(await fb()).includes('catatan.txt'));
  const stat = (await m1.textContent('#lapanganOut .kstat')).replace(/\s+/g, ' ');
  rec('ringkasan: 2/3 ukuran cocok, 2/3 keliling benar',
      stat.includes('2/3ukuran cocok') && stat.includes('2/3keliling benar'), stat);
  const saran = await m1.textContent('#lapanganOut .kadvice');
  rec('saran menyebut siswa yang ukurannya belum cocok', saran.includes('1 siswa ukurannya belum cocok'));
  rec('saran menyebut kekeliruan dua sisi sebagai M2', saran.includes('dua sisi saja') && saran.includes('M2'));

  await m1.setInputFiles('#kartuBerkas', [{ name: 'B-awal.jpg', mimeType: 'image/jpeg', buffer: kartu.B_awal }]);
  await m1.waitForTimeout(500);
  k = await isi();
  rec('kiriman ulang dari pindaian yang sama tidak dihitung dua kali', k.length === 3, k.length + ' kartu');
  rec('yang disimpan tetap versi paling lengkap walau datang lebih dulu',
      k.filter(d => d.selesai.cSub).length === 2);

  const judul = await m1.$$eval('.kkartu figcaption b', bs => bs.map(b => b.textContent));
  rec('galeri: kartu yang ukurannya belum cocok tampil paling depan', judul[0] === '✗ ukuran belum cocok', judul.join(' | '));
  rec('setiap status di galeri berlambang dan berkata, bukan warna saja',
      judul.length === 3 && judul.every(t => /^[✓✗—] \S/.test(t)));
  rec('foto di galeri bisa dibuka utuh', await m1.$$eval('.kkartu a.kfoto', as =>
      as.length === 3 && as.every(a => a.href.startsWith('blob:') && a.target === '_blank')));

  // seret-lepas
  await m1.click('#btnKartuKosong');
  rec('Kosongkan membersihkan galeri', (await isi()).length === 0 &&
      (await m1.$$('.kkartu')).length === 0);
  await m1.evaluate(async b64 => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'diseret.jpg', { type: 'image/jpeg' }));
    document.getElementById('kartuZona').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, kartu.C.toString('base64'));
  await m1.waitForTimeout(500);
  rec('kartu yang diseret ke kotak terbaca', (await isi()).length === 1);

  // waktu kerja: 14 menit (dalam batas), 25 menit, dan 45 menit (dicatat "30 atau lebih")
  const kartuWaktu = menit => m2.evaluate(m => {
    window.__waktu.TM.mulai = Date.now() - m * 60000 - 5000;
    window.__ar.ST.jejak.id = (window.__ar.ST.jejak.id + 7) % 1048576;   // pindaian berbeda
    const d = window.__kartu.data(), url = window.__kartu.gambar().toDataURL('image/jpeg', .6);
    window.__waktu.TM.mulai = null;
    return { waktu: d.waktu, url: url };
  }, menit);
  const w14 = await kartuWaktu(14), w25 = await kartuWaktu(25), w45 = await kartuWaktu(45);
  rec('kartu mencatat menit kerja sejak tombol Mulai', w14.waktu === 14 && w25.waktu === 25, w14.waktu + ', ' + w25.waktu);
  await m1.setInputFiles('#kartuBerkas', [
    { name: 'w14.jpg', mimeType: 'image/jpeg', buffer: buf(w14.url) },
    { name: 'w25.jpg', mimeType: 'image/jpeg', buffer: buf(w25.url) },
    { name: 'w45.jpg', mimeType: 'image/jpeg', buffer: buf(w45.url) },
  ]);
  await m1.waitForTimeout(700);
  k = await isi();
  rec('waktu terbaca di panel: 14, 25, 30+ (dibatasi), dan kosong bila tidak dipakai',
      JSON.stringify(k.map(d => d.waktu).sort()) === JSON.stringify([14, 25, 30, null].sort()),
      JSON.stringify(k.map(d => d.waktu)));
  const statW = (await m1.textContent('#lapanganOut .kstat')).replace(/\s+/g, ' ');
  rec('ringkasan: 1/3 kartu dibuat dalam 20 menit (kartu tanpa penghitung tidak dihitung)',
      statW.includes('1/3kartu dibuat dalam 20 menit'), statW);
  rec('saran menyebut kartu yang dibuat setelah 20 menit',
      (await m1.textContent('#lapanganOut .kadvice')).includes('2 kartu dibuat setelah 20 menit'));
  const ketW = await m1.$$eval('.kkartu .kket', ks => ks.map(x => x.textContent).join(' | '));
  rec('galeri menulis waktunya dengan kata, termasuk "lewat batas"',
      ketW.includes('14 menit') && ketW.includes('25 menit (lewat batas)') && ketW.includes('30+ menit (lewat batas)'), ketW);

  // privasi & peta miskonsepsi guru
  /* Bukan sekadar "tidak ada foto": panel ini tidak boleh menulis apa pun.
     Versi pertama lolos dari pemeriksaan foto tetapi diam-diam menitipkan
     pesannya — lengkap dengan nama berkas WhatsApp — ke riwayat jawaban siswa. */
  const simpananSesudah = await isiSimpanan();
  rec('memuat kartu tidak menulis apa pun ke localStorage', simpananSesudah === simpananSebelum,
      simpananSebelum.length + ' → ' + simpananSesudah.length + ' karakter');
  rec('pesan panel tidak masuk riwayat jawaban siswa', !/lapangan|kartu baru|terpotong\.jpg/.test(simpananSesudah));
  rec('kartu ber-M2 tidak mencatat apa pun di Peta Miskonsepsi milik guru',
      (await m1.evaluate(() => window.__snap())) === petaSebelum);

  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
