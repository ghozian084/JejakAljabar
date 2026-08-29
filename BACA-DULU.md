# Bekal pindah ke Claude Code

## Langkah pertama

```bash
unzip jejak-aljabar-bekal.zip -d jejak-aljabar
cd jejak-aljabar
git init && git add -A && git commit -m "Pindahan dari Cowork — 368 uji lolos"
npm install
npx playwright install chromium
claude
```

`CLAUDE.md` sudah ada di folder ini. Claude Code membacanya otomatis setiap sesi baru —
jadi aturan proyek, pipeline build, dan daftar bug yang pernah terjadi langsung terbawa.
**Jangan jalankan `/init`**, itu akan menimpanya.

## Kalimat pembuka untuk sesi pertama

> Baca CLAUDE.md. Ini media pembelajaran aljabar untuk lomba KMPM 2026. Jalankan
> `npm test` dulu untuk memastikan 368 uji masih lolos, lalu laporkan hasilnya.

## Yang TIDAK ikut pindah

- Riwayat percakapan Cowork — tidak ada fitur impor.
- Dokumen di claude.ai Project — Claude Code tidak bisa membacanya. Kalau perlu, salin
  isinya ke `docs/` di folder ini.

## Isi paket

| | |
|---|---|
| 5 berkas HTML | media siap pakai — simpan dalam satu folder |
| `partA/B/C`, `head3`, `tail3`, `engine.js` | sumber untuk 2 berkas hasil gabungan |
| 7 berkas uji | 368 uji, 0 gagal |
| `tema-css.txt`, `tema-js.txt` | cuplikan tema (disalin ke tiap berkas, bukan ditaut) |
| `makalah/` | makalah lomba + skrip pembentuk Word |
| `CLAUDE.md` | aturan proyek — dibaca Claude Code otomatis |

## Ingat

`jejak-aljabar.html` dan `latihan.html` adalah **hasil gabungan**. Menyuntingnya langsung
akan hilang saat build berikutnya. Sunting sumbernya, lalu `npm run build`.
