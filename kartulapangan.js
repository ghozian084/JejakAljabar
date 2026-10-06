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

   Riwayat format:
     v1  110 bit, tata "lama"  — jejak pindaian
     v2  115 bit, tata "lama"  — + menit kerja (5 bit)
     v3  118 bit, tata "soal"  — + soal buatan siswa (3 bit)
   Sandi dibentuk per 5 bit, jadi 118 bit = 24 simbol + 2 checksum = 130
   sel — tidak muat di pita 4 baris (128 sel). Karena itu v3 memakai kartu
   yang lebih tinggi dengan pita 5 baris (160 sel; sisa 6 simbol).
   Tata letak dikenali dari RASIO gambar, jadi kartu lama tetap terbaca.
   ===================================================================== */
const KARTU = {
  W:720, SEL:18, KOL:33, PX:63,  // kolom 0 = sel acuan, kolom 1–32 = data
  TATA:{
    lama:{ H:1040, PY:924,  BAR:4, versi:[1, 2] },
    soal:{ H:1210, PY:1076, BAR:5, versi:[3] }
  },
  AWALAN:"KL2", TANDA:167, VERSI:3,
  SIMBOL:{ 1:24, 2:25, 3:26 },   // panjang sandi per versi, termasuk checksum
  BATAS_MENIT:20                 // waktu kerja lapangan; Modul 2 dan Panel Guru sepakat di sini
};
KARTU.SEKARANG = KARTU.TATA.soal;  // tata letak yang ditulis Modul 2
KARTU.H = KARTU.SEKARANG.H;
const KARTU_LANGKAH = ["cScan","cModel","cMeasure","cSub"];
const KARTU_SOAL = ["", "maju", "mundur", "perubahan"];   // indeks = nilai 2 bit di pita

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
  // soal: jenis (0 = belum membuat) dan apakah kunci jawabannya konsisten dengan model
  w.put(Math.max(0, KARTU_SOAL.indexOf(d.soal || "")), 2).put(d.soalOk ? 1 : 0, 1);
  // "KL2-XXXXX-…" → deretan simbol saja; awalan tidak ikut digambar
  return w.selesai(KARTU.AWALAN).slice(KARTU.AWALAN.length).replace(/-/g, "");
}
function kartuBacaSandi(simbol){
  const r = BitBaca(KARTU.AWALAN + simbol, KARTU.AWALAN);
  if(!r) return null;
  if(r.get(8) !== KARTU.TANDA) return null;
  const versi = r.get(4);
  if(versi < 1 || versi > KARTU.VERSI) return "versi";
  /* Versi yang terbaca harus cocok dengan panjang potongannya. Tanpa ini,
     kartu v2 yang dipotong ke panjang v1 bisa lolos checksum secara
     kebetulan (1 dari 1024) lalu terbaca dengan bit waktu yang hilang. */
  if(KARTU.SIMBOL[versi] !== simbol.length) return null;
  const d = { versi:versi, id:r.get(20), selesai:{} };
  KARTU_LANGKAH.forEach(function(k){ d.selesai[k] = !!r.get(1); });
  d.rasio = r.get(11) / 100; d.miring = r.get(7) / 100;
  d.p = r.get(14) / 10; d.l = r.get(14) / 10;
  d.statusUkur = r.get(2); d.ukurUlang = r.get(4);
  d.kDua = r.get(3); d.kLuas = r.get(3); d.kLain = r.get(3);
  d.digeser = !!r.get(1); d.hari = r.get(12);
  d.waktu = null; d.soal = ""; d.soalOk = false;
  if(versi >= 2){ const t = r.get(5); d.waktu = t === 0 ? null : t - 1; }
  if(versi >= 3){ d.soal = KARTU_SOAL[r.get(2)]; d.soalOk = !!r.get(1); }
  return d;
}

/* Kolom acuan berselang hitam-putih: pembaca mengambil ambang dari sini,
   bukan dari angka tetap, karena kecerahan JPEG hasil pampatan bergeser. */
function kartuGambarPita(x, simbol, tata){
  tata = tata || KARTU.SEKARANG;
  const S = KARTU.SEL, lebar = KARTU.KOL * S, tinggi = tata.BAR * S;
  x.fillStyle = "#000";
  x.fillRect(KARTU.PX - 2*S, tata.PY - 2*S, lebar + 4*S, tinggi + 4*S);
  x.fillStyle = "#fff";
  x.fillRect(KARTU.PX - S, tata.PY - S, lebar + 2*S, tinggi + 2*S);
  const bit = [];
  for(let i = 0; i < simbol.length; i++){
    const v = B32S.indexOf(simbol[i]);
    for(let j = 4; j >= 0; j--) bit.push(Math.floor(v / Math.pow(2, j)) % 2);
  }
  x.fillStyle = "#000";
  for(let b = 0; b < tata.BAR; b++){
    if(b % 2 === 0) x.fillRect(KARTU.PX, tata.PY + b*S, S, S);
    for(let k = 1; k < KARTU.KOL; k++){
      const i = b * (KARTU.KOL - 1) + (k - 1);
      if(bit[i]) x.fillRect(KARTU.PX + k*S, tata.PY + b*S, S, S);
    }
  }
}

/* sumber: Image/canvas apa pun. Hasil: {d} atau {alasan}. */
function kartuBacaGambar(sumber){
  const w = sumber.naturalWidth || sumber.width, h = sumber.naturalHeight || sumber.height;
  if(!w || !h) return { alasan:"kosong" };
  let tata = null;
  for(const n in KARTU.TATA){
    const minta = KARTU.W / KARTU.TATA[n].H;
    if(Math.abs(w / h - minta) / minta <= 0.03) tata = KARTU.TATA[n];
  }
  if(!tata) return { alasan:"rasio" };
  const c = document.createElement("canvas");
  c.width = KARTU.W; c.height = tata.H;
  const x = c.getContext("2d", {willReadFrequently:true});
  x.drawImage(sumber, 0, 0, KARTU.W, tata.H);
  const S = KARTU.SEL;
  const piksel = x.getImageData(KARTU.PX, tata.PY, KARTU.KOL * S, tata.BAR * S);
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
  // Dihitung terpisah: dengan 5 baris ada 3 sel acuan hitam dan 2 putih.
  let hitam = 0, putih = 0, nh = 0, np = 0;
  for(let b = 0; b < tata.BAR; b++){
    if(b % 2 === 0){ hitam += terang(0, b); nh++; } else { putih += terang(0, b); np++; }
  }
  hitam /= nh; putih /= np;
  if(putih - hitam < 80) return { alasan:"kontras" };
  const ambang = (hitam + putih) / 2, bit = [];
  for(let b = 0; b < tata.BAR; b++)
    for(let k = 1; k < KARTU.KOL; k++) bit.push(terang(k, b) < ambang ? 1 : 0);
  let simbol = "";
  for(let i = 0; i + 5 <= bit.length; i += 5){
    let v = 0;
    for(let j = 0; j < 5; j++) v = v * 2 + bit[i + j];
    simbol += B32S[v];
  }
  /* Panjang sandi tetap per versi, jadi bisa dipotong pasti tanpa penanda
     akhir. Setiap versi milik tata letak ini dicoba; kartu lama tetap
     terbaca. "versi" hanya untuk kartu yang LEBIH BARU dari pembaca ini. */
  let versiBaru = false;
  for(const v of tata.versi){
    const d = kartuBacaSandi(simbol.slice(0, KARTU.SIMBOL[v]));
    if(d === "versi") versiBaru = true;
    else if(d) return { d:d };
  }
  // Versi mendatang bisa lebih panjang: cari sandi sah di panjang yang belum dikenal.
  for(let n = KARTU.SIMBOL[KARTU.VERSI] + 1; n <= simbol.length && !versiBaru; n++)
    if(kartuBacaSandi(simbol.slice(0, n)) === "versi") versiBaru = true;
  return { alasan: versiBaru ? "versi" : "sandi" };
}
