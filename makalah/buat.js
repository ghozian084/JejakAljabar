/* Pembentuk dokumen Word untuk makalah KMPM 2026.
   Ketentuan format mengikuti Buku Panduan GMM 2026 — KMPM butir J:
   A4, margin atas 4 cm / bawah 3 cm / kiri 4 cm / kanan 3 cm,
   Times New Roman 12, spasi 1,5, rata kanan-kiri. */

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageNumber, Footer, Header, PageBreak, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, TableOfContents, NumberFormat,
  LevelFormat, convertMillimetersToTwip
} = require("docx");
const fs = require("fs");
const ISI = require("./isi.js");

const CM = n => Math.round(n * 566.9291);      // sentimeter → DXA
const A4 = { width: 11906, height: 16838 };
const MARGIN = { top: CM(4), bottom: CM(3), left: CM(4), right: CM(3) };
const SPASI = { line: 360, lineRule: "auto", after: 0 };   // 360 = 1,5 baris
const INDEN = CM(1.25);
const FONT = "Times New Roman";

/* ---------- pembantu paragraf ---------- */
function P(teks, opsi = {}) {
  return new Paragraph({
    alignment: opsi.align || AlignmentType.JUSTIFIED,
    spacing: Object.assign({}, SPASI, opsi.spacing || {}),
    indent: opsi.indent !== undefined ? opsi.indent : { firstLine: INDEN },
    children: [new TextRun({ text: teks, bold: !!opsi.bold, italics: !!opsi.italics })]
  });
}
function Pkosong() {
  return new Paragraph({ spacing: SPASI, children: [new TextRun("")] });
}
/* Paragraf sorotan untuk catatan yang HARUS dihapus/ditulis ulang penulis. */
function Sorot(label, teks) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: Object.assign({}, SPASI, { before: 120, after: 120 }),
    indent: { left: INDEN, right: INDEN },
    /* Memakai latar paragraf, BUKAN tepi paragraf. docx-js menuliskan
       urutan elemen tepi (top, bottom, left, right) yang ditolak skema
       OOXML, dan berkas ini akan dibuka juri — tidak boleh ada risiko
       Word menolaknya. Latar kuning penuh sudah cukup mencolok. */
    shading: { type: ShadingType.CLEAR, fill: "FFF2A8" },
    children: [
      new TextRun({ text: "[" + label + " — HAPUS SEBELUM DIKIRIM] ", bold: true, shading: { type: ShadingType.CLEAR, fill: "FFFF00" } }),
      new TextRun({ text: teks, italics: true, shading: { type: ShadingType.CLEAR, fill: "FFFF00" } })
    ]
  });
}
/* Judul bab ditulis pada SATU paragraf ("BAB I PENDAHULUAN"), bukan dua baris.
   Alasannya bukan selera: kalau "BAB I" dan "PENDAHULUAN" jadi dua paragraf,
   hanya salah satunya yang terbaca sebagai heading, sehingga Daftar Isi
   otomatis hanya memuat separuh judul bab. */
function H1(teks, sub) {
  return [new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, lineRule: "auto", after: 240 },
    indent: { left: 0 },
    children: [new TextRun({ text: sub ? teks + " " + sub : teks, bold: true, allCaps: true })]
  })];
}
function H2(teks) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { line: 360, lineRule: "auto", before: 240, after: 0 },
    indent: { left: 0 },
    children: [new TextRun({ text: teks, bold: true })]
  });
}
function H3(teks) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { line: 360, lineRule: "auto", before: 180, after: 0 },
    indent: { left: INDEN },
    children: [new TextRun({ text: teks, bold: true })]
  });
}
function Judul(teks) {                 // judul tabel
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, lineRule: "auto", before: 240, after: 60 },
    indent: { left: 0 },
    children: [new TextRun({ text: teks, bold: true })]
  });
}

/* ---------- tabel ---------- */
const LEBAR_ISI = A4.width - MARGIN.left - MARGIN.right;   // 11906-2268-1701 = 7937

function sel(teks, lebar, opsi = {}) {
  return new TableCell({
    width: { size: lebar, type: WidthType.DXA },
    shading: opsi.head ? { type: ShadingType.CLEAR, fill: "EFEFEF" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({
      alignment: opsi.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 240, lineRule: "auto" },
      indent: { left: 0 },
      children: [new TextRun({ text: teks, bold: !!opsi.head, size: 22 })]
    })]
  });
}
function tabel(kolom, baris) {
  const lebar = kolom.map(k => Math.round(LEBAR_ISI * k.w));
  lebar[lebar.length - 1] = LEBAR_ISI - lebar.slice(0, -1).reduce((a, b) => a + b, 0);
  return new Table({
    columnWidths: lebar,
    width: { size: LEBAR_ISI, type: WidthType.DXA },
    rows: [
      new TableRow({
        tableHeader: true,
        children: kolom.map((k, i) => sel(k.t, lebar[i], { head: true, center: true }))
      })
    ].concat(baris.map(b => new TableRow({
      children: b.map((t, i) => sel(t, lebar[i], { center: kolom[i].c }))
    })))
  });
}

const TABEL = {
  tabel1: () => [
    Judul("Tabel 1. Taksonomi Enam Kode Salah Paham Aljabar"),
    tabel(
      [{ t: "Kode", w: .10, c: true }, { t: "Nama", w: .30 }, { t: "Wujud pada jawaban peserta didik", w: .60 }],
      [
        ["M1", "Variabel sebagai label", "Lambang 3k dibaca sebagai tiga kotak, bukan tiga kali isi satu kotak"],
        ["M2", "Konkatenasi", "Bentuk 2 + 3n disederhanakan menjadi 5n karena dianggap belum selesai"],
        ["M3", "Tanda sama dengan sebagai perintah", "Tanda sama dengan dibaca hasilnya, bukan senilai dengan"],
        ["M4", "Pindah ruas tanpa operasi", "Suku dipindahkan sambil berganti tanda tanpa alasan operasi"],
        ["M5", "Urutan pengurangan terbalik", "Frasa lima kurang dari y dituliskan sebagai 5 dikurangi y"],
        ["M6", "Huruf bernilai tunggal dan tetap", "Huruf n dianggap satu angka rahasia yang harus ditebak"]
      ]
    ),
    P("Sumber: disusun penulis berdasarkan Küchemann (1981), Kieran (1981), Clement (1982), Booth (1988), dan MacGregor dan Stacey (1997).",
      { indent: { left: 0 }, align: AlignmentType.LEFT })
  ],
  tabel2: () => [
    Judul("Tabel 2. Arsitektur Media JEJAK ALJABAR"),
    tabel(
      [{ t: "Modul", w: .10, c: true }, { t: "Nama", w: .26 }, { t: "Tempat penggunaan", w: .26 }, { t: "Isi pokok", w: .38 }],
      [
        ["1", "Jejak Aljabar", "Di dalam kelas", "Empat pos konseptual, teman sebaya buatan, Lembar Kerja PDF, Panel Guru"],
        ["2", "Petualangan Lapangan", "Di depan papan majalah dinding", "Pemindaian papan, penyusunan bentuk keliling, pengukuran oleh peserta didik"],
        ["3", "Jelajah Enam Rimba", "Mandiri atau penugasan", "Enam wilayah sesuai kode salah paham, empat tingkat pada tiap wilayah"],
        ["4", "Bengkel Kartu", "Di meja dengan kartu cetak", "Delapan misi dua arah antara susunan kartu dan bentuk aljabar"]
      ]
    )
  ],
  tabel3: () => [
    Judul("Tabel 3. Jumlah Uji Otomatis yang Dijalankan"),
    tabel(
      [{ t: "Berkas uji", w: .34 }, { t: "Cakupan", w: .46 }, { t: "Uji lolos", w: .20, c: true }],
      [
        ["test.js", "Modul 1", "111"],
        ["test-ar.js", "Modul 2", "32"],
        ["test-latihan.js", "Modul 3", "47"],
        ["test-ekspresi.js", "Modul 4", "53"],
        ["test-huruf.js", "Kebijakan huruf lintas modul", "24"],
        ["test-menu.js", "Menu utama", "28"],
        ["Jumlah", "", "295"]
      ]
    ),
    P("Seluruh uji dinyatakan lolos tanpa kegagalan dan tanpa galat konsol.",
      { indent: { left: 0 }, align: AlignmentType.LEFT })
  ]
};

/* ---------- perender daftar isi bab ---------- */
function render(blok) {
  const out = [];
  for (const b of blok) {
    const [jenis, isi] = b;
    if (jenis === "h2") out.push(H2(isi));
    else if (jenis === "h3") out.push(H3(isi));
    else if (jenis === "p") out.push(P(isi));
    else if (jenis === "tr") out.push(Sorot("TULIS ULANG DENGAN SUARA ANDA", isi));
    else if (jenis === "cek") out.push(Sorot("PERIKSA DAN LENGKAPI SENDIRI", isi));
    else if (jenis === "num") {
      isi.forEach((t, i) => out.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: SPASI,
        indent: { left: INDEN, hanging: CM(0.75) },
        children: [new TextRun({ text: (i + 1) + ". " + t })]
      })));
    }
    else if (TABEL[jenis]) out.push(...TABEL[jenis]());
  }
  return out;
}

/* ---------- kaki & kepala halaman ---------- */
const kakiTengah = fmt => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 240, lineRule: "auto" },
    indent: { left: 0 },
    children: [new TextRun({ children: [PageNumber.CURRENT] })]
  })]
});
const kepalaKanan = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { line: 240, lineRule: "auto" },
    indent: { left: 0 },
    children: [new TextRun({ children: [PageNumber.CURRENT] })]
  })]
});
const kosongFooter = new Footer({ children: [new Paragraph({ children: [new TextRun("")] })] });

function sectProps(extra) {
  return Object.assign({
    page: { size: A4, margin: MARGIN }
  }, extra);
}

/* ================= SAMPUL ================= */
function sampul() {
  const t = (teks, o = {}) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, lineRule: "auto", before: o.before || 0, after: o.after || 0 },
    indent: { left: 0 },
    children: [new TextRun({ text: teks, bold: o.bold !== false, size: o.size || 24, allCaps: !!o.caps })]
  });
  return [
    t("MAKALAH", { before: 240 }),
    t("KOMPETISI MEDIA PEMBELAJARAN MATEMATIKA (KMPM)"),
    t("GEMA MAHASISWA MATEMATIKA 2026", { after: 720 }),
    t("JEJAK ALJABAR: MEDIA DIGITAL INTERAKTIF BERBASIS", { size: 28 }),
    t("DIAGNOSIS SALAH PAHAM DAN AUGMENTED REALITY", { size: 28 }),
    t("UNTUK PENGUATAN PEMAHAMAN KONSEP ALJABAR", { size: 28 }),
    t("DI SEKOLAH MENENGAH PERTAMA", { size: 28, after: 720 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 360, lineRule: "auto", before: 240, after: 240 },
      indent: { left: 0 },
      children: [new TextRun({ text: "[ Sisipkan logo sekolah di sini ]", italics: true, color: "808080" })]
    }),
    t("Disusun oleh:", { bold: false, after: 120 }),
    t("MUHAMMAD GHOZIAN KAFI AHSAN, M.Pd."),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 360, lineRule: "auto" },
      indent: { left: 0 },
      children: [new TextRun({ text: "NIP/NIK: ", bold: false }),
                 new TextRun({ text: "………………………………", bold: false, shading: { type: ShadingType.CLEAR, fill: "FFFF00" } })]
    }),
    t("", { after: 480 }),
    t("SEMESTA BILINGUAL BOARDING SCHOOL"),
    t("SEMARANG"),
    t("2026", { after: 240 }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

/* ================= KATA PENGANTAR ================= */
function kataPengantar() {
  return [
    ...H1("Kata Pengantar"),
    Pkosong(),
    P("Puji syukur penulis panjatkan kepada Tuhan Yang Maha Esa atas limpahan rahmat dan karunia-Nya sehingga makalah dengan judul JEJAK ALJABAR: Media Digital Interaktif Berbasis Diagnosis Salah Paham dan Augmented Reality untuk Penguatan Pemahaman Konsep Aljabar di Sekolah Menengah Pertama ini dapat diselesaikan."),
    P("Makalah ini disusun sebagai bagian dari keikutsertaan penulis dalam Kompetisi Media Pembelajaran Matematika (KMPM) pada rangkaian kegiatan Gema Mahasiswa Matematika 2026 yang diselenggarakan oleh BEM Himatika Identika, Universitas Pendidikan Indonesia. Makalah ini memuat gambaran proses pembuatan media pembelajaran, mulai dari tahap perencanaan hingga tahap pembuatan dan pengujian."),
    P("Gagasan media ini berangkat dari pengalaman penulis mengajar matematika di sekolah menengah pertama, khususnya dari pengamatan bahwa kesulitan peserta didik dalam aljabar bersifat sistematis dan berulang, sehingga yang diperlukan bukanlah penambahan jam latihan melainkan pengenalan terhadap jenis kekeliruannya."),
    Sorot("TULIS ULANG DENGAN SUARA ANDA", "Ghozian: paragraf ucapan terima kasih di bawah ini adalah kerangka. Sebutkan nama-nama yang memang Anda ingin sebutkan — kepala sekolah, rekan guru, keluarga. Kata pengantar yang generik terbaca sebagai formalitas, dan ini salah satu bagian yang paling mudah dipersonalisasi."),
    P("Penulis menyampaikan terima kasih kepada pimpinan dan rekan sejawat di tempat penulis mengajar, kepada peserta didik yang menjadi alasan media ini dibuat, serta kepada keluarga penulis atas dukungannya. Terima kasih juga penulis sampaikan kepada panitia Gema Mahasiswa Matematika 2026 atas penyelenggaraan kompetisi ini."),
    P("Penulis menyadari bahwa makalah ini masih memiliki kekurangan. Oleh karena itu, kritik dan saran yang membangun sangat penulis harapkan. Semoga makalah ini bermanfaat."),
    Pkosong(),
    P("Semarang, Agustus 2026", { indent: { left: 0 }, align: AlignmentType.RIGHT }),
    P("Penulis", { indent: { left: 0 }, align: AlignmentType.RIGHT }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

/* ================= DAFTAR ISI ================= */
function daftarIsi() {
  return [
    ...H1("Daftar Isi"),
    Pkosong(),
    Sorot("PETUNJUK — HAPUS KOTAK INI SAJA, BUKAN DAFTAR ISINYA",
      "Daftar isi di bawah ini adalah bidang otomatis. Buka berkas ini di Microsoft Word, klik kanan pada daftar isi, pilih Update Field, lalu pilih Update entire table. Nomor halaman akan terisi sendiri. Lakukan ini SETELAH seluruh penyuntingan selesai."),
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      headingStyleRange: "1-3"
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

/* ================= LEMBAR PERNYATAAN ================= */
function lembarPernyataan() {
  return [
    ...H1("Lembar Pernyataan"),
    Pkosong(),
    P("Yang bertanda tangan di bawah ini:", { indent: { left: 0 } }),
    Pkosong(),
    P("Nama\t\t: Muhammad Ghozian Kafi Ahsan, M.Pd.", { indent: { left: INDEN } }),
    P("Asal sekolah\t: Semesta Bilingual Boarding School, Semarang", { indent: { left: INDEN } }),
    P("Judul media\t: JEJAK ALJABAR", { indent: { left: INDEN } }),
    Pkosong(),
    P("dengan ini menyatakan dengan sesungguhnya bahwa media pembelajaran beserta makalah yang saya ikutsertakan dalam Kompetisi Media Pembelajaran Matematika Gema Mahasiswa Matematika 2026 adalah benar-benar karya saya sendiri, bukan hasil penjiplakan atas karya orang lain, dan belum pernah dipublikasikan maupun diikutsertakan dalam kompetisi lain."),
    P("Media ini merupakan hasil pengembangan dari lembar kerja peserta didik yang saya susun sendiri sebagaimana diuraikan pada Bab II makalah ini."),
    P("Apabila di kemudian hari terbukti terdapat pelanggaran atas pernyataan ini, saya bersedia menerima sanksi sesuai ketentuan yang berlaku."),
    Pkosong(),
    P("Demikian pernyataan ini saya buat dengan sebenar-benarnya."),
    Pkosong(), Pkosong(),
    P("Semarang, ……… Agustus 2026", { indent: { left: 0 }, align: AlignmentType.RIGHT }),
    P("Yang menyatakan,", { indent: { left: 0 }, align: AlignmentType.RIGHT }),
    Pkosong(), Pkosong(), Pkosong(),
    P("Materai Rp10.000 apabila disyaratkan", { indent: { left: 0 }, align: AlignmentType.RIGHT, italics: true }),
    Pkosong(),
    P("Muhammad Ghozian Kafi Ahsan, M.Pd.", { indent: { left: 0 }, align: AlignmentType.RIGHT, bold: true }),
    Sorot("PERIKSA DAN LENGKAPI SENDIRI",
      "Panduan mewajibkan Lembar Pernyataan tetapi tidak melampirkan templatnya. Tanyakan ke kontak WhatsApp panitia apakah ada format resmi dan apakah materai disyaratkan. Kalau ada format resmi, gunakan format mereka, jangan yang ini.")
  ];
}

/* ================= LAMPIRAN ================= */
function lampiran() {
  return [
    ...H1("Lampiran"),
    Pkosong(),
    H2("Lampiran 1. Tangkapan Layar Media"),
    Sorot("LENGKAPI SENDIRI",
      "Sisipkan tangkapan layar di sini: (1) menu utama, (2) salah satu pos Modul 1 beserta umpan balik yang menyebut kode salah paham, (3) percakapan dengan Budi, (4) Peta Salah Paham, (5) hasil pemindaian papan pada Modul 2, (6) lembar kartu cetak dan hasil pembacaan pada Modul 4, (7) Panel Guru berisi sebaran satu kelas, (8) Lembar Kerja PDF. Beri nomor dan judul pada setiap gambar, misalnya Gambar 1. Tampilan Menu Utama."),
    H2("Lampiran 2. Lembar Kartu Cetak Modul 4"),
    P("Lembar kartu dicetak dari dalam media melalui tombol yang tersedia pada Modul 4. Sertakan hasil cetaknya sebagai lampiran."),
    H2("Lampiran 3. Contoh Lembar Kerja PDF"),
    P("Lembar Kerja PDF dihasilkan media pada akhir kegiatan Modul 1 dan memuat jawaban, umpan balik, peta salah paham, serta poin dan lencana peserta didik. Sertakan satu contoh hasil cetaknya."),
    H2("Lampiran 4. Cara Menjalankan Media"),
    P("Media terdiri atas lima berkas HTML yang harus disimpan dalam satu direktori yang sama, yaitu index.html sebagai menu utama serta jejak-aljabar.html, ar-ukur.html, latihan.html, dan ar-ekspresi.html sebagai keempat modul. Media dijalankan dengan membuka berkas index.html melalui peramban web. Agar kamera pada Modul 2 dan Modul 4 dapat digunakan, media perlu ditempatkan pada layanan penampung laman statis yang menyediakan sambungan aman.")
  ];
}

/* ================= DOKUMEN ================= */
const doc = new Document({
  creator: "Muhammad Ghozian Kafi Ahsan",
  title: "Makalah KMPM 2026 — JEJAK ALJABAR",
  styles: {
    default: {
      document: { run: { font: FONT, size: 24, color: "000000" }, paragraph: { spacing: SPASI } },
      heading1: { run: { font: FONT, size: 24, bold: true, color: "000000" } },
      heading2: { run: { font: FONT, size: 24, bold: true, color: "000000" } },
      heading3: { run: { font: FONT, size: 24, bold: true, color: "000000" } }
    }
  },
  sections: [
    /* 1 — sampul, tanpa nomor halaman */
    {
      properties: sectProps({ page: { size: A4, margin: MARGIN, pageNumbers: { formatType: NumberFormat.LOWER_ROMAN, start: 1 } } }),
      footers: { default: kosongFooter },
      children: sampul()
    },
    /* 2 — bagian awal: angka Romawi, tengah bawah */
    {
      properties: sectProps({ page: { size: A4, margin: MARGIN, pageNumbers: { formatType: NumberFormat.LOWER_ROMAN, start: 1 } } }),
      footers: { default: kakiTengah() },
      children: [].concat(kataPengantar(), daftarIsi(), lembarPernyataan())
    },
    /* 3–6 — BAB I s.d. IV: angka Arab; halaman judul bab di tengah bawah,
       halaman berikutnya di kanan atas (titlePage memisahkan keduanya) */
    bab("BAB I", "Pendahuluan", ISI.bab1, 1),
    bab("BAB II", "Dasar Teori", ISI.bab2),
    bab("BAB III", "Media", ISI.bab3),
    bab("BAB IV", "Penutup", ISI.bab4),
    /* 7 — bagian akhir: kembali ke angka Romawi sesuai panduan */
    {
      properties: sectProps({
        titlePage: true,
        page: { size: A4, margin: MARGIN, pageNumbers: { formatType: NumberFormat.LOWER_ROMAN, start: 5 } }
      }),
      footers: { default: kakiTengah(), first: kakiTengah() },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun("")] })] }) },
      children: [].concat(
        H1("Daftar Pustaka"), [Pkosong()],
        ISI.pustaka.map(s => new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: Object.assign({}, SPASI, { after: 120 }),
          indent: { left: CM(1.25), hanging: CM(1.25) },
          children: [new TextRun({ text: s })]
        })),
        [new Paragraph({ children: [new PageBreak()] })],
        lampiran()
      )
    }
  ]
});

function bab(nomor, judul, blok, mulai) {
  const hal = { size: A4, margin: MARGIN };
  if (mulai) hal.pageNumbers = { formatType: NumberFormat.DECIMAL, start: mulai };
  return {
    properties: sectProps({ titlePage: true, page: hal }),
    /* Halaman judul bab: nomor di tengah bawah, tanpa kepala halaman.
       Halaman lainnya: nomor di kanan atas, tanpa kaki halaman.
       Nomor tidak boleh muncul dua kali pada satu halaman. */
    footers: { first: kakiTengah(), default: kosongFooter },
    headers: {
      first: new Header({ children: [new Paragraph({ children: [new TextRun("")] })] }),
      default: kepalaKanan
    },
    children: [].concat(H1(nomor, judul), [Pkosong()], render(blok))
  };
}

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(__dirname + "/Makalah_KMPM_2026_JEJAK_ALJABAR.docx", buf);
  console.log("selesai:", buf.length, "bita");
});
