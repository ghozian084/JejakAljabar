#!/usr/bin/env python3
"""Memasang sistem tema ke setiap berkas media.

Langkah:
  1. Blok :root lama diganti seluruhnya oleh blok tema (yang lama sudah
     rusak karena ikut tersapu jadi rujukan-diri).
  2. Skrip pra-lukis disisipkan di <head> — supaya halaman tidak berkedip
     putih dulu sebelum tema gelap terpasang.
  3. Wadah tombol tema disisipkan pada tempat yang ditentukan per berkas.
  4. Cuplikan JS tema disisipkan sebelum </body>.
"""
import io, re, sys

CSS = io.open("/home/claude/tema-css.txt", encoding="utf-8").read()
JS  = io.open("/home/claude/tema-js.txt", encoding="utf-8").read()

PRALUKIS = """<script>
/* Dipasang sebelum halaman dilukis. Kalau tema dibaca setelah halaman
   tampil, pengguna tema Malam akan melihat kedipan putih lebih dulu. */
(function(){try{var v=localStorage.getItem("jejak.tema.v1");
if(v==="laut"||v==="malam"||v==="kontras")document.documentElement.setAttribute("data-tema",v);}catch(e){}})();
</script>
"""

# Tempat wadah tombol tema per berkas: (jangkar, sisipan)
TITIK = {
  "partB.html": (
    '<a class="modelink" href="index.html">☰ Menu</a>',
    '<a class="modelink" href="index.html">☰ Menu</a>\n      <span class="temaWrap noprint" id="temaWrap"></span>'
  ),
  "ar-ukur.html": (
    '<a class="backlink" href="index.html">☰ Menu</a>',
    '<a class="backlink" href="index.html">☰ Menu</a>\n    <span class="temaWrap noprint" id="temaWrap"></span>'
  ),
  "ar-ekspresi.html": (
    '<a class="backlink" href="index.html">☰ Menu</a>',
    '<a class="backlink" href="index.html">☰ Menu</a>\n    <span class="temaWrap noprint" id="temaWrap"></span>'
  ),
  "head3.html": (
    '<a class="backlink" href="index.html">☰ Menu</a>',
    '<a class="backlink" href="index.html">☰ Menu</a>\n    <span class="temaWrap noprint" id="temaWrap"></span>'
  ),
  "index.html": (
    '  <div class="summary" id="summary" aria-live="polite"></div>',
    '  <div class="temabar"><span class="temaWrap" id="temaWrap"></span></div>\n'
    '  <div class="summary" id="summary" aria-live="polite"></div>'
  ),
}

def pasang(nama, path_css, path_js=None):
    path = "/home/claude/" + nama
    s = io.open(path, encoding="utf-8").read()

    # 1. ganti blok :root
    m = re.search(r"^:root\{.*?^\}", s, re.S | re.M)
    assert m, nama + ": blok :root tidak ditemukan"
    s = s[:m.start()] + CSS.strip() + s[m.end():]

    # 2. skrip pra-lukis — tepat sesudah </style> pertama
    if path_css:
        i = s.index("</style>") + len("</style>")
        s = s[:i] + "\n" + PRALUKIS + s[i:]

    # 3. wadah tombol
    jangkar, ganti = TITIK[nama]
    assert jangkar in s, nama + ": jangkar tombol tema tidak ditemukan"
    s = s.replace(jangkar, ganti, 1)

    # 4. cuplikan JS
    if path_js:
        assert "</body>" in s, nama + ": </body> tidak ditemukan"
        s = s.replace("</body>", "<script>\n" + JS.strip() + "\n</script>\n</body>", 1)

    io.open(path, "w", encoding="utf-8").write(s)
    print("ok:", nama)

# partA memuat <style> & :root; partB memuat header; partC memuat </body>
pasang("partA.html", path_css=True,  path_js=False)
pasang("partB.html", path_css=False, path_js=False)   # hanya wadah tombol
pasang("head3.html", path_css=True,  path_js=False)   # </body> ada di tail3
pasang("ar-ukur.html",     path_css=True, path_js=True)
pasang("ar-ekspresi.html", path_css=True, path_js=True)
pasang("index.html",       path_css=True, path_js=True)

# Catatan: sapu-warna.py dan pasang-tema.py adalah skrip SEKALI PAKAI yang sudah
# dijalankan. Keduanya masih memuat jalur /home/claude dan tidak perlu dijalankan lagi.
# Disertakan hanya sebagai jejak bagaimana sistem tema dipasang.
