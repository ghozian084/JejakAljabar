const { chromium } = require('playwright');
/* Jalur berkas dihitung dari letak berkas uji ini, bukan ditulis keras.
   Sebelumnya jalurnya dipaku ke satu direktori, sehingga uji langsung patah
   begitu proyek dipindah ke komputer lain. */
const BASE = "file://" + __dirname + "/";

(async () => {
  const b = await chromium.launch();
  const R=[]; const rec=(n,ok,x)=>R.push((ok?'PASS  ':'**FAIL**  ')+n+(x?'  → '+x:''));
  const errs=[];
  const p = await b.newPage({ viewport:{width:1160,height:1000} });
  p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });

  // --- keadaan kosong ---
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(400);
  rec('menu terbuka tanpa error', errs.length===0, errs.join('|').slice(0,70));
  rec('empat simpul peta terbentuk', (await p.$$eval('.node', n=>n.length))===4);
  rec('empat kartu modul ada', (await p.$$eval('.mod', n=>n.length))===4);
  rec('keadaan kosong: ajakan mulai', (await p.textContent('#summary')).includes('belum dimulai'));
  rec('tombol berbunyi "Mulai"', (await p.textContent('#g1'))==='Mulai');
  for(const [id,href] of [['c1','jejak-aljabar.html'],['c2','ar-ukur.html'],['c3','latihan.html'],['c4','ar-ekspresi.html']])
    rec('tautan '+id+' benar', (await p.getAttribute('#'+id,'href'))===href);

  // --- isi kemajuan palsu ---
  await p.evaluate(()=>{
    localStorage.setItem('jejak.modul1.v1', JSON.stringify({v:1,xp:120,
      done:{q11:1,q12:1,q13:1,q14:1,q15:1},badges:{a:1,b:1,c:1}}));
    localStorage.setItem('jejak.modul2.v1', JSON.stringify({v:1,xp:65,
      done:{cScan:1,cModel:1,cMeasure:1,cSub:1},badges:{a:1,b:1}}));
    localStorage.setItem('jejak.modul3.v1', JSON.stringify({v:1,xp:200,
      cleared:{a:1,b:1,c:1,d:1,e:1,f:1}}));
    localStorage.setItem('jejak.modul4.v1', JSON.stringify({v:1,xp:44,
      selesai:{0:1,1:1},badges:{x:1}}));
  });
  await p.reload(); await p.waitForTimeout(400);
  rec('total jejak dijumlahkan', (await p.textContent('#summary')).includes('429'),
      (await p.textContent('#summary')).replace(/\s+/g,' ').slice(0,60));
  rec('M1 progres 5/10', (await p.textContent('#m1a')).includes('5 dari 10'));
  rec('M2 tuntas → "Buka lagi"', (await p.textContent('#g2'))==='Buka lagi');
  rec('M2 simpul jadi centang', (await p.$$eval('.node text', t=>t.map(x=>x.textContent))).includes('✓'));
  rec('M3 mahkota 6/24', (await p.textContent('#m3a')).includes('6 dari 24'));
  rec('M4 "Lanjutkan"', (await p.textContent('#g4'))==='Lanjutkan');
  rec('lencana dijumlahkan 6', (await p.textContent('#summary')).includes('6/29'));
  const w = await p.evaluate(()=>document.getElementById('b1').style.width);
  rec('bar M1 = 50%', w==='50%', w);

  // --- versi tidak dikenal diabaikan ---
  await p.evaluate(()=>localStorage.setItem('jejak.modul1.v1', JSON.stringify({v:9,xp:9999})));
  await p.reload(); await p.waitForTimeout(300);
  rec('simpanan versi lain tidak ditafsirkan', !(await p.textContent('#summary')).includes('9999'));
  // --- data rusak ---
  await p.evaluate(()=>localStorage.setItem('jejak.modul2.v1','{rusak'));
  await p.reload(); await p.waitForTimeout(300);
  rec('data rusak tidak mematikan menu', (await p.$$eval('.mod',n=>n.length))===4);

  // --- hapus dua langkah ---
  await p.evaluate(()=>{ localStorage.setItem('jejak.modul3.v1', JSON.stringify({v:1,xp:5,cleared:{a:1}})); });
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btnReset'); await p.waitForTimeout(120);
  rec('hapus butuh dua tekan', (await p.textContent('#btnReset')).includes('Yakin'));
  rec('sekali tekan belum menghapus', await p.evaluate(()=>!!localStorage.getItem('jejak.modul3.v1')));
  await p.click('#btnReset'); await p.waitForTimeout(900);
  rec('tekan kedua menghapus semua', await p.evaluate(()=>
    !localStorage.getItem('jejak.modul1.v1') && !localStorage.getItem('jejak.modul3.v1')));

  // --- penyimpanan diblokir ---
  const p2 = await b.newPage();
  await p2.addInitScript(()=>{ Object.defineProperty(window,'localStorage',{get(){ throw new Error('diblokir'); }}); });
  const e2=[]; p2.on('pageerror', e=>e2.push(e.message));
  await p2.goto(BASE + 'index.html'); await p2.waitForTimeout(350);
  rec('penyimpanan diblokir: menu tetap utuh', (await p2.$$eval('.mod',n=>n.length))===4 && e2.length===0, e2.join('|').slice(0,60));
  rec('penyimpanan diblokir: dijelaskan ke pengguna', (await p2.textContent('#summary')).includes('diblokir'));

  // --- tautan balik dari tiap modul ---
  for(const f of ['jejak-aljabar.html','ar-ukur.html','latihan.html','ar-ekspresi.html']){
    const q = await b.newPage(); await q.goto(BASE + ''+f); await q.waitForTimeout(400);
    rec('tautan Menu ada di '+f, (await q.$$eval('a[href="index.html"]', a=>a.length))>0);
    await q.close();
  }
  // --- tautan Panel Guru: panelnya ada di Pos 4 yang tersembunyi sampai dibuka ---
  {
    const q = await b.newPage({ viewport:{width:1160,height:1000} });
    await q.goto(BASE + 'index.html'); await q.waitForTimeout(300);
    await q.click('a[href="jejak-aljabar.html#panelGuru"]'); await q.waitForTimeout(500);
    rec('tautan Panel Guru membuka panelnya, bukan Pos 1', await q.isVisible('#panelGuru'));
    rec('membuka Panel Guru tidak membuka kunci pos lain', await q.evaluate(()=>
      window.__g.G.openAll===false && document.querySelector('[data-go="p3"]').disabled===true));
    await q.close();
  }
  await b.close();
  const gagal = R.filter(x=>x.startsWith('**FAIL**')).length;
  console.log(R.join('\n')); console.log('\nGAGAL: '+gagal+' / '+R.length);
  process.exitCode = gagal?1:0;
})();
