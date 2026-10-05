# JEJAK ALJABAR — media pembelajaran aljabar SMP

Konteks: karya untuk KMPM 2026 (Kompetisi Media Pembelajaran Matematika, Gema Mahasiswa
Matematika, HIMATIKA UPI). Penulis: Muhammad Ghozian Kafi Ahsan, guru matematika di
Semesta Bilingual Boarding School, Semarang.

Bahasa kerja: **Bahasa Indonesia**. Komentar kode, umpan balik siswa, dan pesan uji semuanya
berbahasa Indonesia. Jangan menulis komentar baru dalam bahasa Inggris.

---

## Aturan yang tidak boleh dilanggar

1. **Tanpa pustaka pihak ketiga.** Tidak ada CDN, tidak ada npm di sisi klien. Satu berkas
   HTML per modul, berjalan dari `file://` maupun HTTPS.
2. **Tanpa `eval` dan `new Function`.** Sistem pengelolaan pembelajaran sekolah menyajikan
   bahan di dalam bingkai ber-Content-Security-Policy ketat, dan keduanya diblokir di sana.
   Pernah terjadi: seluruh pemeriksa aljabar diam-diam mengembalikan NaN, jawaban benar
   siswa dinyatakan salah. Penilai ekspresi ditulis sendiri (tokenizer + recursive descent).
3. **Tanpa peladen, tanpa akun, tanpa kunci API.** Data siswa tidak pernah meninggalkan
   perangkat. Kunci API di dalam HTML sisi klien adalah kunci yang bocor.
4. **Setiap akses `localStorage` dibungkus try/catch.** Penyimpanan bisa ditolak sepenuhnya
   (mode penyamaran, kebijakan perangkat sekolah, iframe). Media harus tetap hidup.
5. **Warna tidak pernah berdiri sendiri.** Setiap penanda status wajib disertai label teks
   atau lambang.
6. **Kata "lepas" dilarang.** Istilah resminya "ikan satuan". Kata "lepas" terbaca sebagai
   "dikurangi" oleh siswa.

---

## Pipeline build — WAJIB dibaca sebelum menyunting

Dua berkas adalah **hasil gabungan**, bukan sumber. Menyuntingnya langsung akan hilang
pada build berikutnya.

```bash
# Modul 1
cat partA.html partB.html partC.html > jejak-aljabar.html
#   partA = CSS   |  partB = markup  |  partC = logika

# Modul 3
cat head3.html engine.js tail3.html > latihan.html
#   head3 = CSS+header  |  engine.js = mesin aljabar + GEN  |  tail3 = logika level
```

Berkas yang disunting langsung (bukan hasil gabungan):
`index.html`, `ar-ukur.html`, `ar-ekspresi.html`

Setelah menyunting `partA/partB/partC` atau `head3/tail3`, **selalu jalankan ulang cat**
sebelum menjalankan uji.

`npm run build` menjalankan kedua `cat` di atas, lalu menyalin kelima berkas media ke
`public/` — direktori keluaran yang diminta Vercel. `public/` dibentuk ulang tiap build dan
tidak dilacak git. Uji tetap membaca berkas di akar, bukan di `public/`.

`vercel.json` mengulang perintah itu secara eksplisit (`buildCommand` + `outputDirectory`)
karena pengaturan dasbor Vercel bisa menimpa autodeteksi `npm run build`. Kalau langkah
build diubah, **ubah di kedua tempat**: `package.json` dan `vercel.json`.

---

## Menjalankan uji

```bash
npm i -D playwright && npx playwright install chromium   # sekali saja
for f in test.js test-ar.js test-latihan.js test-ekspresi.js \
         test-huruf.js test-menu.js test-tema.js test-kartu.js; do
  printf "%-19s " "$f"; node $f | grep "^GAGAL:"
done
```

Keadaan sekarang: **412 uji, 0 gagal.**

| Berkas uji | Cakupan | Lolos |
|---|---|---|
| `test.js` | Modul 1 | 111 |
| `test-ar.js` | Modul 2 | 32 |
| `test-latihan.js` | Modul 3 | 47 |
| `test-ekspresi.js` | Modul 4 | 53 |
| `test-huruf.js` | Kebijakan huruf lintas modul | 24 |
| `test-menu.js` | Menu utama | 30 |
| `test-tema.js` | Tema warna + kontras WCAG | 73 |
| `test-kartu.js` | Kartu lapangan: Modul 2 → Panel Guru | 42 |

**Setiap perubahan wajib menjalankan kedelapannya**, bukan hanya yang terkait. Sudah beberapa
kali perubahan di satu modul merusak modul lain.

---

## Peta berkas

| Berkas | Isi |
|---|---|
| `index.html` | Menu utama. Membaca kemajuan keempat modul, **tidak pernah menulis** ke sana. |
| `jejak-aljabar.html` | Modul 1 · Jejak Aljabar — 4 pos, Budi, Panel Guru (KODE JEJAK + kartu lapangan), Lembar Kerja PDF |
| `ar-ukur.html` | Modul 2 · Petualangan Lapangan — pindai papan mading, siswa mengukur, kartu hasil untuk guru |
| `latihan.html` | Modul 3 · Jelajah Enam Rimba — 6 unit × 4 level, mekanik nyawa |
| `ar-ekspresi.html` | Modul 4 · Bengkel Kartu — 8 misi dua arah, lembar kartu cetak |
| `kodesimpan.js` | Cuplikan bersama: bit-packing → Crockford base32 + checksum |
| `kartulapangan.js` | Cuplikan bersama: pita data hitam-putih di kartu hasil Modul 2. **Disalin** ke `ar-ukur.html` dan `partC.html`; `test-kartu.js` memastikan salinannya sama persis |
| `tema-css.txt` / `tema-js.txt` | Cuplikan tema, **disalin** ke tiap berkas (bukan ditaut) |
| `sapu-warna.py` / `pasang-tema.py` | Skrip sekali pakai untuk memasang sistem tema |
| `makalah/` | Makalah lomba (docx-js). `isi.js` = naskah, `buat.js` = pembentuk Word |

---

## Taksonomi M1–M6 — objek bersama

Satu taksonomi dipakai empat kali: mesin diagnostik mengklasifikasi, Budi memerankan,
pembangkit soal membangkitkan, KODE JEJAK menyandikan. **Jangan pernah dibuat terpisah
per modul.**

| Kode | Nama | Contoh |
|---|---|---|
| M1 | Variabel sebagai label | `3k` dibaca "3 kotak" |
| M2 | Konkatenasi | `2 + 3n` disederhanakan jadi `5n` |
| M3 | Tanda = sebagai perintah | "=" dibaca "hasilnya" |
| M4 | Pindah ruas tanpa operasi | suku dipindah sambil ganti tanda |
| M5 | Urutan pengurangan terbalik | "5 kurang dari y" → `5 − y` |
| M6 | Huruf bernilai tunggal | `n` dianggap satu angka rahasia |

---

## Keputusan desain yang harus dipertahankan

**Kamera memberi STRUKTUR, siswa memberi BESARAN.** Kamera tunggal tidak bisa membedakan
papan kecil yang dekat dari papan besar yang jauh. Keterbatasan itu adalah mesin didaktisnya.
Kalau AR diberi kemampuan mengukur otomatis, **variabelnya mati**.

**Poin diberikan untuk pemulihan, bukan untuk ketepatan.** Memperbaiki kekeliruan dibayar
lebih mahal daripada benar sejak awal. Kalau lapisan permainan membayar untuk "benar",
seluruh argumen media runtuh sendiri.

**Huruf itu bebas, strukturnya yang tidak.** Di Modul 1 & 4 huruf dipilih siswa → huruf lain
DITERIMA. Di Modul 3 huruf berasal dari soal → ditolak, tetapi **tanpa memotong nyawa dan
tanpa mencatat kode M**. Prinsipnya: media yang mendiagnosis harus lebih memilih diam
daripada menuduh keliru.

**Kartu lapangan membawa foto utuh — itu keputusan penulis, dengan sadar.** Foto tidak muat
di KODE JEJAK, jadi datanya yang dititipkan ke dalam gambar: pita kotak 18 px berisi sandi
KODE SIMPAN biasa, tahan pampatan JPEG WhatsApp. Siswa diingatkan memeriksa pratinjau
(jangan ada wajah teman). Panel Guru **tidak pernah menyimpan** kartu — hanya di memori.
Jejak di kartu bersifat **per pindaian** (`ST.jejak`), bukan kemajuan seumur `G`.

**Arah latihan Modul 4 ditentukan misi, bukan dipilih siswa.** Kalau boleh memilih, hampir
semua siswa bertahan di arah "kamera membaca → aku menulis". Arah sebaliknya justru yang
jarang dilatih di kelas.

---

## Dua hal yang KEBAL TEMA — jangan diubah

1. **Lembar kartu cetak Modul 4 (`#lembar`)** — kartu harus hitam pekat di atas kertas
   putih. Pengenal kartu bergantung pada kontras itu. Ada 12 uji di `test-tema.js` yang
   memastikan latarnya tetap `rgb(255,255,255)` dan kartunya `rgb(0,0,0)` di keempat tema.
2. **Blok `@media print`** — mencetak selalu memakai tema Kertas. Tema gelap memboroskan
   tinta dan membuat Lembar Kerja PDF sulit dibaca guru.

---

## Bug yang pernah terjadi — jangan diulang

1. `new Function` mati di CSP ketat → seluruh pemeriksa aljabar diam-diam NaN.
2. Detektor Modul 2 mengunci bingkai gambar (piksel batas bernilai nol setelah blur).
   Perbaikan: `Float32Array.from(g)` sebelum blur + sempadan 3 piksel.
3. Kode M1–M6 ditampilkan tetapi tidak pernah didaftarkan ke peta, padahal umpan baliknya
   menjanjikan "dicatat di Peta Miskonsepsi".
4. Jawaban benar berhuruf lain didiagnosis M2 — **salah diagnosis**, lebih merusak daripada
   salah menilai.
5. Warna amber `#c97a10` hanya 3,35:1 di atas kartu putih (di bawah WCAG AA). Digelapkan
   ke `#a8630c`. Baru ketahuan ketika pemeriksa kontras dijalankan.
6. `say(id, kind, html, diagCode)` — argumen keempat adalah **kode M**, bukan prosa.
   Memasukkan kalimat penjelasan ke sana menyebabkan TypeError.
7. Skrip patch Python yang `assert`-nya gagal di tengah → tidak ada satu pun suntingan
   tersimpan. Selalu periksa hasilnya setelah menjalankan skrip patch.
8. Tautan `jejak-aljabar.html#panelGuru` dari menu utama mendarat di Pos 1 — Panel Guru ada
   di Pos 4 yang tersembunyi. Kini `bukaPanelDariHash()` menampilkan Pos 4 tanpa membuka
   kunci pos lain.
9. `say()` di Modul 1 **mencatat setiap pesan ke `LOG`** — riwayat jawaban siswa yang
   disimpan ke localStorage. Panel kartu lapangan versi pertama memakainya, sehingga pesan
   untuk guru (lengkap dengan nama berkas foto WhatsApp) ikut tersimpan sebagai riwayat siswa.
   Pesan untuk guru memakai `lapanganKata()`, yang tidak menyentuh penyimpanan.

---

## Yang masih menggantung

- **Belum pernah diuji ke siswa sungguhan.** Angka 77% (Modul 2) dan 99% (Modul 4) berasal
  dari simulasi, bukan lapangan.
- Modul 2 belum punya Lembar Kerja PDF sendiri.
- Visual 3D dari `im02.html` (rangka bambu, Joglo) belum dipindahkan.
- **Makalah perlu diselaraskan dengan kartu lapangan.** `makalah/isi.js` menyatakan media
  "tidak memindahkan data peserta didik ke luar perangkat"; kartu lapangan mengirim foto
  lewat WhatsApp atas pilihan siswa. Klaim itu perlu dirumuskan ulang.
