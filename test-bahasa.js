const { chromium } = require('playwright');
const fs = require('fs');

/* Bahasa: pemilih, kelengkapan kamus, dan Modul 2 di keempat bahasa.
   Teks sumber tetap bahasa Indonesia di dalam kode; kamus memetakannya.
   Uji ini memastikan TIDAK ADA kalimat yang lolos tanpa terjemahan —
   baik yang ditulis di kode (terj/tandai/hud) maupun di markup (data-t). */
const BASE = "file://" + __dirname + "/";
const HALAMAN = ['index.html', 'ar-ukur.html'];      // halaman yang sudah diterjemahkan
const BAHASA = ['en', 'zh', 'ko'];
// terjemahan yang memang sama dengan sumbernya
const BOLEH_SAMA = new Set(['Model', '☰ Menu', 'Jejak Aljabar']);

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
const ph = x => (x.match(/\{\w+\}/g) || []).sort().join(',');
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
    rec('modul 1, 3, 4 diberi catatan "masih berbahasa Indonesia"', JSON.stringify(await p.$$eval('[data-bhs-belum]',
        x => x.map(e => !e.classList.contains('hide')))) === '[true,true,true]');
    rec('tidak ada catatan untuk Modul 2 yang sudah diterjemahkan', (await p.$$('#c2 [data-bhs-belum]')).length === 0);
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

  console.log(R.join('\n'));
  console.log('\nerror konsol: ' + (errs.length ? '\n' + errs.join('\n') : 'tidak ada'));
  console.log('\nGAGAL: ' + R.filter(r => r.startsWith('**')).length + ' / ' + R.length);
  await browser.close();
})();
