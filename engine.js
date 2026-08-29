function prep(raw){
  if(raw == null) return "";
  let t = String(raw).toLowerCase().trim();
  t = t.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, ".").replace(/−/g, "-");
  t = t.replace(/(\d)(?=[a-z(])/g, "$1*");        // 3x -> 3*x
  t = t.replace(/\)(?=[\da-z(])/g, ")*");         // )( -> )*(
  t = t.replace(/([a-z])(?=\()/g, "$1*");         // x( -> x*(
  t = t.replace(/([a-z])(?=[a-z])/g, "$1*");      // xy -> x*y
  return t;
}
const SAFE = /^[0-9a-z+\-*/().^]*$/;
function tokenize(src){
  const out = []; let i = 0;
  while(i < src.length){
    const c = src[i];
    if(c === " "){ i++; continue; }
    if((c >= "0" && c <= "9") || c === "."){
      let j = i;
      while(j < src.length && ((src[j] >= "0" && src[j] <= "9") || src[j] === ".")) j++;
      const v = parseFloat(src.slice(i, j));
      if(isNaN(v)) return null;
      out.push({t:"num", v:v}); i = j; continue;
    }
    if(c >= "a" && c <= "z"){ out.push({t:"var", v:c}); i++; continue; }
    if("+-*/^()".indexOf(c) >= 0){ out.push({t:c}); i++; continue; }
    return null;
  }
  return out;
}
function evalTokens(toks, vals){
  let pos = 0;
  const eat = t => (toks[pos] && toks[pos].t === t) ? (pos++, true) : false;
  function primary(){
    const tk = toks[pos];
    if(!tk) throw 0;
    if(tk.t === "num"){ pos++; return tk.v; }
    if(tk.t === "var"){ pos++; if(!(tk.v in vals)) throw 0; return vals[tk.v]; }
    if(tk.t === "("){ pos++; const v = expr(); if(!eat(")")) throw 0; return v; }
    throw 0;
  }
  function power(){ const b = primary(); return eat("^") ? Math.pow(b, unary()) : b; }
  function unary(){ if(eat("-")) return -unary(); if(eat("+")) return unary(); return power(); }
  function term(){ let v = unary(); for(;;){ if(eat("*")) v *= unary(); else if(eat("/")) v /= unary(); else return v; } }
  function expr(){ let v = term(); for(;;){ if(eat("+")) v += term(); else if(eat("-")) v -= term(); else return v; } }
  const r = expr();
  if(pos !== toks.length) throw 0;
  return r;
}
function evalAt(src, vals){
  const toks = tokenize(src);
  if(!toks || !toks.length) return NaN;
  try{
    const r = evalTokens(toks, vals);
    return (typeof r === "number" && isFinite(r)) ? r : NaN;
  }catch(e){ return NaN; }
}
function equiv(a, b, names){
  const A = prep(a), B = prep(b);
  if(!A || !SAFE.test(A) || !SAFE.test(B)) return false;
  const pts = [[2,3],[5,7],[11,4],[-3,6],[0.5,2.25],[9,-2]];
  let ok = 0;
  for(const p of pts){
    const vals = {};
    names.forEach((n, i) => { vals[n] = p[i % p.length] * (i ? 1.7 : 1) + i; });
    const x = evalAt(A, vals), y = evalAt(B, vals);
    if(isNaN(x) || isNaN(y)) return false;
    if(Math.abs(x - y) > 1e-9 * Math.max(1, Math.abs(y))) return false;
    ok++;
  }
  return ok === pts.length;
}
function numOf(raw){
  const t = prep(raw);
  if(!t || !SAFE.test(t)) return NaN;
  return evalAt(t, {});
}

/* =====================================================================
   PEMBANGKIT SOAL — 6 kode miskonsepsi × 3 tingkat.
   Setiap kerangka menghasilkan angka acak, jadi soalnya tidak pernah
   habis dan urutannya tidak bisa dihafal.
   ===================================================================== */
const TAXO = {
  M1:{ name:"Variabel sebagai label" },
  M2:{ name:"Konkatenasi / menolak jawaban terbuka" },
  M3:{ name:"Tanda = sebagai perintah hitung" },
  M4:{ name:"Pindah ruas tanpa operasi" },
  M5:{ name:"Urutan pengurangan terbalik" },
  M6:{ name:"Huruf bernilai tunggal & tetap" }
};
const ORDER = ["M1","M2","M3","M4","M5","M6"];
const HURUF = ["k","n","x","p","m","b","t","y"];
function ri(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

const GEN = {
  M1: [
    () => { const h = pick(HURUF), a = ri(2,7);
      return { q:"Satu kotak bandeng berisi <b>" + h + "</b> ekor ikan — jumlahnya belum diketahui. " +
                 "Tulis ekspresi untuk isi <b>" + a + " kotak</b>.",
               type:"alg", vars:[h], ans:a + "*" + h,
               why:"Yang dikalikan adalah <i>isi</i> satu kotak, bukan kata “kotak”. " + a + h +
                    " berarti " + a + " × " + h + "." }; },
    () => { const h = pick(HURUF), a = ri(2,6), b = ri(2,9);
      return { q:"Kamu membeli <b>" + a + " kotak</b> (isi satu kotak = <b>" + h + "</b> ekor) " +
                 "ditambah <b>" + b + " ikan satuan</b>. Tulis ekspresi untuk total ikannya.",
               type:"alg", vars:[h], ans:a + "*" + h + "+" + b,
               why:"Ikan satuan sudah terhitung, isi kotak belum. Keduanya berdiri berdampingan — " +
                    "tidak boleh dipaksa menyatu." }; },
    () => { const a = ri(3,8), h = pick(["m","s","b"]);
      return { q:"Apa arti <span class='math'>" + a + h + "</span> ?",
               type:"pilih",
               opts:[ a + " benda yang namanya diawali huruf " + h,
                      a + " dikali nilai yang diwakili " + h,
                      "huruf " + h + " yang diulang " + a + " kali",
                      a + " ditambah " + h ],
               ans:1,
               why:"Huruf dalam aljabar selalu mewakili sebuah <b>bilangan</b>, bukan singkatan nama benda. " +
                    "Menempelkan angka pada huruf berarti perkalian." }
    }
  ],
  M2: [
    () => { const h = pick(HURUF), a = ri(2,8), b = ri(2,9);
      return { q:"Sederhanakan bila bisa: <span class='math'>" + a + h + " + " + b + h + "</span>",
               type:"alg", vars:[h], ans:(a+b) + "*" + h,
               why:"Keduanya suku sejenis — sama-sama kelipatan " + h + " — jadi memang boleh digabung." }; },
    () => { const h = pick(HURUF), a = ri(2,9), b = ri(2,8);
      return { q:"Sederhanakan bila bisa: <span class='math'>" + a + " + " + b + h + "</span>",
               type:"alg", vars:[h], ans:a + "+" + b + "*" + h,
               why:"Ini <b>tidak bisa</b> disederhanakan. " + a + " adalah bilangan yang sudah diketahui, " +
                    b + h + " belum. Bentuk terbuka seperti ini sudah merupakan jawaban akhir — " +
                    "tulis ulang apa adanya." }; },
    () => { const h = pick(HURUF), a = ri(2,6), b = ri(2,9), c = ri(2,6), d = ri(2,9);
      return { q:"Sederhanakan: <span class='math'>" + a + h + " + " + b + " + " + c + h + " + " + d + "</span>",
               type:"alg", vars:[h], ans:(a+c) + "*" + h + "+" + (b+d),
               why:"Gabungkan yang sejenis saja: " + a + h + " dengan " + c + h + ", lalu " + b + " dengan " + d +
                    ". Dua kelompok itu tetap tidak boleh saling digabung." }
    }
  ],
  M3: [
    () => { const h = pick(HURUF), a = ri(2,6), b = ri(2,9), n = ri(2,9);
      const c = a*n + b;
      return { q:"Benar atau salah: <span class='math'>" + c + " = " + a + h + " + " + b + "</span> " +
                 "punya arti yang sama dengan <span class='math'>" + a + h + " + " + b + " = " + c + "</span>.",
               type:"pilih", opts:["Benar, keduanya sama saja","Salah, jawaban harus selalu di kanan"],
               ans:0,
               why:"Tanda = menyatakan bahwa dua ruas <b>bernilai sama</b>. Karena sama, urutannya boleh dibalik. " +
                    "Kalau = berarti “hasilnya”, membalik urutan jadi terasa aneh — dan itulah salah pahamnya." }; },
    () => { const a = ri(3,9), b = ri(2,8);
      return { q:"Diketahui <span class='math'>a = b</span>. Isi titik-titik: " +
                 "<span class='math'>a + " + a + " = ___ + " + a + "</span>",
               type:"alg", vars:["b"], ans:"b",
               why:"Kalau dua hal bernilai sama, keduanya boleh saling menggantikan di mana pun." }; },
    () => { const a = ri(2,5), b = ri(2,7), n = ri(2,8);
      const c = a*n + b;
      return { q:"Manakah pembacaan yang tepat untuk <span class='math'>" + a + "n + " + b + " = " + c + "</span> ?",
               type:"pilih",
               opts:["Hitung " + a + "n + " + b + ", hasilnya " + c,
                     a + "n + " + b + " dan " + c + " adalah dua cara menulis bilangan yang sama",
                     c + " adalah jawaban dari soal di sebelah kiri"],
               ans:1,
               why:"Tanda = bukan perintah menghitung, melainkan pernyataan bahwa kedua ruas senilai. " +
                    "Dari situlah kita boleh mengerjakan apa pun asal <i>kedua ruas</i> diperlakukan sama." }
    }
  ],
  M4: [
    () => { const h = pick(HURUF), b = ri(3,15), n = ri(2,14);
      return { q:"Selesaikan: <span class='math'>" + h + " + " + b + " = " + (n+b) + "</span>. " +
                 "Berapa nilai <span class='math'>" + h + "</span> ?",
               type:"num", ans:n,
               why:"Kurangi <b>kedua ruas</b> dengan " + b + ". Bukan “memindahkan " + b + " lalu ganti tanda” — " +
                    "yang terjadi sebenarnya adalah operasi yang sama dikenakan pada dua sisi." }; },
    () => { const h = pick(HURUF), a = ri(2,7), b = ri(2,12), n = ri(2,12);
      return { q:"Selesaikan: <span class='math'>" + a + h + " + " + b + " = " + (a*n+b) + "</span>. " +
                 "Berapa nilai <span class='math'>" + h + "</span> ?",
               type:"num", ans:n,
               why:"Urutannya kebalikan dari cara rumus itu dibangun: lepas dulu yang <i>terakhir</i> " +
                    "ditambahkan (−" + b + " di kedua ruas), baru lepas pengalinya (÷" + a + " di kedua ruas)." }; },
    () => { const a = ri(2,6), b = ri(3,20);
      return { q:"Ubah rumus <span class='math'>y = " + a + "x + " + b + "</span> menjadi bentuk " +
                 "<span class='math'>x = …</span> (tulis dalam huruf y).",
               type:"alg", vars:["y"], ans:"(y-" + b + ")/" + a,
               why:"Kurangi kedua ruas dengan " + b + ", lalu bagi kedua ruas dengan " + a + ". " +
                    "Ingat kurungnya: seluruh <span class='math'>y − " + b + "</span> yang dibagi, bukan " + b + " saja." }
    }
  ],
  M5: [
    () => { const h = pick(HURUF), b = ri(2,15);
      return { q:"Tulis dalam bentuk aljabar: “<b>" + b + " kurang dari " + h + "</b>”.",
               type:"alg", vars:[h], ans:h + "-" + b,
               why:"“" + b + " kurang dari " + h + "” berarti " + h + " dikurangi " + b + ". " +
                    "Urutan kata dalam bahasa Indonesia terbalik dari urutan tulisannya — di sinilah jebakannya." }; },
    () => { const h = pick(HURUF), b = ri(1000,9000);
      return { q:"Harga sebuah barang <span class='math'>" + h + "</span> rupiah. Kamu mendapat potongan " +
                 "<b>Rp " + b.toLocaleString("id-ID") + "</b>. Tulis ekspresi harga yang kamu bayar.",
               type:"alg", vars:[h], ans:h + "-" + b,
               why:"Potongan mengurangi harga, jadi harga yang dikurangi — bukan sebaliknya. " +
                    "Kalau ditulis terbalik, hasilnya negatif dan tidak masuk akal." }; },
    () => { const h = pick(HURUF), a = ri(2,6), b = ri(3,14);
      return { q:"Tulis dalam bentuk aljabar: “<b>" + b + " kurang dari " + a + " kali " + h + "</b>”.",
               type:"alg", vars:[h], ans:a + "*" + h + "-" + b,
               why:"Kerjakan bertahap: “" + a + " kali " + h + "” dulu → " + a + h +
                    ", baru “" + b + " kurang dari” itu → " + a + h + " − " + b + "." }
    }
  ],
  M6: [
    () => { const h = pick(HURUF), a = ri(2,7), b = ri(2,12), v = ri(2,12);
      return { q:"Jika <span class='math'>" + h + " = " + v + "</span>, berapa nilai " +
                 "<span class='math'>" + a + h + " + " + b + "</span> ?",
               type:"num", ans:a*v + b,
               why:"Nilai " + h + " dititipkan ke dalam ekspresi. Ekspresinya sendiri tidak berubah." }; },
    () => { const h = pick(HURUF), a = ri(2,6), b = ri(2,10), v1 = ri(2,9), v2 = ri(10,20);
      return { q:"Ekspresi <span class='math'>" + a + h + " + " + b + "</span> dihitung dua kali: " +
                 "sekali dengan <span class='math'>" + h + " = " + v1 + "</span>, sekali dengan " +
                 "<span class='math'>" + h + " = " + v2 + "</span>. Berapa <b>selisih</b> kedua hasilnya?",
               type:"num", ans:Math.abs(a*v2 - a*v1),
               why:"Yang berubah hanya bagian " + a + h + ". Angka " + b + " tetap, jadi ia tidak menyumbang " +
                    "selisih sama sekali — selisihnya " + a + " × " + Math.abs(v2-v1) + "." }; },
    () => { const h = pick(HURUF), a = ri(2,6), b = ri(2,9);
      return { q:"Benar atau salah: dalam <span class='math'>" + a + h + " + " + b + "</span>, huruf " +
                 "<span class='math'>" + h + "</span> hanya boleh bernilai satu angka tertentu.",
               type:"pilih", opts:["Benar, setiap huruf menyimpan satu angka rahasia",
                                   "Salah, huruf itu menampung berapa pun nilainya"],
               ans:1,
               why:"Huruf bukan kotak berisi satu angka rahasia. Ia menampung <i>berapa pun</i> — itulah " +
                    "sebabnya satu ekspresi bisa dipakai untuk banyak keadaan sekaligus." }
    }
  ]
};

