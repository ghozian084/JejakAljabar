
/* =====================================================================
   KODE SIMPAN — memindahkan kemajuan antar perangkat
   Bukan enkripsi. Tujuannya memindahkan, bukan mengamankan: siswa bisa
   memotretnya, menuliskannya, atau mengirimnya lewat WhatsApp, lalu
   menempelkannya di HP lain.

   Alfabet Crockford (tanpa I, L, O, U) supaya salah baca tulisan tangan
   tidak menghasilkan kode lain yang kebetulan sah. Checksum dua karakter
   bergaya Fletcher — menangkap salah ketik satu karakter maupun dua
   karakter yang tertukar posisinya.
   ===================================================================== */
const B32S = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function BitTulis(){ this.b = []; }
BitTulis.prototype.put = function(v, n){
  v = Math.max(0, Math.min(Math.floor(v) || 0, Math.pow(2, n) - 1));
  for(let i = n - 1; i >= 0; i--) this.b.push(Math.floor(v / Math.pow(2, i)) % 2);
  return this;
};
BitTulis.prototype.selesai = function(awalan){
  const b = this.b.slice();
  while(b.length % 5) b.push(0);
  let s = "";
  for(let i = 0; i < b.length; i += 5){
    let v = 0;
    for(let j = 0; j < 5; j++) v = v * 2 + b[i + j];
    s += B32S[v];
  }
  let c1 = 0, c2 = 0;
  for(let i = 0; i < s.length; i++){ c1 = (c1 + B32S.indexOf(s[i])) % 32; c2 = (c2 + c1) % 32; }
  s += B32S[c1] + B32S[c2];
  return awalan + "-" + (s.match(/.{1,5}/g) || []).join("-");
};

function BitBaca(teks, awalan){
  let t = String(teks).toUpperCase().replace(/[^0-9A-Z]/g, "");
  if(t.indexOf(awalan) !== 0) return null;
  t = t.slice(awalan.length).replace(/[IL]/g, "1").replace(/O/g, "0").replace(/U/g, "V");
  if(t.length < 4) return null;
  const isi = t.slice(0, -2), cs = t.slice(-2);
  if(isi.split("").some(c => B32S.indexOf(c) < 0)) return null;
  let c1 = 0, c2 = 0;
  for(let i = 0; i < isi.length; i++){ c1 = (c1 + B32S.indexOf(isi[i])) % 32; c2 = (c2 + c1) % 32; }
  if(B32S[c1] + B32S[c2] !== cs) return null;               // checksum gagal
  const bits = [];
  for(let i = 0; i < isi.length; i++){
    const v = B32S.indexOf(isi[i]);
    for(let j = 4; j >= 0; j--) bits.push(Math.floor(v / Math.pow(2, j)) % 2);
  }
  let pos = 0;
  return { get:function(n){
    let v = 0;
    for(let i = 0; i < n; i++) v = v * 2 + (bits[pos++] || 0);
    return v;
  } };
}
