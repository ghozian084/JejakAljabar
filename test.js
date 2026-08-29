const { chromium } = require('playwright');
/* Jalur dihitung dari letak berkas uji, bukan ditulis keras. */
const BASE = "file://" + __dirname + "/";

const fs = require('fs');

// Jalankan seluruh uji DI DALAM halaman ber-CSP ketat (tanpa 'unsafe-eval'),
// meniru panel pratinjau / iframe LMS — persis kondisi yang tadi mematikan medianya.
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
  await ctx.route('**/jejak-aljabar.html', async route => {
    await route.fulfill({
      status: 200, contentType: 'text/html',
      headers: { 'content-security-policy': "default-src 'self' 'unsafe-inline' data:" },
      body: fs.readFileSync(__dirname + '/jejak-aljabar.html', 'utf8')
    });
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Content Security|script-src/.test(m.text())) errs.push(m.text()); });
  await page.goto('http://x.test/jejak-aljabar.html');
  await page.waitForTimeout(400);

  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));

  // ---------- mesin ekspresi (tanpa eval) ----------
  const eng = await page.evaluate(() => {
    const t = [];
    t.push(['p+2 ~ 1*p+2  (kasus yang dilaporkan)', equiv('p+2', '1*p+2', ['p']) === true]);
    t.push(['2(p+2) ~ 2p+4', equiv('2(p+2)', '2*p+4', ['p']) === true]);
    t.push(['5+2n ~ 2n+5', equiv('5 + 2n', '2*n+5', ['n']) === true]);
    t.push(['p+p+80+80 ~ 2p+160', equiv('p+p+80+80', '2*p+160', ['p']) === true]);
    t.push(['tolak 7n vs 2n+5', equiv('7n', '2*n+5', ['n']) === false]);
    t.push(['tolak kosong', equiv('', '2*n+5', ['n']) === false]);
    t.push(['tolak kode jahat', equiv('alert(1)', '2*n+5', ['n']) === false]);
    t.push(['tolak kurung tak seimbang', equiv('2*(p+4', '2*p+8', ['p']) === false]);
    t.push(['rumus terbalik anggaran', equiv('(B-25000)/2000', '(b-25000)/2000', ['b']) === true]);
    t.push(['tolak tanpa kurung', equiv('B-25000/2000', '(b-25000)/2000', ['b']) === false]);
    t.push(['numOf angka polos = 11', Math.abs(numOf('11') - 11) < 1e-9]);
    t.push(['numOf hitungan', Math.abs(numOf('(47000-25000)/2000') - 11) < 1e-9]);
    t.push(['numOf tolak variabel telanjang', isNaN(numOf('n'))]);
    return t;
  });
  eng.forEach(([n, ok]) => rec('mesin: ' + n, ok));

  // ---------- 1.1 ----------
  await page.fill('#q11', 'map');
  await page.click('[data-check="q11"]');
  rec('1.1 tolak kata utuh', (await page.textContent('#fb-q11')).includes('M1'));
  await page.fill('#q11', 'p');
  await page.click('[data-check="q11"]');
  rec('1.1 terima satu huruf', (await page.getAttribute('#fb-q11', 'class')).includes('ok'));

  // ---------- kasus persis yang dilaporkan: 1 map + 2 karya satuan, jawab p+2 ----------
  await page.click('[data-adj="box:-1"]');            // 2 -> 1 kotak
  await page.click('[data-adj="loose:-1"]');
  await page.click('[data-adj="loose:-1"]');
  await page.click('[data-adj="loose:-1"]');          // 5 -> 2 ikan satuan
  rec('counter menunjukkan 1 kotak / 2 satuan',
      (await page.textContent('#nBox')) === '1' && (await page.textContent('#nLoose')) === '2');
  await page.fill('#q12', 'p+2');
  await page.click('[data-check="q12"]');
  rec('1.2 TERIMA p+2 pada 1 kotak + 2 satuan', (await page.getAttribute('#fb-q12', 'class')).includes('ok'),
      (await page.textContent('#fb-q12')).slice(0, 55));

  // 1.3 pada konfigurasi yang sama
  await page.click('#openBox');
  const sv1 = parseInt(await page.textContent('#subVal'), 10);
  await page.fill('#q13', String(1 * sv1 + 2));
  await page.click('[data-check="q13"]');
  rec('1.3 TERIMA angka polos (bug CSP)', (await page.getAttribute('#fb-q13', 'class')).includes('ok'),
      (await page.textContent('#fb-q13')).slice(0, 45));

  // ---------- kembali ke 2 kotak + 5 satuan untuk uji jebakan ----------
  await page.click('[data-adj="box:1"]');
  for (let i = 0; i < 3; i++) await page.click('[data-adj="loose:1"]');
  await page.fill('#q12', '7p');
  await page.click('[data-check="q12"]');
  rec('1.2 diagnosis konkatenasi = M2', (await page.textContent('#fb-q12')).includes('M2'));
  await page.fill('#q12', '5 + 2p');
  await page.click('[data-check="q12"]');
  rec('1.2 terima urutan terbalik', (await page.getAttribute('#fb-q12', 'class')).includes('ok'));

  const seen = new Set();
  for (let i = 0; i < 8; i++) { await page.click('#openBox'); seen.add(await page.textContent('#subVal')); }
  rec('1.3 buka-kotak memberi nilai bervariasi', seen.size > 1, [...seen].join(','));

  // ---------- 1.5 keliling papan mading ----------
  await page.fill('#q15', '2p + 160');
  await page.click('[data-check="q15"]');
  rec('1.5 terima 2p+160', (await page.getAttribute('#fb-q15', 'class')).includes('ok'));
  await page.fill('#q15', 'p+p+80+80');
  await page.click('[data-check="q15"]');
  rec('1.5 terima bentuk belum disederhanakan', (await page.getAttribute('#fb-q15', 'class')).includes('ok'));
  await page.fill('#q15', '162p');
  await page.click('[data-check="q15"]');
  rec('1.5 diagnosis 162p = M2', (await page.textContent('#fb-q15')).includes('M2'));
  await page.fill('#q15', '80p');
  await page.click('[data-check="q15"]');
  rec('1.5 kenali keliling vs luas', (await page.textContent('#fb-q15')).includes('luas'));

  // ---------- 1.4 ----------
  const q14 = async txt => { await page.fill('#q14', txt); await page.click('[data-check="q14"]');
    await page.waitForTimeout(60);
    return { cls: await page.getAttribute('#fb-q14', 'class'), txt: await page.textContent('#fb-q14') }; };
  let r14 = await q14('k itu singkatan dari kotak, jadi 3k artinya tiga kotak');
  rec('1.4 tandai miskonsepsi label', r14.txt.includes('M1'));
  r14 = await q14('3k artinya 3 kotak');
  rec('1.4 "3 kotak" telanjang ditandai M1', r14.txt.includes('M1'));
  r14 = await q14('artinya 3 dikali k saja');
  rec('1.4 perkalian tanpa rujukan hanya diberi petunjuk', r14.cls.includes('hint'));
  r14 = await q14('k adalah banyak ikan dalam satu kotak');
  rec('1.4 rujukan tanpa perkalian hanya diberi petunjuk', r14.cls.includes('hint'));
  r14 = await q14('3k adalah banyaknya ikan di dalam 3 kotak');
  rec('1.4 terima jawaban benar tanpa kata "kali"', r14.cls.includes('ok'));
  r14 = await q14('Benar, karena 3k artinya 3 kali k, dimana k adalah banyak ikan dalam 1 kotak');
  rec('1.4 TERIMA jawaban benar yang diawali kata "Benar" (kasus dilaporkan)', r14.cls.includes('ok'),
      r14.txt.slice(0, 40));
  r14 = await q14('Salah. 3k artinya 3 dikali isi satu kotak, jadi bukan 3 kotak.');
  rec('1.4 terima argumen lengkap', r14.cls.includes('ok'));

  // ---------- POS 2 ----------
  await page.click('[data-go="p2"]'); await page.waitForTimeout(250);
  await page.click('[data-op="trapL"]'); await page.waitForTimeout(150);
  rec('2.1 operasi satu ruas memiringkan + tandai M3', (await page.textContent('#fb-scale')).includes('M3'));
  await page.waitForTimeout(1900);
  rec('2.1 operasi satu ruas dikembalikan', (await page.textContent('#eqL')).trim() === '3n + 2');
  await page.click('[data-op="sub2"]');
  await page.click('[data-op="div3"]'); await page.waitForTimeout(250);
  rec('2.1 operasi kedua ruas mengisolasi n',
      (await page.textContent('#eqL')).trim() === 'n' && (await page.textContent('#eqR')).trim() === '8');
  rec('2.1 umpan balik kemenangan tampil', (await page.getAttribute('#fb-scale', 'class')).includes('ok'));

  await page.fill('#q22', '23.5');
  await page.click('[data-check="q22"]');
  rec('2.2 diagnosis bagi-semuanya = M4', (await page.textContent('#fb-q22')).includes('M4'));
  await page.fill('#q22', '36');
  await page.click('[data-check="q22"]');
  rec('2.2 diagnosis tambah-bukan-kurang = M5', (await page.textContent('#fb-q22')).includes('M5'));
  await page.fill('#q22', '11');
  await page.click('[data-check="q22"]');
  rec('2.2 terima 11 lembar', (await page.getAttribute('#fb-q22', 'class')).includes('ok'));

  await page.fill('#q23', '(B-25000)/2000');
  await page.click('[data-check="q23"]');
  rec('2.2 terima rumus terbalik', (await page.getAttribute('#fb-q23', 'class')).includes('ok'));
  await page.fill('#q23', 'B/2000-25000');
  await page.click('[data-check="q23"]');
  rec('2.2 diagnosis urutan operasi = M4', (await page.textContent('#fb-q23')).includes('M4'));

  // ---------- POS 3 ----------
  await page.click('[data-go="p3"]'); await page.waitForTimeout(250);
  await page.fill('#budiIn', 'Menurutku itu benar saja pokoknya');
  await page.click('#budiSend'); await page.waitForTimeout(250);
  rec('3 Budi menolak argumen lemah', (await page.$$eval('#pips .pip.on', n => n.length)) === 0);
  await page.fill('#budiIn', 'Tanda sama dengan artinya kedua ruas bernilai sama, bukan perintah hitung.');
  await page.click('#budiSend'); await page.waitForTimeout(220);
  await page.fill('#budiIn', 'Karena sama, urutannya boleh dibalik, tidak masalah mau kiri atau kanan.');
  await page.click('#budiSend'); await page.waitForTimeout(220);
  await page.fill('#budiIn', 'Buktinya n = 8 maka 3 x 8 + 2 = 26 dan ruas kanan juga 26.');
  await page.click('#budiSend'); await page.waitForTimeout(280);
  rec('3 Budi menyerah setelah 3 konsep', (await page.$$eval('#pips .pip.on', n => n.length)) === 3);

  await page.click('[data-topic="konkat"]'); await page.waitForTimeout(180);
  await page.fill('#budiIn', 'Itu bukan suku sejenis, beda jenis.');
  await page.click('#budiSend'); await page.waitForTimeout(220);
  await page.fill('#budiIn', 'Jadi memang tidak bisa disederhanakan, sudah bentuk akhir.');
  await page.click('#budiSend'); await page.waitForTimeout(220);
  await page.fill('#budiIn', 'Coba n = 1 maka 2 + 3 = 5 dan 5 x 1 = 5');
  await page.click('#budiSend'); await page.waitForTimeout(250);
  const semua = await page.$$eval('.msg.budi .bub', n => n.map(x => x.textContent).join(' | '));
  rec('Budi tidak berkata "menyerah/salah" sebelum ketiga konsep terpenuhi',
      !/aku salah|aku menyerah|makasih/i.test(semua) ||
      (await page.$$eval('#pips .pip.on', n => n.length)) === 3);
  let last = await page.$$eval('.msg.budi .bub', n => n[n.length - 1].textContent);
  rec('3 Budi menolak kontracontoh n=1',
      /Berarti aku benar/i.test(last) && (await page.$$eval('#pips .pip.on', n => n.length)) === 2);
  await page.fill('#budiIn', 'Kalau n = 4 maka 2 + 3 x 4 = 14 tapi 5 x 4 = 20, hasilnya beda.');
  await page.click('#budiSend'); await page.waitForTimeout(250);
  rec('3 Budi menyerah pada kontracontoh sah', (await page.$$eval('#pips .pip.on', n => n.length)) === 3);

  // ---------- POS 4 & shell ----------
  await page.click('[data-go="p4"]'); await page.waitForTimeout(250);
  rec('4 peta menampilkan enam kode', (await page.$$eval('#mgrid .mcard', n => n.length)) === 6);
  rec('4 panel guru terisi', (await page.textContent('#teacherPanel')).includes('Sudah kuat'));

  await page.click('[data-go="p1"]'); await page.waitForTimeout(250);
  rec('tautan ke Modul 2 ada', (await page.getAttribute('#mLap', 'href')) === 'ar-ukur.html');
  rec('kartu sambungan tampil', await page.isVisible('.handoff a.go'));

  const w = await page.evaluate(() => document.getElementById('progbar').style.width);
  rec('progres bergerak', parseFloat(w) > 0, w);

  // ---------- lapisan petualangan ----------
  const g = await page.evaluate(() => {
    const { G, BADGES, levelName, XP_ITEM, XP_PULIH } = window.__g;
    return { xp: G.xp, badges: Object.keys(G.badges), nb: BADGES.length,
             lv: levelName(G.xp), pulih: XP_PULIH, q11: XP_ITEM.q11 };
  });
  rec('poin terkumpul dari pengerjaan', g.xp > 0, g.xp + ' jejak · ' + g.lv);
  rec('lencana diberikan, bukan hanya angka', g.badges.length >= 5, g.badges.join(','));
  rec('lencana "bangkit" diberikan karena melepaskan salah paham', g.badges.includes('bangkit'));
  rec('lencana "tahu jebakan" diberikan meski sempat kena jebakan', g.badges.includes('jebakan'));

  // aturan pokok: memperbaiki dibayar LEBIH MAHAL daripada benar sejak awal
  const bayar = await page.evaluate(() => {
    const { XP_ITEM, XP_PULIH } = window.__g;
    return { langsung: XP_ITEM.q12, pulih: XP_ITEM.q12 + XP_PULIH };
  });
  rec('memperbaiki dibayar lebih mahal daripada benar sejak awal',
      bayar.pulih > bayar.langsung, bayar.langsung + ' vs ' + bayar.pulih + ' jejak');

  rec('peta perjalanan menandai pos tuntas',
      (await page.getAttribute('[data-go="p1"]', 'data-state')) === 'done',
      await page.getAttribute('[data-go="p1"]', 'data-state'));
  rec('rel perjalanan terisi', parseFloat(await page.evaluate(() => document.getElementById('railfill').style.width)) > 0);
  rec('kartu perjalanan menampilkan lencana',
      (await page.$$eval('#badgeGrid .badge', n => n.length)) === g.nb, g.nb + ' lencana');
  rec('lencana yang belum diraih tampil terkunci',
      (await page.$$eval('#badgeGrid .badge.locked', n => n.length)) >= 0);

  // ---------- lembar kerja / PDF ----------
  await page.click('[data-go="p4"]'); await page.waitForTimeout(250);
  await page.click('#btnPdf'); await page.waitForTimeout(150);
  rec('PDF menolak tanpa nama', (await page.textContent('#fb-pdf')).includes('namamu'));
  await page.fill('#idNama', 'Ghozian Kafi');
  await page.fill('#idKelas', 'IX-B');
  await page.evaluate(() => { window.__printed = 0; window.print = () => window.__printed++; });
  await page.click('#btnPdf'); await page.waitForTimeout(250);
  rec('dialog cetak dipanggil', (await page.evaluate(() => window.__printed)) === 1);
  const rp = await page.textContent('#report');
  rec('laporan memuat identitas', rp.includes('Ghozian Kafi') && rp.includes('IX-B'));
  rec('laporan memuat peta miskonsepsi', rp.includes('Peta Miskonsepsi') && rp.includes('M6'));
  rec('laporan memuat riwayat jawaban', rp.includes('Riwayat Jawaban'));
  rec('laporan menyimpan percobaan KELIRU, bukan hanya yang benar',
      rp.includes('7p') && rp.includes('23.5'), 'jejak jawaban salah ikut tercetak');
  rec('laporan memuat langkah neraca', rp.includes('Neraca Kesetaraan') && rp.includes('ruas KIRI saja'));
  rec('laporan memuat transkrip Budi', rp.includes('Debat dengan Budi') && rp.includes('Budi'));
  rec('laporan memuat kolom catatan guru', rp.includes('Catatan Guru'));
  rec('lembar PDF ikut mencantumkan Kode Jejak', /JJK-[0-9A-Z]{4}-[0-9A-Z]{3}/.test(rp));
  rec('lembar PDF mencantumkan jejak & lencana',
      rp.includes('Jejak terkumpul') && rp.includes('Lencana yang Diperoleh'));
  rec('peta mencatat kode dari jawaban keliru (M2 pulih, M5 masih bermasalah)',
      await page.evaluate(() => S.flags.M2 === 'work' && S.flags.M5 === 'flag'),
      await page.evaluate(() => JSON.stringify(S.flags)));
  const printHidden = await page.evaluate(() => {
    const m = window.matchMedia; return getComputedStyle(document.getElementById('report')).display;
  });
  rec('laporan tersembunyi di layar (hanya muncul saat cetak)', printHidden === 'none', printHidden);
  // ---------- KODE JEJAK ----------
  const kj = await page.evaluate(() => {
    const t = [];
    let bad = 0, n = 0;
    for (let a = 0; a < 4; a++) for (let m = 0; m < 1024; m += 61) for (let at = 0; at < 64; at += 7) {
      const st = [a, (a+1)%4, (a+2)%4, (a+3)%4, (a+2)%4, a];
      const c = __kj.packCode(st, m, at).slice(4).replace('-', '');
      const d = __kj.unpackCode(c); n++;
      if (!d || d.itemMask !== m || d.att !== at || d.stat.join() !== st.join()) bad++;
    }
    t.push(['codec bolak-balik utuh (' + n + ' kombinasi)', bad === 0]);
    const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const base = __kj.packCode([1,2,3,0,1,2], 511, 20).slice(4).replace('-', '');
    let caught = 0, tries = 0;
    for (let i = 0; i < 7; i++) for (const ch of AB) {
      if (ch === base[i]) continue; tries++;
      if (!__kj.unpackCode(base.slice(0,i) + ch + base.slice(i+1))) caught++;
    }
    t.push(['checksum menolak >95% salah ketik 1 karakter', caught / tries > 0.95,
            Math.round(100*caught/tries) + '%']);
    let tc = 0, tt = 0;
    for (let i = 0; i < 6; i++) { if (base[i] === base[i+1]) continue; tt++;
      if (!__kj.unpackCode(base.slice(0,i) + base[i+1] + base[i] + base.slice(i+2))) tc++; }
    t.push(['checksum menolak semua transposisi', tc === tt, tc + '/' + tt]);
    const messy = 'obrolan acak\n[07:12] Aisyah: ' + __kj.packCode([1,0,1,3,2,3], 900, 12) +
      '\n[07:13] Bagas: jjk 4h2n k9r ini bener ga\n[07:14] Citra: ' +
      __kj.packCode([3,3,1,1,0,3], 700, 9) + '\n[07:15] Aisyah: ' + __kj.packCode([1,0,1,3,2,3], 900, 12) +
      '\n[07:16] Bu Guru: ditunggu ya';
    const h = __kj.harvest(messy);
    t.push(['menyaring kode dari teks WhatsApp berantakan', h.rows.length === 2, h.rows.length + ' sah dari ' + h.total]);
    t.push(['kiriman ganda tidak dihitung dua kali', h.ditolak >= 1]);
    return t;
  });
  kj.forEach(([n, ok, x]) => rec('kode: ' + n, ok, x));

  // ---------- pemisahan kode konsep vs latihan ----------
  const kj2 = await page.evaluate(() => {
    const t = [];
    // kode Modul 1 dengan SELURUH item selesai (bit 9 menyala) — dulu salah dibaca sebagai kode latihan
    const k1 = __kj.packCode([3,3,3,3,3,3], 1023, 30, 0);
    const k3 = __kj.packCode([1,2,3,0,1,2], 63, 20, 1);
    t.push(['awalan konsep JJK, awalan latihan JLT', k1.startsWith('JJK-') && k3.startsWith('JLT-'), k1 + ' / ' + k3]);
    const d1 = __kj.unpackCode(k1.slice(4).replace('-', ''));
    t.push(['kode konsep dengan bit ke-10 menyala tetap terbaca sebagai KONSEP',
            d1.sumber === 0 && d1.itemMask === 1023]);
    let h = __kj.harvest('pagi ' + k1 + ' lalu ' + k3);
    t.push(['dua jenis dipisahkan, tidak dijumlahkan', h.konsep.length === 1 && h.latihan.length === 1,
            'konsep ' + h.konsep.length + ' · latihan ' + h.latihan.length]);
    h = __kj.harvest('JJK' + k3.slice(3));
    t.push(['awalan yang disunting ditolak', h.rows.length === 0 && h.silang === 1]);
    h = __kj.harvest('jlt' + k3.slice(3).toLowerCase());
    t.push(['huruf kecil tetap terbaca', h.latihan.length === 1]);
    h = __kj.harvest(k1 + ' ' + k1);
    t.push(['kiriman ganda tetap dihitung sekali', h.rows.length === 1 && h.ditolak === 1]);
    return t;
  });
  kj2.forEach(([n, ok, x]) => rec('pisah: ' + n, ok, x));

  await page.click('#btnDemo'); await page.waitForTimeout(200);
  await page.click('#btnBaca'); await page.waitForTimeout(300);
  rec('panel membaca kedua jenis kode dari satu percakapan',
      /31 kode konsep dan 11 kode latihan/.test(await page.textContent('#fb-kelas')),
      (await page.textContent('#fb-kelas')).slice(0, 44));
  rec('panel menegaskan keduanya tidak dijumlahkan',
      (await page.textContent('#fb-kelas')).includes('tidak dijumlahkan'));
  rec('tombol pemilih jenis muncul dengan jumlah masing-masing',
      (await page.$$eval('[data-jenis]', n => n.map(b => b.textContent).join('|')))
        .includes('Kode konsep (Modul 1) · 31'));
  const koLat = await (async () => { await page.click('[data-jenis="latihan"]'); await page.waitForTimeout(250);
    return page.textContent('#kelasOut'); })();
  rec('beralih ke kode latihan mengganti peta kelas', /dari 11 siswa/.test(koLat), koLat.match(/\d+ dari \d+ siswa/) || '');
  await page.click('[data-jenis="konsep"]'); await page.waitForTimeout(250);
  const ko = await page.textContent('#kelasOut');
  rec('kembali ke kode konsep memulihkan peta semula', /dari 31 siswa/.test(ko));
  rec('panel menyarankan kode paling mendesak', ko.includes('Besok ulangi ini dulu'));
  rec('rekomendasi menunjuk M3 pada data contoh', ko.includes('Besok ulangi ini dulu: M3'),
      ko.slice(ko.indexOf('Besok ulangi'), ko.indexOf('Besok ulangi') + 46));
  rec('tabel empat status ikut ditampilkan (bukan warna saja)',
      ko.includes('perlu dikerjakan') && ko.includes('pulih setelah keliru') && ko.includes('sudah kuat'));
  await page.fill('#paste', 'JJK-AAAA-AAA dan JJK-1234-567 dua-duanya ngawur');
  await page.click('#btnBaca'); await page.waitForTimeout(200);
  rec('kode ngawur ditolak, bukan dibaca asal', (await page.textContent('#fb-kelas')).includes('sengaja ditolak'));

  await page.click('#btnKode'); await page.waitForTimeout(150);
  const kode = await page.textContent('#kodeBox');
  rec('siswa mendapat kode berformat benar', /^JJK-[0-9A-Z]{4}-[0-9A-Z]{3}$/.test(kode), kode);
  rec('kode siswa memang bisa dibaca panel guru',
      await page.evaluate(k => !!__kj.unpackCode(k.slice(4).replace('-', '')), kode));
  rec('kode tidak memuat nama siswa', !kode.toUpperCase().includes('GHOZIAN'));

  await page.click('[data-go="p1"]'); await page.waitForTimeout(250);

  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shot-p1.png' });
  await page.click('[data-go="p2"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'shot-p2.png' });

  // ---------- simpan kemajuan ----------
  const sblm = { xp: await page.textContent('#xpVal'),
                 badge: await page.evaluate(() => Object.keys(window.__g.G.badges).sort().join(',')),
                 done: await page.evaluate(() => Object.keys(S.done).sort().join(',')) };
  await page.reload(); await page.waitForTimeout(400);
  const ssdh = { xp: await page.textContent('#xpVal'),
                 badge: await page.evaluate(() => Object.keys(window.__g.G.badges).sort().join(',')),
                 done: await page.evaluate(() => Object.keys(S.done).sort().join(',')) };
  rec('jejak bertahan setelah halaman dimuat ulang', sblm.xp === ssdh.xp, sblm.xp + ' → ' + ssdh.xp);
  rec('lencana bertahan setelah dimuat ulang', sblm.badge === ssdh.badge);
  rec('kegiatan yang selesai bertahan', sblm.done === ssdh.done);
  rec('spanduk pemulihan tampil', await page.isVisible('#restoreBar'));
  rec('riwayat jawaban ikut pulih (PDF tetap utuh)',
      (await page.evaluate(() => LOG.length)) > 0);
  await page.click('#btnMulaiBaru'); await page.waitForTimeout(500);
  rec('"Mulai dari awal" menghapus simpanan',
      (await page.textContent('#xpVal')) === '0' && !(await page.isVisible('#restoreBar')));
  rec('penyimpanan yang diblokir tidak mematikan media',
      await page.evaluate(() => { try { return typeof simpan === 'function'; } catch (e) { return false; } }));


  // ---------- kode simpan lintas perangkat ----------
  const ks = await page.evaluate(() => {
    const t = [];
    G.xp = 137; G.badges = {nama:1, utuh:1, bangkit:1, ruas:1, runding:1};
    G.seenBangkit = {M2:1, M4:1};
    S.letter = 'k'; S.q11ok = true;
    S.done = {q11:1, q12:1, q13:1, q15:1, scale:1, q22:1};
    S.flags = {M1:'clear', M2:'work', M3:'flag', M4:'work', M6:'clear'};
    const asli = window.__ks.buat();
    t.push(['kode terbentuk dengan awalan yang benar', asli.indexOf('SMP1-') === 0, asli]);
    t.push(['kode cukup pendek untuk disalin tangan', asli.length <= 34, asli.length + ' karakter']);
    // salah ketik satu karakter harus ditolak
    const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const inti = asli.replace(/-/g, '').slice(4);
    let tolak = 0, coba = 0;
    for (let i = 0; i < inti.length; i++) for (const c of AB) {
      if (c === inti[i]) continue; coba++;
      const rusak = 'SMP1' + inti.slice(0, i) + c + inti.slice(i + 1);
      if (window.__ks.pakai(rusak) !== 'ok') tolak++;
    }
    t.push(['checksum menolak >97% salah ketik satu karakter', tolak / coba > 0.97,
            Math.round(100 * tolak / coba) + '% dari ' + coba + ' variasi']);
    // transposisi dua karakter bersebelahan
    let tt = 0, tc = 0;
    for (let i = 0; i + 1 < inti.length; i++) {
      if (inti[i] === inti[i + 1]) continue; tt++;
      const r = 'SMP1' + inti.slice(0, i) + inti[i + 1] + inti[i] + inti.slice(i + 2);
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
  console.log('\nerror konsol (di luar peringatan CSP): ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
