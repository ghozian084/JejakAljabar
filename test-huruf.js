const { chromium } = require('playwright');
/* Jalur berkas dihitung dari letak berkas uji ini, bukan ditulis keras.
   Sebelumnya jalurnya dipaku ke satu direktori, sehingga uji langsung patah
   begitu proyek dipindah ke komputer lain. */
const BASE = "file://" + __dirname + "/";

(async () => {
  const b = await chromium.launch();
  const R = []; const rec = (n,ok,x)=>R.push((ok?'PASS  ':'**FAIL**  ')+n+(x?'  → '+x:''));

  // ---------- MODUL 1 ----------
  const p1 = await b.newPage(); const e1=[];
  p1.on('pageerror', e => e1.push(e.message));
  await p1.goto(BASE + 'jejak-aljabar.html'); await p1.waitForTimeout(500);
  await p1.fill('#q11','p'); await p1.click('[data-check="q11"]'); await p1.waitForTimeout(200);
  const S = await p1.evaluate(()=>({nBox:window.__g.S.nBox, nLoose:window.__g.S.nLoose, letter:window.__g.S.letter}));
  rec('1.1 huruf p tersimpan', S.letter==='p');
  // jawaban benar tapi huruf lain
  await p1.fill('#q12', S.nBox+'a+'+S.nLoose); await p1.click('[data-check="q12"]'); await p1.waitForTimeout(200);
  let t = await p1.textContent('#fb-q12'), c = await p1.getAttribute('#fb-q12','class');
  rec('M1: huruf lain, struktur benar → DITERIMA', c.includes('ok'), t.replace(/\s+/g,' ').slice(0,70));
  rec('M1: pergantian huruf disebut', /hurufnya bebas/.test(t));
  rec('M1: 1.2 tercatat tuntas', await p1.evaluate(()=>!!window.__g.S.done.q12));
  // huruf lain DAN salah
  await p1.fill('#q12','a+1'); await p1.click('[data-check="q12"]'); await p1.waitForTimeout(200);
  t = await p1.textContent('#fb-q12'); c = await p1.getAttribute('#fb-q12','class');
  rec('M1: huruf lain + struktur salah → tetap ditolak', c.includes('bad'), t.replace(/\s+/g,' ').slice(0,70));
  // konkatenasi dengan huruf pilihan tetap M2
  await p1.fill('#q12', (S.nBox+S.nLoose)+'p'); await p1.click('[data-check="q12"]'); await p1.waitForTimeout(200);
  rec('M1: konkatenasi tetap didiagnosis M2', (await p1.textContent('#fb-q12')).includes('M2'));
  rec('M1: tanpa error konsol', e1.filter(x=>!/CSP|Content Security/i.test(x)).length===0, e1.join('|').slice(0,80));

  // ---------- MODUL 3 ----------
  const p3 = await b.newPage(); const e3=[];
  p3.on('pageerror', e => e3.push(e.message));
  await p3.goto(BASE + 'latihan.html'); await p3.waitForTimeout(500);
  // cari soal bertipe ekspresi (bukan pilih/num) lalu jawab dengan huruf lain
  const hasil = await p3.evaluate(async () => {
    const W = window.__lt;
    for(let ui=0; ui<6; ui++){
      for(let lv=0; lv<4; lv++){
        W.mulaiLevel(ui, lv);
        for(let t=0; t<12; t++){
          const it = W.L.cur;
          if(it && it.type !== "pilih" && it.type !== "num" && it.vars && it.vars.length){
            const asing = "abcdefghijklmnopqrstuvwxyz".split("")
              .filter(c => it.vars.indexOf(c) < 0)[0];
            const nyawaSblm = W.L.nyawa;
            const salahSblm = W.P.salahUnit[W.L.code] || 0;
            document.getElementById("jwb").value = String(it.ans).replace(/\*/g,"")
              .replace(new RegExp(it.vars[0],"g"), asing);
            W.cek();
            const fb = document.getElementById("fb");
            return { ketemu:true, kelas:fb.className, teks:fb.textContent.replace(/\s+/g," "),
                     nyawaSama: W.L.nyawa === nyawaSblm,
                     tanpaCatat: (W.P.salahUnit[W.L.code]||0) === salahSblm,
                     vars: it.vars.join(","), asing:asing };
          }
          W.lanjut && W.lanjut();
        }
      }
    }
    return { ketemu:false };
  });
  rec('M3: menemukan soal ekspresi', hasil.ketemu, hasil.vars ? 'huruf soal '+hasil.vars+' → dijawab '+hasil.asing : '');
  rec('M3: huruf asing TIDAK dinilai salah', !/\bbad\b/.test(hasil.kelas||''), (hasil.teks||'').slice(0,60));
  rec('M3: huruf asing tidak memotong nyawa', !!hasil.nyawaSama);
  rec('M3: huruf asing tidak dicatat sebagai miskonsepsi', !!hasil.tanpaCatat);
  rec('M3: pesannya menyebut huruf soal', /Hurufnya belum sama/.test(hasil.teks||''));
  rec('M3: tanpa error konsol', e3.length===0, e3.join('|').slice(0,80));

  // ---------- MODUL 4: kebijakan huruf bebas ----------
  const p4 = await b.newPage(); const e4=[];
  p4.on('pageerror', e => e4.push(e.message));
  await p4.goto(BASE + 'ar-ekspresi.html'); await p4.waitForTimeout(400);
  const coba = (sq,ci,tulis,hb) => p4.evaluate(([sq,ci,tulis,hb])=>{
    ST.sq=sq; ST.ci=ci; ST.scanned=true; ST.mode='baca'; MI.i=99;
    document.getElementById('huruf').value=hb;
    document.getElementById('jwb').value=tulis; cekTulis();
    const el=document.getElementById('fb-jawab');
    return { kelas:el.className, teks:el.textContent.replace(/\s+/g,' '), huruf:document.getElementById('huruf').value };
  },[sq,ci,tulis,hb]);
  let r;
  r = await coba(2,5,'2a+5','n');
  rec('M4: huruf lain diterima', r.kelas.includes('ok'), r.teks.slice(0,60));
  rec('M4: kotak huruf ikut siswa', r.huruf==='a');
  r = await coba(2,5,'5+2a','n'); rec('M4: urutan dibalik diterima', r.kelas.includes('ok'));
  r = await coba(1,4,'a+4','n');  rec('M4: koefisien 1 tanpa angka', r.kelas.includes('ok'));
  r = await coba(0,6,'6','n');    rec('M4: tanpa kotak diterima', r.kelas.includes('ok'));
  r = await coba(2,5,'7a','n');   rec('M4: konkatenasi huruf lain tetap M2', /M2/.test(r.teks));
  r = await coba(2,5,'7','n');    rec('M4: penjumlahan jadi angka tetap M1', /M1/.test(r.teks));
  r = await coba(2,5,'2a+5b','n');rec('M4: dua huruf ditolak', r.kelas.includes('bad') && /kedua/.test(r.teks));
  r = await coba(2,5,'3a+5','n'); rec('M4: angka meleset disebut bagiannya', /meleset/.test(r.teks));
  r = await coba(2,5,'kotak dua','n'); rec('M4: tak terbaca diberi contoh bentuk', /belum terbaca/.test(r.teks));
  rec('M4: tanpa error konsol', e4.length===0, e4.join('|').slice(0,80));

  await b.close();
  const gagal = R.filter(x=>x.startsWith('**FAIL**')).length;
  console.log(R.join('\n'));
  console.log('\nGAGAL: ' + gagal + ' / ' + R.length);
  process.exitCode = gagal ? 1 : 0;
})();
