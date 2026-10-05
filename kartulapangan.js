/* =====================================================================
   KARTU LAPANGAN — membawa jejak Modul 2 ke Panel Guru lewat gambar
   Foto tidak muat di dalam KODE JEJAK, jadi arahnya dibalik: datanya yang
   dititipkan ke dalam gambar. Di bawah kartu ada pita kotak hitam-putih
   yang isinya sandi KODE SIMPAN biasa (BitTulis/BitBaca, checksum yang
   sama), satu sel per bit.

   Kenapa kotak besar, bukan metadata PNG: WhatsApp memampatkan foto ke
   JPEG dan membuang metadata. Sel 18 px hitam pekat di atas putih tetap
   terbaca walau gambarnya dipampatkan atau diperkecil separuh.

   Cuplikan ini DISALIN ke ar-ukur.html (menulis) dan partC.html
   (membaca), bukan ditaut. Uji memastikan ketiga salinan sama persis.
   Membutuhkan BitTulis/BitBaca dari kodesimpan.js.

   Versi 2 menambah 5 bit waktu kerja. Isinya kini 115 bit = 23 simbol
   + 2 checksum = 25 simbol = 125 dari 128 sel. PITA SUDAH PENUH: kolom
   baru berarti menambah baris dan menggeser tata letak kartu.
   ===================================================================== */
const KARTU = {
  W:720, H:1040,                 // ukuran kartu; pembaca menolak rasio lain
  SEL:18, KOL:33, BAR:4,         // kolom 0 = sel acuan, kolom 1–32 = data
  PX:63, PY:924,                 // sudut kiri atas sel (0,0); bingkai berakhir di y 1032
  AWALAN:"KL2", TANDA:167, VERSI:2,
  SIMBOL:{ 1:24, 2:25 },         // panjang sandi per versi, termasuk checksum
  BATAS_MENIT:20                 // waktu kerja lapangan; Modul 2 dan Panel Guru sepakat di sini
};
const KARTU_LANGKAH = ["cScan","cModel","cMeasure","cSub"];

function kartuSandi(d){
  const w = new BitTulis();
  w.put(KARTU.TANDA, 8).put(KARTU.VERSI, 4).put(d.id, 20);
  KARTU_LANGKAH.forEach(function(k){ w.put(d.selesai[k] ? 1 : 0, 1); });
  w.put(Math.round(d.rasio * 100), 11).put(Math.round(d.miring * 100), 7);
  w.put(Math.round(d.p * 10), 14).put(Math.round(d.l * 10), 14);
  w.put(d.statusUkur, 2).put(d.ukurUlang, 4);
  w.put(d.kDua, 3).put(d.kLuas, 3).put(d.kLain, 3);
  w.put(d.digeser ? 1 : 0, 1).put(d.hari, 12);
  // waktu: 0 = penghitung tidak dipakai; 1–31 = menit + 1 (31 berarti 30 menit atau lebih)
  w.put(d.waktu === null || d.waktu === undefined ? 0 : Math.min(31, d.waktu + 1), 5);
  // "KL2-XXXXX-…" → deretan simbol saja; awalan tidak ikut digambar
  return w.selesai(KARTU.AWALAN).slice(KARTU.AWALAN.length).replace(/-/g, "");
}
function kartuBacaSandi(simbol){
  const r = BitBaca(KARTU.AWALAN + simbol, KARTU.AWALAN);
  if(!r) return null;
  if(r.get(8) !== KARTU.TANDA) return null;
  const versi = r.get(4);
  /* Versi yang terbaca harus cocok dengan panjang potongannya. Tanpa ini,
     kartu v2 yang dipotong ke panjang v1 bisa lolos checksum secara
     kebetulan (1 dari 1024) lalu terbaca dengan bit waktu yang hilang. */
  if(KARTU.SIMBOL[versi] !== simbol.length) return null;
  if(versi !== KARTU.VERSI) return "versi";
  const d = { id:r.get(20), selesai:{} };
  KARTU_LANGKAH.forEach(function(k){ d.selesai[k] = !!r.get(1); });
  d.rasio = r.get(11) / 100; d.miring = r.get(7) / 100;
  d.p = r.get(14) / 10; d.l = r.get(14) / 10;
  d.statusUkur = r.get(2); d.ukurUlang = r.get(4);
  d.kDua = r.get(3); d.kLuas = r.get(3); d.kLain = r.get(3);
  d.digeser = !!r.get(1); d.hari = r.get(12);
  const t = r.get(5); d.waktu = t === 0 ? null : t - 1;
  return d;
}

/* Kolom acuan berselang hitam-putih: pembaca mengambil ambang dari sini,
   bukan dari angka tetap, karena kecerahan JPEG hasil pampatan bergeser. */
function kartuGambarPita(x, simbol){
  const S = KARTU.SEL, lebar = KARTU.KOL * S, tinggi = KARTU.BAR * S;
  x.fillStyle = "#000";
  x.fillRect(KARTU.PX - 2*S, KARTU.PY - 2*S, lebar + 4*S, tinggi + 4*S);
  x.fillStyle = "#fff";
  x.fillRect(KARTU.PX - S, KARTU.PY - S, lebar + 2*S, tinggi + 2*S);
  const bit = [];
  for(let i = 0; i < simbol.length; i++){
    const v = B32S.indexOf(simbol[i]);
    for(let j = 4; j >= 0; j--) bit.push(Math.floor(v / Math.pow(2, j)) % 2);
  }
  x.fillStyle = "#000";
  for(let b = 0; b < KARTU.BAR; b++){
    if(b % 2 === 0) x.fillRect(KARTU.PX, KARTU.PY + b*S, S, S);
    for(let k = 1; k < KARTU.KOL; k++){
      const i = b * (KARTU.KOL - 1) + (k - 1);
      if(bit[i]) x.fillRect(KARTU.PX + k*S, KARTU.PY + b*S, S, S);
    }
  }
}

/* sumber: Image/canvas apa pun. Hasil: {d} atau {alasan}. */
function kartuBacaGambar(sumber){
  const w = sumber.naturalWidth || sumber.width, h = sumber.naturalHeight || sumber.height;
  if(!w || !h) return { alasan:"kosong" };
  const rasioMinta = KARTU.W / KARTU.H;
  if(Math.abs(w / h - rasioMinta) / rasioMinta > 0.03) return { alasan:"rasio" };
  const c = document.createElement("canvas");
  c.width = KARTU.W; c.height = KARTU.H;
  const x = c.getContext("2d", {willReadFrequently:true});
  x.drawImage(sumber, 0, 0, KARTU.W, KARTU.H);
  const S = KARTU.SEL;
  const piksel = x.getImageData(KARTU.PX, KARTU.PY, KARTU.KOL * S, KARTU.BAR * S);
  // rata-rata kecerahan separuh tengah sel — tepi sel kabur karena pampatan
  function terang(k, b){
    let jml = 0, n = 0;
    for(let yy = Math.round(S*.25); yy < Math.round(S*.75); yy++)
      for(let xx = Math.round(S*.25); xx < Math.round(S*.75); xx++){
        const o = ((b*S + yy) * piksel.width + (k*S + xx)) * 4;
        jml += piksel.data[o]*.299 + piksel.data[o+1]*.587 + piksel.data[o+2]*.114; n++;
      }
    return jml / n;
  }
  let hitam = 0, putih = 0;
  for(let b = 0; b < KARTU.BAR; b++){ if(b % 2 === 0) hitam += terang(0, b); else putih += terang(0, b); }
  hitam /= KARTU.BAR / 2; putih /= KARTU.BAR / 2;
  if(putih - hitam < 80) return { alasan:"kontras" };
  const ambang = (hitam + putih) / 2, bit = [];
  for(let b = 0; b < KARTU.BAR; b++)
    for(let k = 1; k < KARTU.KOL; k++) bit.push(terang(k, b) < ambang ? 1 : 0);
  let simbol = "";
  for(let i = 0; i + 5 <= bit.length; i += 5){
    let v = 0;
    for(let j = 0; j < 5; j++) v = v * 2 + bit[i + j];
    simbol += B32S[v];
  }
  /* Panjang sandi tetap per versi, jadi bisa dipotong pasti tanpa penanda
     akhir. Panjang versi lama ikut dicoba: tanpa itu checksum kartu lama
     gagal dan guru diberi tahu "pita rusak", padahal kartunya utuh —
     hanya dibuat oleh versi media sebelumnya. */
  let versiLain = false;
  for(const v in KARTU.SIMBOL){
    const d = kartuBacaSandi(simbol.slice(0, KARTU.SIMBOL[v]));
    if(d === "versi") versiLain = true;
    else if(d) return { d:d };
  }
  return { alasan: versiLain ? "versi" : "sandi" };
}
