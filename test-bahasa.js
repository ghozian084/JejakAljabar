const { chromium } = require('playwright');
const fs = require('fs');

/* Bahasa: pemilih, kelengkapan kamus, dan Modul 1 & 2 di keempat bahasa.
   Teks sumber tetap bahasa Indonesia di dalam kode; kamus memetakannya.
   Uji ini memastikan TIDAK ADA kalimat yang lolos tanpa terjemahan —
   baik yang ditulis di kode (terj/tandai/hud) maupun di markup (data-t). */
const BASE = "file://" + __dirname + "/";
const HALAMAN = ['index.html', 'ar-ukur.html', 'jejak-aljabar.html'];      // halaman yang sudah diterjemahkan
const BAHASA = ['en', 'zh', 'ko'];
// terjemahan yang memang sama dengan sumbernya
const BOLEH_SAMA = new Set(['Model', '☰ Menu', 'Jejak Aljabar', 'Kode Jejak', '2 + 3n = 5n?']);

const rapi = x => x.replace(/\s+/g, ' ').trim();
/* Kalimat literal di terj()/tandai()/hud(), termasuk "a" + "b" yang
   dipecah antarbaris. Komentar blok dibuang dulu: contoh di komentar
   bukan teks layar. */
function kalimatKode(sumber) {
  const s = sumber.replace(/\/\*[\s\S]*?\*\//g, '');
  const LIT = /"((?:[^"\\\n]|\\.)*)"/y, hasil = new Set();
  const re = /\b(terj|tandai|hud)\(\s*/g; let m;
  while ((m = re.exec(s))) {
    let i = re.lastIndex; const bagian = [];
    for (;;) {
      LIT.lastIndex = i; const l = LIT.exec(s); if (!l) break;
      bagian.push(JSON.parse('"' + l[1] + '"')); i = LIT.lastIndex;
      const sisa = /^\s*\+\s*(?=")/.exec(s.slice(i)); if (!sisa) break; i += sisa[0].length;
    }
    if (bagian.length) hasil.add(rapi(bagian.join('')));
  }
  return [...hasil].filter(k => /[A-Za-z]/.test(k));
}
// {n|box|boxes} adalah bentuk jamak dari placeholder n, bukan placeholder baru
const ph = x => [...new Set((x.match(/\{\w+(?:\|[^|}]*\|[^}]*)?\}/g) || []).map(p => p.replace(/\|.*\}$/, '}')))].sort().join(',');
const tag = x => (x.match(/<\/?[a-z]+\b/g) || []).sort().join(',');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const R = [];
  const rec = (n, ok, extra) => R.push((ok ? 'PASS' : '**FAIL**') + '  ' + n + (extra ? '  → ' + extra : ''));
  const errs = [];
  const halaman = async (berkas, bahasa, viewport, sebelum) => {
    const ctx = await browser.newContext({ viewport: viewport || { width: 900, height: 1300 } });
    if (bahasa) await ctx.addInitScript(v => { try { localStorage.setItem('jejak.bahasa.v1', v); } catch (e) {} }, bahasa);
    if (sebelum) await ctx.addInitScript(sebelum);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(berkas + ' ' + (bahasa || '') + ' PAGEERROR: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(berkas + ' ' + m.text()); });
    await p.goto(BASE + berkas); await p.waitForTimeout(300);
    return { p, ctx };
  };

  // ================= cuplikan bersama =================
  const bhs = fs.readFileSync(__dirname + '/bahasa-js.txt', 'utf8');
  const tema = fs.readFileSync(__dirname + '/tema-js.txt', 'utf8');
  for (const f of HALAMAN)
    rec('salinan bahasa-js.txt di ' + f + ' sama persis', fs.readFileSync(__dirname + '/' + f, 'utf8').includes(bhs));
  for (const f of ['index.html', 'ar-ukur.html', 'jejak-aljabar.html', 'latihan.html', 'ar-ekspresi.html'])
    rec('salinan tema-js.txt di ' + f + ' sama persis', fs.readFileSync(__dirname + '/' + f, 'utf8').includes(tema));

  // ================= kelengkapan kamus =================
  for (const f of HALAMAN) {
    const { p, ctx } = await halaman(f);
    const kode = kalimatKode(fs.readFileSync(__dirname + '/' + f, 'utf8'));
    const cek = await p.evaluate(([kode]) => {
      const K = JEJAK_BHS.KAMUS, rapi = x => x.replace(/\s+/g, ' ').trim();
      const markup = [];
      document.querySelectorAll('[data-t]').forEach(e => markup.push(rapi(e.__asli !== undefined ? e.__asli : e.innerHTML)));
      document.querySelectorAll('[data-t-attr]').forEach(e => e.getAttribute('data-t-attr').split(/\s+/)
        .forEach(a => { if (a && e.getAttribute(a)) markup.push(rapi(e.getAttribute(a))); }));
      const hilang = {}, dalamId = [];
      ['en', 'zh', 'ko'].forEach(b => { hilang[b] = kode.concat(markup).filter(k => !K[b][k]); });
      document.querySelectorAll('[data-t]').forEach(e => { if (e.querySelector('[id]')) dalamId.push(e.outerHTML.slice(0, 60)); });
      return { hilang, dalamId, nMarkup: markup.length, kamus: K };
    }, [kode]);
    for (const b of BAHASA)
      rec(f + ': setiap kalimat punya terjemahan ' + b + ' (' + (kode.length + cek.nMarkup) + ' kalimat)',
          cek.hilang[b].length === 0, cek.hilang[b].slice(0, 2).join(' | ').slice(0, 120));
    rec(f + ': elemen data-t tidak berisi elemen ber-id (isinya diganti saat bahasa berganti)',
        cek.dalamId.length === 0, cek.dalamId.join(' | '));
    // placeholder, tag, dan terjemahan yang tertinggal sama dengan sumber
    const salahPh = [], salahTag = [], sama = [];
    for (const b of BAHASA) for (const [k, v] of Object.entries(cek.kamus[b])) {
      if (ph(k) !== ph(v)) salahPh.push(b + ': ' + k.slice(0, 40));
      if (tag(k) !== tag(v)) salahTag.push(b + ': ' + k.slice(0, 40));
      if (k === v && !BOLEH_SAMA.has(k)) sama.push(b + ': ' + k.slice(0, 40));
    }
    rec(f + ': placeholder {x} di setiap terjemahan sama dengan sumbernya', salahPh.length === 0, salahPh.slice(0, 3).join(' | '));
    rec(f + ': tag HTML di setiap terjemahan sama dengan sumbernya', salahTag.length === 0, salahTag.slice(0, 3).join(' | '));
    rec(f + ': tidak ada terjemahan yang tertinggal berbahasa Indonesia', sama.length === 0, sama.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ================= pemilih bahasa (menu utama) =================
  {
    const { p, ctx } = await halaman('index.html');
    rec('bawaan: bahasa Indonesia, <html lang="id">', await p.evaluate(() =>
        JEJAK_BHS.kini() === 'id' && document.documentElement.lang === 'id'));
    const asli = await p.evaluate(() => [...document.querySelectorAll('[data-t]')].map(e => e.innerHTML));
    await p.click('#btnBahasa');
    rec('menu bahasa terbuka', await p.isVisible('#bahasaMenu'));
    const pilihan = await p.$$eval('#bahasaMenu [data-bahasa] .nm', x => x.map(e => e.textContent));
    rec('keempat bahasa ditulis dengan namanya sendiri',
        JSON.stringify(pilihan) === JSON.stringify(['Bahasa Indonesia', 'English', '中文（简体）', '한국어']), pilihan.join(', '));
    rec('judul menu menyebut keempat bahasa (jalan pulang bagi yang tersesat)',
        (await p.textContent('#bahasaMenu .hd')).includes('Bahasa') && (await p.textContent('#bahasaMenu .hd')).includes('언어'));
    rec('pilihan aktif ditandai dengan kata, bukan warna saja',
        (await p.textContent('[data-bahasa="id"] .tick')) === 'dipakai' &&
        (await p.getAttribute('[data-bahasa="id"]', 'aria-checked')) === 'true');
    await p.click('[data-bahasa="en"]'); await p.waitForTimeout(200);
    rec('memilih bahasa menutup menu dan menerjemahkan halaman', !(await p.isVisible('#bahasaMenu')) &&
        (await p.textContent('.sub')).startsWith('From objects'));
    rec('<html lang> ikut berganti', await p.evaluate(() => document.documentElement.lang) === 'en');
    rec('tanda pilihan ikut diterjemahkan', (await p.textContent('[data-bahasa="en"] .tick')) === 'in use');
    rec('label tema ikut bahasa', (await p.textContent('#btnTema')).includes('Paper'));
    rec('isi dinamis menu ikut bahasa (tombol Mulai, ringkasan)', (await p.textContent('#g1')) === 'Start' &&
        (await p.textContent('#summary')).includes('journey'));
    rec('modul 3, 4 diberi catatan "masih berbahasa Indonesia"', JSON.stringify(await p.$$eval('[data-bhs-belum]',
        x => x.map(e => !e.classList.contains('hide')))) === '[true,true]');
    rec('tidak ada catatan untuk Modul 1 dan 2 yang sudah diterjemahkan',
        (await p.$$('#c1 [data-bhs-belum]')).length === 0 && (await p.$$('#c2 [data-bhs-belum]')).length === 0);
    for (const b of ['zh', 'ko']) {
      await p.click('#btnBahasa'); await p.click('[data-bahasa="' + b + '"]'); await p.waitForTimeout(150);
    }
    rec('menu dalam ketiga bahasa tanpa kalimat terlewat', await p.evaluate(() => Object.keys(JEJAK_BHS.hilang).length) === 0,
        (await p.evaluate(() => Object.keys(JEJAK_BHS.hilang))).slice(0, 2).join(' | '));
    await p.click('#btnBahasa'); await p.click('[data-bahasa="id"]'); await p.waitForTimeout(150);
    const balik = await p.evaluate(() => [...document.querySelectorAll('[data-t]')].map(e => e.innerHTML));
    rec('kembali ke bahasa Indonesia memulihkan markup aslinya persis', JSON.stringify(balik) === JSON.stringify(asli));
    rec('catatan "masih berbahasa Indonesia" hilang lagi', (await p.$$eval('[data-bhs-belum]',
        x => x.filter(e => !e.classList.contains('hide')).length)) === 0);
    rec('pilihan disimpan terpisah dari kemajuan', await p.evaluate(() => localStorage.getItem('jejak.bahasa.v1')) === 'id');
    // pilihan terbawa ke modul
    await p.click('#btnBahasa'); await p.click('[data-bahasa="zh"]'); await p.waitForTimeout(150);
    await p.click('a[href="ar-ukur.html"]'); await p.waitForTimeout(500);
    rec('bahasa yang dipilih di menu terbawa ke Modul 2', await p.evaluate(() => JEJAK_BHS.kini()) === 'zh' &&
        (await p.textContent('h1')) === '先扫描，再亲手测量。');
    await p.goBack(); await p.waitForTimeout(300);
    await p.click('a[href="jejak-aljabar.html"]'); await p.waitForTimeout(500);
    rec('bahasa yang dipilih di menu terbawa ke Modul 1', await p.evaluate(() => JEJAK_BHS.kini()) === 'zh' &&
        (await p.textContent('#p2 h2')) === '等式天平' && (await p.textContent('.hero h1')).startsWith('字母不是缩写'),
        (await p.textContent('.hero h1')).slice(0, 30));
    await ctx.close();
  }
  {
    const { p, ctx } = await halaman('index.html', 'xx');
    rec('nilai bahasa tak dikenal jatuh ke bahasa Indonesia', await p.evaluate(() => JEJAK_BHS.kini()) === 'id');
    await ctx.close();
  }
  {
    // penyimpanan diblokir: bahasa tetap bisa diganti untuk sesi ini
    const e0 = errs.length;
    const { p, ctx } = await halaman('ar-ukur.html', null, null, () => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('diblokir', 'SecurityError'); } });
    });
    await p.click('#btnBahasa'); await p.click('[data-bahasa="ko"]'); await p.waitForTimeout(200);
    rec('penyimpanan diblokir: bahasa tetap bisa diganti, tanpa galat',
        (await p.textContent('h1')) === '먼저 스캔하고, 직접 재세요.' && errs.length === e0, errs.slice(e0).join('|').slice(0, 80));
    await ctx.close();
  }

  // ================= Modul 2: alur penuh di tiap bahasa =================
  const HARAP = {
    en: { eqK: 'P = l + w + l + w = 2l + 2w', eqL: 'A = l × w', bulan: 'October' },
    zh: { eqK: 'C = a + b + a + b = 2a + 2b', eqL: 'S = a × b', bulan: '月' },
    ko: { eqK: '둘레 = a + b + a + b = 2a + 2b', eqL: '넓이 = a × b', bulan: '월' }
  };
  for (const b of BAHASA) {
    const { p, ctx } = await halaman('ar-ukur.html', b);
    await p.click('#btnTimer');
    await p.click('#btnSim'); await p.waitForTimeout(150); await p.click('#btnDetect'); await p.waitForTimeout(150);
    await p.click('#btnLock'); await p.waitForTimeout(150);
    rec(b + ': model memakai huruf bahasanya', (await p.textContent('#eqK')).trim() === HARAP[b].eqK &&
        (await p.textContent('#eqL')).trim() === HARAP[b].eqL, (await p.textContent('#eqK')).trim());
    const r = await p.evaluate(() => window.__ar.ST.ratio), P = +(50 * r).toFixed(1);
    await p.fill('#inP', String(+(100 * r).toFixed(1))); await p.fill('#inL', '50'); await p.click('#btnCheck');
    await p.fill('#inP', String(P)); await p.fill('#inL', '50'); await p.click('#btnCheck');
    await p.fill('#inK', String(P + 50)); await p.click('#btnK');
    await p.fill('#inK', '7'); await p.click('#btnK');
    await p.fill('#inK', String(2 * P + 100)); await p.click('#btnK');
    const langkah = [
      ['maju', 'Board 80 by 50 cm, find it.', { soalA: '80', soalB: '50', soalJawab: '250' }, { soalTanya: 'K' }],
      [null, null, { soalJawab: '260' }, {}],
      ['mundur', 'Trim 300 cm and 50 cm wide.', { soalA: '80', soalB: '50', soalJawab: '5' }, { soalTahu: 'K', soalSisi: 'l' }],
      [null, null, { soalA: '300', soalJawab: '250' }, {}],
      [null, null, { soalJawab: '100' }, {}],
      [null, null, { soalA: '4000', soalB: '50', soalJawab: '7' }, { soalTahu: 'L' }],
      ['perubahan', 'Lengthen it by 10 cm please.', { soalA: '10', soalJawab: '10' }, { soalSisi: 'p', soalTanya: 'K' }],
      [null, null, { soalJawab: '20' }, {}],
      [null, null, { soalJawab: '3' }, { soalTanya: 'L' }],
      [null, null, { soalJawab: '500' }, {}]
    ];
    for (const [j, teks, isi, pil] of langkah) {
      if (j) await p.click('[data-soal="' + j + '"]');
      if (teks !== null) await p.fill('#soalTeks', teks);
      for (const [id, v] of Object.entries(pil)) await p.selectOption('#' + id, v);
      for (const [id, v] of Object.entries(isi)) await p.fill('#' + id, v);
      await p.click('#btnSoal');
    }
    await p.fill('#soalTeks', 'Changed after the check here.');
    await p.click('#btnKartu'); await p.waitForTimeout(400);
    await p.click('#btnBuatSimpan');
    await p.fill('#inSimpan', 'SMP2-XXXXX'); await p.click('#btnPakaiSimpan');
    await p.evaluate(() => { window.__waktu.TM.mulai = Date.now() - 16 * 60000; window.__waktu.render();
                             window.__waktu.TM.mulai = Date.now() - 25 * 60000; window.__waktu.render(); });
    const kartu = await p.evaluate(() => {
      const c = window.__kartu.gambar(), d = window.__kartu.baca(c).d;
      return { soal: d && d.soal, ok: d && d.soalOk, tgl: tanggalKartu(new Date(2026, 9, 21)) };
    });
    rec(b + ': pita kartu tetap terbaca (data tidak bergantung bahasa)', kartu.soal === 'perubahan' && kartu.ok === true);
    rec(b + ': tanggal kartu dalam bahasanya', kartu.tgl.includes(HARAP[b].bulan), kartu.tgl);
    const hil = await p.evaluate(() => Object.keys(JEJAK_BHS.hilang));
    rec(b + ': alur penuh Modul 2 tanpa satu pun kalimat terlewat', hil.length === 0, hil.slice(0, 2).join(' | ').slice(0, 120));
    await ctx.close();
  }

  // ================= Modul 1: alur penuh di tiap bahasa =================
  /* Huruf yang disebut soal mengikuti bahasa (LAMBANG1); huruf yang dipilih
     siswa sendiri (1.1) tetap bebas. Diagnosis teks bebas (1.4 dan Budi)
     membaca kata kunci Indonesia, jadi di bahasa lain ia DIAM: jawaban
     diterima, tidak ada kode M, tidak ada yang dicatat di Peta Miskonsepsi. */
  const HARAP1 = {
    en: { p: 'l', B: 'C', kotak: ['boxes', 'box'], satuan: 'single fish', peta: 'Misconception Map', bulan: 'Apr', jenis: 'Concept codes' },
    zh: { p: 'a', B: 'y', kotak: ['盒', '盒'], satuan: '单条鱼', peta: '误解地图', bulan: '4月', jenis: '概念代码' },
    ko: { p: 'a', B: 'y', kotak: ['상자', '상자'], satuan: '낱개 생선', peta: '오개념 지도', bulan: '4월', jenis: '개념 코드' }
  };
  // kata Indonesia yang tidak mungkin muncul di layar berbahasa lain
  const KATA_ID = /\b(yang|dengan|kamu|belum|sudah|tidak|untuk|dari|kotak|ikan|ekor|lembar|ruas|siswa|kode|kartu|jejak|lencana|selesai|benar|salah|Kegiatan|Pos)\b/;
  for (const b of BAHASA) {
    const { p, ctx } = await halaman('jejak-aljabar.html', b);
    const H = HARAP1[b];
    const isi = async (id, v) => {
      await p.fill('#' + id, v); await p.click('[data-check="' + id + '"]'); await p.waitForTimeout(60);
      return { cls: await p.getAttribute('#fb-' + id, 'class'), txt: await p.textContent('#fb-' + id) };
    };
    rec(b + ' M1: <html lang> dan judul ikut bahasa', await p.evaluate(() => document.documentElement.lang) !== 'id' &&
        !(await p.textContent('.hero h1')).includes('Huruf'));
    rec(b + ' M1: huruf soal mengikuti bahasa', JSON.stringify(await p.evaluate(() => [lambang1('p'), lambang1('B')])) ===
        JSON.stringify([H.p, H.B]) && (await p.textContent('#p1')).includes(H.p + ' cm'));
    await isi('q11', 'n');
    rec(b + ' M1: label penghitung jamak/tunggal', (await p.textContent('#lblBox')) === H.kotak[0] &&
        (await p.textContent('#lblLoose')) === H.satuan, (await p.textContent('#lblBox')) + ' / ' + (await p.textContent('#lblLoose')));
    await p.click('[data-adj="box:-1"]');
    rec(b + ' M1: satu kotak memakai bentuk tunggal', (await p.textContent('#lblBox')) === H.kotak[1]);
    await p.click('[data-adj="box:1"]');
    let r = await isi('q12', '7n');
    rec(b + ' M1: jawaban berstruktur tetap didiagnosis (7n → M2)', r.cls.includes('bad') && r.txt.includes('M2'));
    r = await isi('q12', '2n+5');
    rec(b + ' M1: 1.2 benar diterima', r.cls.includes('ok'));
    const f0 = await p.evaluate(() => JSON.stringify(__g.S.flags));
    r = await isi('q14', 'k itu singkatan dari kotak, jadi 3k artinya tiga kotak');
    rec(b + ' M1: 1.4 diam — diterima tanpa kode M, alasannya disebut', r.cls.includes('ok') && !/M\d/.test(r.txt) &&
        (await p.$('#fb-q14 .diag')) !== null && await p.evaluate(() => !!__g.S.done.q14), r.txt.slice(0, 60));
    rec(b + ' M1: 1.4 diam — Peta Miskonsepsi tidak berubah', await p.evaluate(() => JSON.stringify(__g.S.flags)) === f0);
    r = await isi('q15', '2' + H.p + '+160');
    rec(b + ' M1: 1.5 menerima huruf bahasanya (2' + H.p + ' + 160)', r.cls.includes('ok'));
    await p.click('[data-go="p2"]'); await p.waitForTimeout(200);
    await p.click('[data-op="sub2"]'); await p.waitForTimeout(150); await p.click('[data-op="div3"]'); await p.waitForTimeout(250);
    await isi('q22', '11');
    r = await isi('q23', '(' + H.B + '-25000)/2000');
    rec(b + ' M1: 2.2 rumus terbalik dengan huruf bahasanya', r.cls.includes('ok'));
    // Budi: kata-kata diterima apa adanya, hanya bukti angka yang diperiksa
    await p.click('[data-go="p3"]'); await p.waitForTimeout(200);
    const kirim = async t => { await p.fill('#budiIn', t); await p.click('#budiSend'); await p.waitForTimeout(220);
      return p.evaluate(() => document.querySelectorAll('#pips .on').length); };
    rec(b + ' M1: Budi memberi tahu bahwa kata-kata tidak dinilai', (await p.textContent('#chat')).includes(
        await p.evaluate(() => terj('Di bahasa ini Budi tidak menilai kata-katamu — ia menunggu kamu menjawab setiap poinnya. Hanya bukti angka yang tetap diperiksa.'))));
    const f1 = await p.evaluate(() => JSON.stringify(__g.S.flags));
    const a1 = await kirim('Both sides are just two ways of writing one value.');
    const a2 = await kirim('Then left and right may be swapped.');
    const a3 = await kirim('I have nothing more to say about it really.');
    rec(b + ' M1: Budi menerima argumen tanpa menilai kata, tetapi bukti angka tetap ditunggu',
        a1 === 1 && a2 === 2 && a3 === 2 && !(await p.evaluate(() => !!__g.S.done.budi_eq)), [a1, a2, a3].join(','));
    const a4 = await kirim('n = 8: 3 x 8 + 2 = 26 and the right side is 26.');
    rec(b + ' M1: bukti angka menuntaskan debat', a4 === 3 && await p.evaluate(() => !!__g.S.done.budi_eq));
    rec(b + ' M1: debat yang diam tidak mencatat kode M', await p.evaluate(() => JSON.stringify(__g.S.flags)) === f1);
    // Pos 4: lembar kerja, KODE JEJAK, kode simpan, kartu lapangan
    await p.click('[data-go="p4"]'); await p.waitForTimeout(200);
    await p.fill('#idNama', 'Test'); await p.evaluate(() => { window.print = () => {}; });
    await p.click('#btnPdf'); await p.waitForTimeout(200);
    rec(b + ' M1: lembar kerja ikut bahasa', (await p.textContent('#report')).includes(H.peta));
    await p.click('#btnKode'); await p.click('#btnDemo'); await p.click('#btnBaca'); await p.waitForTimeout(250);
    rec(b + ' M1: Panel Guru membaca kode kelas, label jenis ikut bahasa',
        (await p.textContent('[data-jenis="konsep"]')).startsWith(H.jenis) && (await p.$$('#kelasOut .kbar, #kelasOut table')).length > 0,
        await p.textContent('[data-jenis="konsep"]'));
    await p.click('#btnBuatSimpan'); await p.waitForTimeout(100);
    const kode = await p.textContent('#simpanBox');
    rec(b + ' M1: kode simpan dibuat', /^SMP1-/.test(kode), kode);
    const tgl = await p.evaluate(() => {
      const d = { id:1, statusUkur:2, selesai:{ cSub:false }, kDua:1, kLuas:1, kLain:1, miring:0.3, waktu:25, versi:3,
                  soal:'maju', soalOk:false, p:100, l:80, rasio:1.3, ukurUlang:2, hari:100, digeser:true };
      __lapangan.L.kartu = [d, Object.assign({}, d, { id:2, statusUkur:1, soal:'mundur', soalOk:true, waktu:31 }),
        Object.assign({}, d, { id:3, statusUkur:0, waktu:null, selesai:{ cSub:true }, kDua:0, kLuas:0, kLain:0 }),
        Object.assign({}, d, { id:4, soal:'perubahan', soalOk:true }), Object.assign({}, d, { id:5, soal:null })]
        .map(x => ({ d:x, url:'data:,' }));
      __lapangan.render();
      return tanggalKartu(100);
    });
    rec(b + ' M1: tanggal kartu lapangan dalam bahasanya', tgl.includes(H.bulan), tgl);
    await p.evaluate(() => __lapangan.terima([new File(['x'], 'a.png', { type:'image/png' })])); await p.waitForTimeout(300);
    const sisa = await p.evaluate(src => {
      const re = new RegExp(src), o = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
        { acceptNode: n => /SCRIPT|STYLE|TEXTAREA/.test(n.parentNode.nodeName) ? 2 : 1 });
      // jawaban siswa sendiri (1.4 diisi dalam bahasa Indonesia) boleh tampil apa adanya di lembar kerja
      let n; while ((n = w.nextNode())) if (re.test(n.nodeValue) && !n.nodeValue.includes('singkatan dari kotak')) o.push(n.nodeValue.trim().slice(0, 50));
      document.querySelectorAll('[placeholder],[title],[alt]').forEach(e => ['placeholder', 'title', 'alt'].forEach(a => {
        const v = e.getAttribute(a); if (v && re.test(v)) o.push('@' + a + ': ' + v.slice(0, 50)); }));
      return o;
    }, KATA_ID.source);
    rec(b + ' M1: tidak ada sisa kalimat Indonesia di layar (termasuk yang tersembunyi)', sisa.length === 0, sisa.slice(0, 3).join(' | '));
    const hil = await p.evaluate(() => Object.keys(JEJAK_BHS.hilang));
    rec(b + ' M1: alur penuh Modul 1 tanpa satu pun kalimat terlewat', hil.length === 0, hil.slice(0, 2).join(' | ').slice(0, 120));
    await ctx.close();
  }
  // Kode simpan & KODE JEJAK tidak bergantung bahasa
  {
    const { p, ctx } = await halaman('jejak-aljabar.html', 'ko');
    await p.fill('#q11', 'n'); await p.click('[data-check="q11"]');
    await p.fill('#q12', '7n'); await p.click('[data-check="q12"]');
    await p.fill('#q12', '2n+5'); await p.click('[data-check="q12"]');
    const snap = await p.evaluate(() => __snap()), kj = await p.evaluate(() => myCode());
    await p.evaluate(() => { location.hash = 'panelGuru'; }); await p.waitForTimeout(150);
    await p.click('#btnBuatSimpan'); await p.waitForTimeout(100);
    const kode = await p.textContent('#simpanBox');
    await ctx.close();
    const h2 = await halaman('jejak-aljabar.html', 'id');
    await h2.p.evaluate(() => { location.hash = 'panelGuru'; }); await h2.p.waitForTimeout(150);
    await h2.p.fill('#inSimpan', kode); await h2.p.click('#btnPakaiSimpan'); await h2.p.waitForTimeout(150);
    rec('kode simpan Modul 1 dari bahasa Korea dipulihkan utuh di bahasa Indonesia',
        await h2.p.evaluate(() => __snap()) === snap, kode);
    const kjId = await h2.p.evaluate(k => harvest('[07:10] Ani: ' + k).konsep.length, kj);
    rec('KODE JEJAK dari bahasa Korea terbaca di Panel Guru berbahasa Indonesia', kjId === 1, kj);
    await h2.ctx.close();
  }

  // ================= berganti bahasa di tengah kegiatan =================
  {
    const { p, ctx } = await halaman('ar-ukur.html');
    await p.click('#btnSim'); await p.waitForTimeout(150); await p.click('#btnDetect'); await p.waitForTimeout(150);
    await p.click('#btnLock'); await p.waitForTimeout(150);
    const r = await p.evaluate(() => window.__ar.ST.ratio), P = +(50 * r).toFixed(1);
    await p.fill('#inP', String(P)); await p.fill('#inL', '50'); await p.click('#btnCheck');
    await p.fill('#inK', String(2 * P + 100)); await p.click('#btnK');
    await p.click('[data-soal="mundur"]');
    await p.fill('#soalTeks', 'Lis 300 cm, lebar 50 cm. Panjangnya?');
    await p.fill('#soalA', '300'); await p.fill('#soalB', '50'); await p.fill('#soalJawab', '100');
    const sebelum = await p.evaluate(() => JSON.stringify({ xp: window.__g.G.xp, j: window.__ar.ST.jejak }));
    await p.click('#btnBahasa'); await p.click('[data-bahasa="en"]'); await p.waitForTimeout(200);
    rec('berganti bahasa tidak mengubah kemajuan maupun jejak pindaian',
        await p.evaluate(() => JSON.stringify({ xp: window.__g.G.xp, j: window.__ar.ST.jejak })) === sebelum);
    rec('isian soal yang belum diperiksa tetap ada setelah label diterjemahkan',
        (await p.inputValue('#soalA')) === '300' && (await p.inputValue('#soalB')) === '50' &&
        (await p.inputValue('#soalJawab')) === '100' && (await p.inputValue('#soalTeks')).startsWith('Lis 300'));
    rec('model yang sudah terkunci digambar ulang dengan huruf baru', (await p.textContent('#eqK')).includes('2l + 2w'));
    rec('pesan kamera (HUD) ditulis ulang dalam bahasa baru', (await p.textContent('#hud')).startsWith('Model locked'));
    rec('tombol jenis soal ikut bahasa, pilihan tetap ditandai', (await p.textContent('[data-soal="mundur"]')) === '✓ Backward');
    await p.click('#btnSoal');
    rec('pemeriksaan sesudah berganti bahasa tetap benar', (await p.getAttribute('#fb-soal', 'class')).includes('ok') &&
        (await p.textContent('#fb-soal')).includes('work backwards'));
    await ctx.close();
  }

  {
    // Modul 1: teks yang ditulis skrip ikut berganti, kemajuan tidak
    const { p, ctx } = await halaman('jejak-aljabar.html');
    await p.fill('#q11', 'n'); await p.click('[data-check="q11"]');
    await p.fill('#q12', '2n+5'); await p.click('[data-check="q12"]');
    await p.click('[data-go="p3"]'); await p.waitForTimeout(150);
    await p.click('[data-topic="konkat"]'); await p.waitForTimeout(150);
    await p.reload(); await p.waitForTimeout(300);
    const pulihId = await p.textContent('#restoreTxt');
    const sebelum = await p.evaluate(() => __snap());
    await p.click('#btnBahasa'); await p.click('[data-bahasa="en"]'); await p.waitForTimeout(200);
    rec('Modul 1: berganti bahasa tidak mengubah kemajuan', await p.evaluate(() => __snap()) === sebelum);
    rec('Modul 1: label kotak, progres pos, lencana MODE, dan keyakinan Budi digambar ulang',
        (await p.textContent('#lblBox')) === 'boxes' && (await p.textContent('[data-st="p1"]')) === '2 / 5 done' &&
        (await p.textContent('#aiBadge')) === 'OFFLINE MODE' && (await p.textContent('#budistate')) === 'still stubborn',
        [await p.textContent('#lblBox'), await p.textContent('[data-st="p1"]'), await p.textContent('#budistate')].join(' / '));
    const pulihEn = await p.textContent('#restoreTxt');
    rec('Modul 1: pesan pemulihan diterjemahkan dengan angka yang sama',
        pulihId.startsWith('Kemajuanmu dipulihkan') && pulihEn.startsWith('Your progress has been restored') &&
        JSON.stringify(pulihId.match(/\d+/g)) === JSON.stringify(pulihEn.match(/\d+/g)), pulihEn.slice(0, 60));
    rec('Modul 1: huruf pilihan siswa tetap di kotaknya', (await p.inputValue('#q11')) === 'n');
    await ctx.close();
  }

  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
