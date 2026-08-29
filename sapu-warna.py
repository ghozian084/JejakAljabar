#!/usr/bin/env python3
"""Menyapu warna keras di dalam <style> menjadi variabel peran.

Yang SENGAJA tidak disapu:
  - aturan #lembar (lembar kartu cetak Modul 4). Kartunya harus hitam pekat
    di atas kertas putih; pengenal kartu bergantung pada kontras itu. Kalau
    ikut berganti tema, hasil cetaknya rusak dan deteksinya gagal.
  - blok @media print. Mencetak tema gelap memboroskan tinta dan membuat
    Lembar Kerja PDF tidak terbaca.
"""
import io, re, sys

PETA = {
  "#ffffff": "var(--card)",  "#fff": "var(--card)",
  "#faf7f2": "var(--paper)",
  "#1f2a2e": "var(--ink)",
  "#5b6b70": "var(--ink-soft)",
  "#66737a": "var(--ink-mute)", "#96a2a8": "var(--ink-mute)", "#3d5157": "var(--ink-mute)",
  "#e3ddd2": "var(--line)",
  "#cfc6b6": "var(--line-strong)",

  "#fffdf9": "var(--surf)",  "#fdfaf4": "var(--surf)",  "#fbf9f5": "var(--surf)",
  "#fbf8f3": "var(--surf)",  "#f7f4ee": "var(--surf)",  "#f7f4ec": "var(--surf)",
  "#f6f1e8": "var(--surf2)", "#f5f1e9": "var(--surf2)", "#f2ede4": "var(--surf2)",
  "#f0ece4": "var(--surf2)", "#efeae1": "var(--surf2)", "#efe8db": "var(--surf2)",
  "#e9e3d9": "var(--surf2)",
  "#ece4d6": "var(--surf3)",
  "#a9a296": "var(--mute)",
  "#26302f": "var(--stage)",

  "#14776f": "var(--teal)",  "#e6f4f2": "var(--teal-bg)",
  "#0d5a54": "var(--teal-ink)", "#bfe0dc": "var(--teal-line)", "#1a9d92": "var(--teal-lite)",

  "#c97a10": "var(--amber)", "#fdf3e2": "var(--amber-bg)",
  "#8a5407": "var(--amber-ink)", "#9c5c07": "var(--amber-ink)",
  "#7a4c07": "var(--amber-ink)", "#5f3b05": "var(--amber-ink)",
  "#e2a851": "var(--amber-line)", "#f0dfc0": "var(--amber-line)",
  "#ffd08a": "var(--amber-soft)", "#f0ddbd": "var(--amber-soft)",
  "#e8d08a": "var(--amber-soft)", "#e6c68a": "var(--amber-soft)",
  "#fff5d6": "var(--amber-soft)",
  "#b8760c": "var(--warn)",

  "#b04a33": "var(--clay)",  "#fbeae6": "var(--clay-bg)",
  "#8a3925": "var(--clay-ink)", "#eccfc7": "var(--clay-line)",
  "#a5301a": "var(--heart)",

  "#6b4c8a": "var(--plum)",  "#f1ebf7": "var(--plum-bg)",
  "#d5c9e4": "var(--plum-line)", "#8264a8": "var(--plum-lite)",

  "#dceaf2": "var(--sky)",
}

RE_HEX = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b")

def normal(h):
    h = h.lower()
    if len(h) == 4:
        h = "#" + h[1]*2 + h[2]*2 + h[3]*2
    return h

def sapu(path):
    s = io.open(path, encoding="utf-8").read()
    i = s.index("<style>"); j = s.index("</style>")
    kepala, gaya, ekor = s[:i], s[i:j], s[j:]

    baris = gaya.split("\n")
    keluar, lindungi_sisa, dalam_print, depth = [], False, False, 0
    diganti, dilindungi = 0, 0

    for b in baris:
        lindung = False
        if "@media print" in b:
            dalam_print, depth = True, b.count("{") - b.count("}")
            lindung = True
        elif dalam_print:
            depth += b.count("{") - b.count("}")
            lindung = True
            if depth <= 0: dalam_print = False
        elif lindungi_sisa:
            lindung = True
            if "}" in b: lindungi_sisa = False
        elif "#lembar" in b:
            lindung = True
            if b.count("{") > b.count("}"): lindungi_sisa = True

        if lindung:
            dilindungi += len(RE_HEX.findall(b))
            keluar.append(b); continue

        def tukar(m):
            nonlocal diganti
            v = PETA.get(normal(m.group(0)))
            if v: diganti += 1; return v
            return m.group(0)
        keluar.append(RE_HEX.sub(tukar, b))

    io.open(path, "w", encoding="utf-8").write(kepala + "\n".join(keluar) + ekor)
    sisa = {}
    for b in keluar:
        for h in RE_HEX.findall(b):
            if normal(h) not in PETA: sisa[normal(h)] = sisa.get(normal(h), 0) + 1
    return diganti, dilindungi, sisa

for f in sys.argv[1:]:
    d, l, sisa = sapu(f)
    print(f"{f}: {d} diganti, {l} dilindungi", ("| sisa: " + str(sisa)) if sisa else "")
