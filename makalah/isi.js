/* Isi makalah KMPM 2026 — dipisah dari kode pembentuk dokumen supaya
   naskahnya mudah disunting Ghozian tanpa menyentuh kode Word.

   Konvensi penanda:
     TR("...")  = bagian yang WAJIB ditulis ulang dengan suara sendiri (disorot kuning)
     CEK("...") = data yang harus dipastikan sendiri sebelum dikirim (disorot kuning)
*/

module.exports = {

/* ================= BAB I ================= */
bab1: [
  ["h2", "A. Latar Belakang"],

  ["p", "Aljabar merupakan titik peralihan yang menentukan dalam pendidikan matematika di sekolah menengah pertama. Pada jenjang sebelumnya peserta didik terbiasa bekerja dengan bilangan yang nilainya sudah diketahui, sedangkan pada aljabar mereka dituntut bekerja dengan lambang yang justru mewakili sesuatu yang belum diketahui. Peralihan ini tidak bersifat penambahan materi semata, melainkan perubahan cara berpikir: dari menghitung menuju menyatakan hubungan."],

  ["p", "Penelitian selama beberapa dasawarsa menunjukkan bahwa peralihan tersebut jarang berlangsung mulus. Küchemann (1981), melalui proyek Concepts in Secondary Mathematics and Science, mengidentifikasi bahwa sebagian besar peserta didik berusia 13 sampai 15 tahun tidak memaknai huruf sebagai bilangan yang dapat digeneralisasi. Mereka cenderung berhenti pada tiga tingkat terendah, yaitu menilai huruf sebagai angka tertentu melalui coba-coba, mengabaikan keberadaan huruf, atau memperlakukan huruf sebagai nama benda. MacGregor dan Stacey (1997) memperkuat temuan tersebut sekaligus memberi penjelasan yang berbeda: kekeliruan itu tidak semata persoalan tahap kognitif, melainkan bersumber dari asumsi intuitif peserta didik terhadap notasi yang asing, pengalihan kebiasaan dari sistem lambang lain, serta bahan ajar yang justru menyesatkan."],

  ["p", "Kekeliruan serupa muncul pada pemaknaan tanda sama dengan. Kieran (1981) menemukan bahwa peserta didik dari berbagai jenjang secara dominan membaca tanda sama dengan sebagai perintah untuk menghitung dan menuliskan hasil, bukan sebagai lambang relasi kesetaraan antara dua ruas. Clement (1982) menunjukkan bahwa kekeliruan pembalikan pada penerjemahan soal cerita ke bentuk persamaan bahkan bertahan hingga jenjang perguruan tinggi. Booth (1988) menegaskan bahwa kesulitan pada awal aljabar bersifat sistematis dan bermakna, bukan sekadar kecerobohan, sehingga penanganannya tidak cukup dengan menambah jam latihan."],

  ["p", "Gejala yang sama terekam pada konteks Indonesia. Koten, Sulistyowati, Ahsan, dan Kuncoro (2023) menganalisis kekeliruan peserta didik kelas VIII dalam menyelesaikan sistem persamaan linear dua variabel dan menemukan bahwa kekeliruan tersebut berulang menurut pola tertentu, bukan tersebar secara acak. Temuan ini memperkuat pandangan bahwa yang diperlukan bukan penambahan jumlah soal, melainkan pengenalan terhadap pola kekeliruan itu sendiri."],

  ["p", "Temuan-temuan tersebut membawa satu konsekuensi yang sering luput dari perhatian dalam praktik pembelajaran. Apabila kesulitan aljabar bersifat sistematis, maka yang perlu diketahui guru bukanlah berapa banyak soal yang salah, melainkan kekeliruan jenis apa yang dilakukan peserta didik. Dua peserta didik yang sama-sama memperoleh skor empat dari sepuluh dapat memiliki persoalan yang sepenuhnya berbeda, dan karenanya memerlukan penanganan yang berbeda pula. Namun asesmen yang berorientasi pada skor justru menyembunyikan perbedaan tersebut."],

  ["p", "Di sisi lain, perkembangan media digital interaktif menawarkan peluang yang besar. Meta-analisis Sailer dan Homner (2020) melaporkan bahwa gamifikasi memberikan pengaruh positif pada hasil belajar kognitif dengan ukuran efek sedang, sedangkan Flavin dkk. (2025) melaporkan pengaruh positif penggunaan augmented reality terhadap capaian matematika. Meskipun demikian, sebagian besar media pembelajaran matematika yang beredar masih berhenti pada pemindahan latihan soal ke layar. Media semacam itu memang mengubah wadah penyajian, tetapi tidak mengubah apa yang dinilai: peserta didik tetap dihargai karena jawaban yang benar dan dihukum karena jawaban yang salah, tanpa pernah diberi tahu kekeliruan jenis apa yang mereka lakukan."],

  ["p", "Selain persoalan pedagogis, terdapat pula kendala penerapan yang nyata di sekolah. Banyak media digital mensyaratkan sambungan internet yang stabil, akun bagi setiap peserta didik, langganan berbayar, atau pengiriman data peserta didik ke peladen pihak ketiga. Bagi sekolah dengan sambungan internet terbatas, ketiga syarat pertama menghalangi pemakaian; bagi sekolah mana pun, syarat terakhir menimbulkan persoalan perlindungan data peserta didik yang belum tentu dapat dipertanggungjawabkan."],

  ["p", "Berangkat dari keadaan tersebut, dikembangkanlah media pembelajaran JEJAK ALJABAR. Media ini dirancang dengan satu pendirian yang membedakannya dari media latihan pada umumnya, yaitu bahwa yang dicatat dan ditindaklanjuti adalah jenis salah paham, bukan skor. Media ini bekerja sepenuhnya secara luring, tersimpan sebagai berkas HTML tunggal untuk setiap modul, tidak memerlukan pemasangan aplikasi, tidak memerlukan akun, tidak memerlukan kunci antarmuka pemrograman aplikasi, dan tidak pernah mengirimkan data peserta didik ke luar perangkat."],

  ["tr", "Ghozian: paragraf penutup latar belakang sebaiknya Anda tulis ulang dengan menyisipkan pengalaman mengajar Anda sendiri — kekeliruan aljabar seperti apa yang paling sering Anda temui di kelas VII–IX di sekolah Anda. Satu contoh nyata dari kelas Anda akan jauh lebih meyakinkan bagi juri daripada rangkaian sitasi di atas, dan hanya Anda yang memilikinya."],

  ["h2", "B. Rumusan Masalah"],
  ["p", "Berdasarkan latar belakang tersebut, rumusan masalah dalam penulisan ini adalah sebagai berikut."],
  ["num", [
    "Bagaimana rancangan media pembelajaran digital interaktif yang mendiagnosis jenis salah paham aljabar peserta didik, bukan sekadar menilai benar atau salahnya jawaban?",
    "Bagaimana proses pembuatan media pembelajaran JEJAK ALJABAR sehingga dapat berjalan secara luring tanpa pustaka luar, tanpa akun, dan tanpa pengiriman data peserta didik ke luar perangkat?",
    "Bagaimana penggunaan media pembelajaran JEJAK ALJABAR dalam pembelajaran aljabar di sekolah menengah pertama, baik di dalam maupun di luar kelas?"
  ]],

  ["h2", "C. Tujuan"],
  ["p", "Sejalan dengan rumusan masalah tersebut, penulisan ini bertujuan untuk:"],
  ["num", [
    "menguraikan rancangan media pembelajaran digital interaktif yang mendiagnosis jenis salah paham aljabar peserta didik;",
    "menguraikan proses pembuatan media pembelajaran JEJAK ALJABAR beserta pertimbangan teknis yang melandasinya;",
    "menguraikan penggunaan media pembelajaran JEJAK ALJABAR dalam pembelajaran aljabar di sekolah menengah pertama."
  ]],

  ["h2", "D. Manfaat"],
  ["h3", "1. Manfaat Teoretis"],
  ["p", "Penulisan ini diharapkan memberikan sumbangan pemikiran mengenai perancangan media pembelajaran yang menempatkan diagnosis salah paham sebagai inti kerja media, bukan sebagai pelengkap. Selain itu, penulisan ini mengajukan satu prinsip perancangan augmented reality untuk pembelajaran matematika, yaitu bahwa kamera memberikan struktur sedangkan peserta didik memberikan besaran, yang diuraikan pada Bab III."],

  ["h3", "2. Manfaat Praktis"],
  ["p", "Bagi peserta didik, media ini memberikan umpan balik yang menyebutkan jenis kekeliruan beserta alasannya, sehingga peserta didik mengetahui bukan hanya bahwa jawabannya keliru, melainkan mengapa jawaban itu keliru. Bagi guru, media ini menyediakan Panel Guru yang merangkum sebaran salah paham satu kelas tanpa memerlukan peladen, akun, maupun sambungan internet. Bagi sekolah, media ini dapat digunakan tanpa biaya berulang, tanpa pemasangan aplikasi, dan tanpa memindahkan data peserta didik ke luar lingkungan sekolah."]
],

/* ================= BAB II ================= */
bab2: [
  ["h2", "A. Konsep Aljabar pada Jenjang Sekolah Menengah Pertama"],
  ["p", "Materi aljabar pada jenjang sekolah menengah pertama mencakup pengenalan variabel, koefisien, konstanta, dan suku; penyusunan bentuk aljabar dari situasi nyata; operasi pada bentuk aljabar; serta penyelesaian persamaan linear satu variabel. Media yang diuraikan dalam tulisan ini memusatkan perhatian pada tiga hal pertama, karena pada bagian itulah salah paham paling banyak terbentuk dan paling jarang terdeteksi."],
  ["p", "Perbedaan antara bentuk aljabar dan persamaan perlu ditegaskan sejak awal. Bentuk aljabar menyatakan suatu kuantitas, sedangkan persamaan menyatakan hubungan kesetaraan antara dua kuantitas. Peserta didik yang belum memisahkan keduanya cenderung memperlakukan setiap bentuk aljabar sebagai sesuatu yang harus dicari hasilnya, sehingga bentuk seperti 3n + 5 terasa belum selesai dan mendorong mereka menyatukannya menjadi 8n."],

  ["h2", "B. Salah Paham dalam Aljabar"],
  ["p", "Salah paham dalam aljabar telah lama menjadi objek kajian. Küchemann (1981) mengelompokkan cara peserta didik memaknai huruf ke dalam enam kategori, mulai dari huruf yang dinilai sebagai angka tertentu, huruf yang diabaikan, huruf sebagai nama benda, huruf sebagai bilangan tak diketahui tertentu, huruf sebagai bilangan yang digeneralisasi, hingga huruf sebagai variabel yang berubah secara sistematis. Perlu dicatat bahwa keenam kategori tersebut merupakan cara pemaknaan, bukan tingkat kesulitan butir soal."],
  ["p", "Berdasarkan kajian tersebut dan kajian yang dirujuk pada Bab I, media JEJAK ALJABAR menyusun sebuah taksonomi kerja yang terdiri atas enam kode salah paham. Taksonomi ini tidak dimaksudkan sebagai penemuan baru, melainkan sebagai penerjemahan temuan penelitian ke dalam bentuk yang dapat dikenali oleh mesin dan dibaca oleh guru. Keenam kode tersebut disajikan pada Tabel 1."],

  ["tabel1"],

  ["p", "Penyusunan taksonomi kerja semacam ini sejalan dengan pendekatan analisis kekeliruan yang diterapkan Koten dkk. (2023) pada peserta didik kelas VIII, yaitu mengelompokkan kekeliruan menurut jenisnya agar penanganannya dapat diarahkan, bukan sekadar menghitung banyaknya jawaban salah."],

  ["p", "Taksonomi tersebut merupakan satu-satunya objek yang digunakan bersama oleh seluruh bagian media. Mesin diagnostik mengklasifikasikan jawaban ke dalam kode tersebut, teman sebaya buatan memerankan kode tersebut, pembangkit soal membangkitkan butir berdasarkan kode tersebut, dan sandi pelaporan menyandikan kode tersebut. Dengan demikian, umpan balik yang diterima peserta didik, soal yang diberikan kepadanya, dan laporan yang dibaca guru berbicara dalam kosakata yang sama."],

  ["h2", "C. Perubahan Konsepsi dan Umpan Balik Formatif"],
  ["p", "Posner, Strike, Hewson, dan Gertzog (1982) mengajukan empat syarat agar suatu konsepsi baru dapat diterima peserta didik. Peserta didik harus terlebih dahulu merasa tidak puas terhadap konsepsi lamanya, sedangkan konsepsi baru harus dapat dipahami, tampak masuk akal, dan terbukti berguna untuk persoalan lain. Syarat pertama menjelaskan mengapa pemberitahuan langsung bahwa suatu jawaban keliru jarang mengubah salah paham: selama peserta didik belum merasakan sendiri bahwa gagasannya bermasalah, koreksi dari luar hanya akan dihafalkan."],
  ["p", "Konsekuensi rancangan dari teori tersebut adalah bahwa media tidak cukup menyatakan sebuah jawaban keliru, melainkan harus menyediakan situasi yang membuat peserta didik menguji sendiri gagasannya. Dalam media ini, misalnya, peserta didik yang menyatukan 2 kotak dengan 5 ikan satuan menjadi 7n tidak sekadar diberi tahu bahwa jawabannya keliru, melainkan diajak menghitung: apabila satu kotak berisi 10 ekor, susunan tersebut berisi 25 ekor, sedangkan 7n memberikan 70 ekor."],
  ["p", "Mengenai bentuk umpan balik, Black dan Wiliam (1998) menyimpulkan dari tinjauan atas ratusan penelitian bahwa penguatan praktik asesmen formatif menghasilkan peningkatan hasil belajar yang berarti, dengan manfaat terbesar justru pada peserta didik berpencapaian rendah. Hattie dan Timperley (2007) memperinci bahwa umpan balik dapat berpengaruh positif maupun negatif bergantung pada jenisnya, dan bahwa umpan balik pada tataran diri atau pujian personal merupakan yang paling tidak efektif. Kedua temuan tersebut melandasi keputusan dalam media ini untuk tidak pernah memberikan umpan balik berupa penilaian terhadap diri peserta didik, melainkan selalu berupa keterangan mengenai jenis kekeliruan dan alasannya."],

  ["h2", "D. Belajar dengan Mengajari dan Efek Protégé"],
  ["p", "Biswas, Leelawong, Schwartz, dan Vye (2005) memperkenalkan paradigma belajar dengan mengajari melalui sistem Betty's Brain, yaitu perangkat lunak yang menempatkan peserta didik pada posisi mengajari sebuah agen komputer. Leelawong dan Biswas (2008) melaporkan bahwa kelompok peserta didik yang mengajari agen mengungguli kelompok yang diajari oleh agen, dan kelompok yang memperoleh umpan balik regulasi diri paling siap untuk belajar pada bidang baru."],
  ["p", "Chase, Chin, Oppezzo, dan Schwartz (2009) menamai gejala ini sebagai efek protégé. Peserta didik yang mengira sedang mengajari pihak lain mencurahkan waktu dan usaha yang lebih besar serta memperoleh capaian yang lebih baik daripada peserta didik yang belajar untuk dirinya sendiri, dengan manfaat paling menonjol pada peserta didik berkemampuan rendah. Penulis menjelaskan gejala tersebut melalui rasa tanggung jawab terhadap pihak yang diajari sekaligus perlindungan harga diri, karena kegagalan diatribusikan kepada agen dan bukan kepada diri peserta didik."],
  ["p", "Landasan inilah yang mendasari kehadiran Budi, teman sebaya buatan di dalam media ini. Budi tidak berperan sebagai pengajar yang serba tahu, melainkan sebagai teman sekelas yang memegang salah paham tertentu dan mempertahankannya. Peserta didik ditugasi meyakinkan Budi, sehingga peserta didik harus menyusun alasan, bukan sekadar menyebutkan jawaban."],

  ["h2", "E. Pendidikan Matematika Realistik dan Pemodelan yang Muncul"],
  ["p", "Freudenthal (1973) menolak penyajian matematika sebagai produk jadi dan menempatkan matematika sebagai aktivitas manusia, sehingga peserta didik seharusnya dibimbing untuk menemukan kembali konsep, bukan menerima hasil akhirnya. Gagasan tersebut dipertajam dalam karya terakhirnya mengenai matematisasi horizontal dan vertikal serta peran konteks realistik sebagai titik tolak, bukan sebagai ilustrasi setelah konsep diajarkan (Freudenthal, 1991)."],
  ["p", "Gravemeijer (1999) menguraikan bagaimana model yang muncul dari aktivitas informal peserta didik dapat beralih dari model dari suatu situasi menjadi model untuk penalaran matematis yang lebih formal. Peralihan inilah yang menjadi tulang punggung alur media ini: peserta didik mula-mula bekerja dengan kotak bandeng yang tersegel, kemudian dengan papan majalah dinding sekolah, lalu dengan kartu cetak, dan pada akhirnya dengan lambang yang berdiri sendiri."],
  ["p", "Mengenai peran alat digital dalam pembelajaran pemodelan matematis, Ahsan, Cahyono, dan Kharisudin (2023) melalui tinjauan pustaka sistematis memetakan bagaimana perangkat seperti GeoGebra dan MathCityMap menopang tahapan pemodelan. Tinjauan tersebut menunjukkan bahwa sumbangan alat digital paling besar terletak pada tahap penerjemahan situasi nyata menjadi model, dan bukan pada tahap perhitungan."],

  ["p", "Pemilihan konteks kotak bandeng yang tersegel bukan sekadar upaya membuat soal terasa dekat. Segel yang benar-benar tidak dapat dibuka menutup celah yang lazim muncul pada konteks buatan, yaitu pertanyaan mengapa isinya tidak dihitung saja. Ketika isi memang tidak mungkin dihitung, kebutuhan akan lambang menjadi kebutuhan yang nyata, bukan kebutuhan yang diminta guru."],

  ["h2", "F. Jejak Matematika dan Pembelajaran di Luar Kelas"],
  ["p", "Jejak matematika merupakan rangkaian perhentian di ruang publik yang pada setiap perhentiannya peserta didik mengerjakan tugas matematika berdasarkan objek nyata di tempat tersebut (Shoaf, Pollak, & Schneider, 2004). Ludwig dan Jesberg (2015) mengembangkan gagasan tersebut melalui proyek MathCityMap, yang memadukan portal penyusunan jejak dengan aplikasi bergerak berbasis penentuan posisi global, sehingga tugas pemodelan matematis dapat disajikan di luar kelas dengan objek nyata sebagai sumber tugas. Dalam konteks Indonesia, Cahyono dan Ludwig (2019) melaporkan bahwa pembelajaran matematika di sekitar kota dengan dukungan teknologi digital memberikan pengalaman matematis dan peningkatan performa bagi peserta didik."],
  ["p", "Pemaduan jejak matematika dengan augmented reality untuk pembelajaran pemodelan matematis telah diteliti pada konteks Indonesia. Cahyono, Sukestiyarno, Asikin, Miftahudin, Ahsan, dan Ludwig (2020) melaporkan bahwa program jejak matematika bergerak berbantuan augmented reality dapat menjembatani situasi dunia nyata menuju konsep matematika pada peserta didik kelas VIII di Semarang. Perancangan aplikasi bergeraknya diuraikan oleh Ahsan, Miftahudin, dan Cahyono (2020), sedangkan pengembangan lingkungan jejak matematika digital berbantuan augmented reality dengan pendekatan pembelajaran pemodelan matematis diuraikan oleh Ahsan, Cahyono, dan Kharisudin (2024)."],

  ["p", "Modul kedua dalam media ini mengambil gagasan jejak matematika tersebut, dengan dua penyesuaian. Pertama, perhentiannya tidak berada di ruang publik kota melainkan di lingkungan sekolah, khususnya papan majalah dinding, sehingga tidak memerlukan izin perjalanan maupun biaya transportasi. Kedua, tugasnya tidak diberikan oleh sistem melainkan disusun oleh kamera dari objek yang dipindai, sebagaimana diuraikan pada Bab III."],

  ["h2", "G. Augmented Reality dalam Pembelajaran Matematika"],
  ["p", "Bujak, Radu, Catrambone, MacIntyre, Zheng, dan Golubski (2013) mengajukan kerangka tiga dimensi, yaitu fisik, kognitif, dan kontekstual, untuk menjelaskan mengapa augmented reality dapat mendukung belajar matematika, bukan sekadar menyatakan bahwa teknologi tersebut efektif. Penjelasannya menautkan manipulasi objek fisik, penurunan beban kognitif melalui penempatan informasi pada satu tempat, dan pembelajaran yang terletak dalam interaksi sosial."],
  ["p", "Secara kuantitatif, Flavin, Hwang, dan Flavin (2025) melalui sintesis atas dua puluh dua penelitian eksperimental melaporkan pengaruh positif berukuran sedang penggunaan augmented reality terhadap capaian matematika, dengan Hedges' g sebesar 0,765. Dari lima moderator yang diuji, hanya keterpaduan objek virtual yang berpengaruh secara berarti. Temuan ini penting karena menunjukkan bahwa cara objek virtual dipadukan dengan objek nyata lebih menentukan daripada lama pemakaian maupun jenjang pengguna. Ahmad dan Junaini (2020) melalui tinjauan sistematis memetakan jenis aplikasi augmented reality untuk matematika beserta kendala penerapannya."],
  ["p", "Media ini mengambil sikap yang berbeda dari kebanyakan penerapan augmented reality dalam matematika. Pada umumnya augmented reality digunakan untuk menampilkan objek tiga dimensi atau untuk mengukur objek nyata secara otomatis. Dalam media ini, kemampuan mengukur secara otomatis justru sengaja tidak digunakan, dengan alasan yang diuraikan pada Bab III."],

  ["h2", "H. Gamifikasi dan Risikonya"],
  ["p", "Sailer dan Homner (2020) melalui meta-analisis melaporkan bahwa gamifikasi memberikan pengaruh positif pada hasil belajar kognitif dengan Hedges' g sebesar 0,49, pada hasil motivasional sebesar 0,36, dan pada hasil behavioral sebesar 0,25. Pengaruh pada ranah kognitif bertahan pada analisis yang lebih ketat, sedangkan pengaruh pada ranah motivasional dan behavioral kurang stabil."],
  ["p", "Namun demikian, penerapan gamifikasi menyimpan risiko yang perlu dinyatakan secara jujur. Deci, Koestner, dan Ryan (1999) melalui meta-analisis melaporkan bahwa imbalan berwujud secara keseluruhan menurunkan motivasi intrinsik, dengan imbalan yang bersifat kontingen terhadap penyelesaian tugas termasuk yang paling merusak. Temuan yang lebih perlu diperhatikan adalah bahwa imbalan verbal memang meningkatkan motivasi intrinsik pada mahasiswa, tetapi pengaruhnya nyaris nol pada anak-anak. Dengan demikian, pembelaan yang lazim dikemukakan bahwa gamifikasi tertentu hanya menggunakan pujian atau lencana simbolik dan bukan hadiah berwujud tidak dengan sendirinya aman bagi populasi peserta didik sekolah."],
  ["p", "Kesadaran atas risiko tersebut melandasi satu keputusan rancangan yang diuraikan pada Bab III, yaitu bahwa poin dalam media ini diberikan untuk pemulihan dan bukan untuk ketepatan. Keputusan tersebut tidak menghapus risiko yang dilaporkan Deci dkk., tetapi sekurang-kurangnya menjaga agar lapisan permainan tidak bertentangan dengan pendirian pokok media."],

  ["h2", "I. Sejarah Media yang Berkaitan"],
  ["p", "Media JEJAK ALJABAR merupakan hasil pengembangan dari lembar kerja peserta didik berjudul Algebraic Modelling: Expressions and Formulae yang disusun penulis untuk pembelajaran di kelas. Lembar kerja tersebut berbentuk cetak dan statis, memuat konteks pemodelan aljabar beserta serangkaian butir latihan, dan digunakan sebagai bahan pendamping pembelajaran."],

  ["tr", "Ghozian: paragraf di atas harus Anda lengkapi sendiri dan ini WAJIB, bukan pilihan. Sebutkan tahun penyusunan lembar kerja itu, untuk kelas berapa, dalam rangka apa (LIT), dan yang paling penting: apakah lembar kerja itu sudah pernah dipublikasikan di mana pun. Ketentuan peserta butir E.7 mensyaratkan karya orisinal dan belum pernah dipublikasikan, sementara sistematika BAB II justru menyediakan tempat untuk mengakui pengembangan dari media yang sudah ada. Mengakuinya di sini mengamankan Anda; menyembunyikannya justru berisiko."],

  ["p", "Terdapat tiga perbedaan mendasar antara lembar kerja tersebut dan media yang diuraikan dalam tulisan ini. Pertama, lembar kerja bersifat statis dan hanya dapat dinilai setelah dikumpulkan, sedangkan media ini memberikan umpan balik pada saat peserta didik mengerjakan. Kedua, lembar kerja menilai jawaban sebagai benar atau salah, sedangkan media ini mengklasifikasikan jawaban ke dalam enam kode salah paham beserta alasannya. Ketiga, lembar kerja tidak memiliki sarana bagi guru untuk melihat sebaran kekeliruan satu kelas, sedangkan media ini menyediakan Panel Guru yang bekerja tanpa peladen."],
  ["p", "Selain lembar kerja tersebut, media ini berpijak pada rangkaian pengembangan yang telah penulis kerjakan sebelumnya. Perancangan aplikasi bergerak berbasis augmented reality untuk pembelajaran matematika di luar ruang (Ahsan, Miftahudin, & Cahyono, 2020) serta pengembangan lingkungan jejak matematika digital berbantuan augmented reality (Ahsan, Cahyono, & Kharisudin, 2024) menjadi dasar bagi Modul 2. Adapun desain lembar kerja peserta didik berbasis aplikasi web dengan pendekatan computational thinking (Ahsan, Cahyono, & Prabowo, 2021) merupakan pendahulu langsung bagi bentuk media ini, yaitu lembar kerja yang tidak lagi dicetak melainkan dijalankan di dalam peramban."],

  ["p", "Perbedaan media ini terhadap keseluruhan pengembangan terdahulu tersebut terletak pada satu hal. Seluruh pengembangan sebelumnya menempatkan teknologi sebagai sarana penyajian tugas, sedangkan media ini menempatkan teknologi sebagai sarana pengenalan salah paham. Pada pengembangan terdahulu, jawaban peserta didik dinilai benar atau salah; pada media ini, jawaban peserta didik diklasifikasikan menurut jenis salah pahamnya."],

  ["cek", "Ghozian: periksa dua hal pada sitasi publikasi Anda sendiri. Pertama, pada artikel Journal on Mathematics Education 2020 nama Anda tercetak Muhammadi Ghozian Kafi Ahsan, tampaknya salah cetak dari penerbit — putuskan apakah menuliskannya sesuai cetakan atau sesuai nama Anda yang benar. Kedua, nomor volume AIP Conference Proceedings 2024 tercatat berbeda antarsumber, yaitu 3106 dan 3116; DOI-nya sudah benar, tetapi pastikan nomor volumenya dari halaman resmi sebelum dikirim."]
],

/* ================= BAB III ================= */
bab3: [
  ["h2", "A. Desain Media"],

  ["h3", "1. Pendirian Pokok"],
  ["p", "Seluruh rancangan media ini bertumpu pada satu pendirian, yaitu bahwa yang dicatat dan ditindaklanjuti adalah jenis salah paham, bukan skor. Pendirian ini menentukan hampir seluruh keputusan rancangan yang diuraikan pada bagian berikutnya, termasuk keputusan-keputusan yang sekilas tampak sebagai persoalan teknis semata."],
  ["p", "Turunan pertama dari pendirian tersebut adalah bahwa setiap umpan balik yang menyatakan suatu jawaban keliru harus menyertakan kode salah paham beserta alasannya. Turunan kedua adalah bahwa kode tersebut benar-benar dicatat pada peta salah paham peserta didik, bukan sekadar ditampilkan. Turunan ketiga adalah bahwa poin diberikan untuk pemulihan, bukan untuk ketepatan, sebagaimana diuraikan pada butir 5."],

  ["h3", "2. Prinsip Perancangan Augmented Reality"],
  ["p", "Prinsip perancangan augmented reality dalam media ini dirumuskan sebagai berikut: kamera memberikan struktur, peserta didik memberikan besaran."],
  ["p", "Sebuah kamera tunggal tidak dapat membedakan objek kecil yang berjarak dekat dari objek besar yang berjarak jauh. Keterbatasan ini dikenal sebagai ketaktentuan skala monokuler dan lazim dipandang sebagai kelemahan yang harus diatasi, misalnya dengan penanda berukuran diketahui atau dengan sensor kedalaman. Dalam media ini, keterbatasan tersebut justru dijadikan mesin didaktis."],
  ["p", "Ketika kamera memindai papan majalah dinding, sistem sanggup menyimpulkan bahwa objek tersebut berbentuk segi empat dan sanggup menyusun bentuk aljabar K sama dengan 2p ditambah 2l, tetapi tidak sanggup memberikan nilai p dan l. Peserta didik harus berdiri di depan papan tersebut, mengukurnya dengan alat ukur, dan memasukkan hasil ukurnya. Dengan demikian, variabel dalam kegiatan tersebut bukan variabel buatan yang nilainya sudah tersedia di suatu tempat, melainkan variabel yang memang belum diketahui sampai peserta didik sendiri mengukurnya."],
  ["p", "Konsekuensi rancangannya bersifat mutlak: seandainya augmented reality diberi kemampuan mengukur secara otomatis, variabel dalam kegiatan tersebut akan mati seketika. Peserta didik tidak lagi memiliki alasan untuk memberi nama pada sesuatu yang sudah diberitahukan nilainya oleh perangkat."],
  ["p", "Dari prinsip tersebut muncul satu gelung umpan balik yang tidak lazim. Kamera mengetahui perbandingan antarsisi tanpa mengetahui ukuran sebenarnya. Akibatnya, sistem dapat memeriksa kewajaran hasil ukur peserta didik, misalnya dengan membandingkan nisbah panjang terhadap lebar hasil ukur dengan nisbah hasil pindaian, tanpa pernah mengetahui jawaban yang benar. Sistem dapat berkata bahwa hasil ukur peserta didik tidak konsisten, tetapi tidak dapat berkata berapa seharusnya."],

  ["h3", "3. Arsitektur Media"],
  ["p", "Media ini terdiri atas satu menu utama dan empat modul yang saling bertaut melalui pranala relatif. Seluruh berkas disimpan dalam satu direktori. Rincian keempat modul disajikan pada Tabel 2."],
  ["tabel2"],
  ["p", "Modul 1 merupakan karya utama dan memuat keseluruhan alur konseptual. Modul 2, 3, dan 4 merupakan pengembangan yang masing-masing menyasar satu kebutuhan berbeda, yaitu penerapan di luar kelas, penguatan melalui latihan, dan penerjemahan dua arah antara benda dan lambang. Media tetap utuh sebagai satu kesatuan pembelajaran apabila hanya Modul 1 yang digunakan."],
  ["p", "Menu utama menampilkan kemajuan peserta didik pada keempat modul dengan membaca penyimpanan setempat masing-masing modul. Menu utama hanya membaca dan tidak pernah menulis ke penyimpanan modul, sehingga membuka menu utama tidak mungkin merusak kemajuan peserta didik."],

  ["h3", "4. Desain Diagnostik dan Umpan Balik"],
  ["p", "Setiap butir kegiatan pada Modul 1 memiliki daftar pola jawaban keliru yang telah dipetakan ke kode salah paham tertentu. Ketika jawaban peserta didik cocok dengan salah satu pola tersebut, media tidak hanya menyatakan bahwa jawaban itu keliru, melainkan menyebutkan kode salah pahamnya, menjelaskan alasannya dengan angka yang dapat diperiksa sendiri, dan mencatat kode tersebut pada peta salah paham peserta didik."],
  ["p", "Sebagai contoh, pada butir penyusunan bentuk aljabar dari tiga kotak tersegel dan dua ikan satuan, jawaban 5n dikenali sebagai kode M2. Umpan baliknya tidak berbunyi bahwa jawaban tersebut salah, melainkan mengajak peserta didik menguji: apabila satu kotak berisi sepuluh ekor, susunan tersebut berisi tiga puluh dua ekor, sedangkan 5n memberikan lima puluh ekor. Pola pengujian mandiri semacam ini merupakan penerapan syarat ketidakpuasan dari Posner dkk. (1982)."],
  ["p", "Teman sebaya buatan bernama Budi bekerja atas taksonomi yang sama. Budi memegang satu salah paham dan mempertahankannya melalui beberapa giliran percakapan. Budi baru menyatakan menyerah apabila peserta didik telah menyampaikan seluruh gagasan kunci yang diperlukan, bukan setelah sekadar satu gagasan disebutkan. Budi berjalan sepenuhnya dengan mesin aturan, tanpa kecerdasan buatan generatif, tanpa sambungan internet, dan tanpa kunci antarmuka pemrograman aplikasi."],

  ["h3", "5. Desain Gamifikasi"],
  ["p", "Aturan pokok gamifikasi dalam media ini adalah bahwa memperbaiki kekeliruan dibayar lebih mahal daripada benar sejak awal. Sebagai contoh, satu butir memberikan dua belas poin apabila dijawab benar pada percobaan pertama, dan dua puluh poin apabila peserta didik sempat keliru lalu memperbaikinya."],
  ["p", "Aturan tersebut bukan bentuk keramahan, melainkan keharusan logis. Apabila media berargumen bahwa yang penting adalah jenis kekeliruan dan bukan skor, sedangkan lapisan permainannya justru membayar untuk ketepatan, maka argumen tersebut runtuh oleh rancangannya sendiri. Dengan aturan terbalik ini, lapisan permainan memperkuat pendirian pokok media alih-alih menentangnya."],
  ["p", "Penerapan yang paling jelas terdapat pada Modul 3. Berbeda dengan pola yang lazim pada aplikasi latihan, ketika peserta didik menjawab keliru dan kehilangan satu nyawa, sistem segera memberikan butir sejenis dan menandainya sebagai kesempatan kedua. Apabila peserta didik menjawab benar, nyawanya kembali dan butir tersebut tetap dihitung sebagai kemajuan. Nyawa dengan demikian berfungsi sebagai batas kesempatan, bukan sebagai hukuman atas kesalahan. Secara pedagogis, mekanisme ini mengulang salah paham yang sama pada saat itu juga, bukan menundanya."],
  ["p", "Sebagian lencana sengaja dirancang agar tidak mungkin diperoleh oleh peserta didik yang benar sejak awal. Lencana Bangkit, misalnya, hanya dapat diperoleh peserta didik yang pernah memegang suatu salah paham lalu melepaskannya. Lencana Tahu Jebakan justru diberikan kepada peserta didik yang sempat tergoda menekan tombol pemindahan ruas tanpa operasi tetapi kemudian menuntaskan penyelesaian persamaan dengan cara yang benar."],

  ["h3", "6. Kebijakan Penggunaan Huruf"],
  ["p", "Dalam pemodelan matematika, pemilihan huruf pada dasarnya bebas. Yang membawa makna adalah struktur bentuk aljabarnya, bukan huruf yang dipakai. Memaksakan satu huruf tertentu bukan sekadar tidak adil bagi peserta didik, melainkan justru menanamkan kode M1: huruf diperlakukan sebagai label tetap yang melekat pada benda tertentu."],
  ["p", "Media yang seluruh isinya melawan M1 tidak boleh mengajarkan M1 melalui pemeriksanya sendiri. Oleh karena itu, media ini menerapkan kebijakan yang dibedakan berdasarkan siapa yang menetapkan hurufnya. Pada Modul 1 dan Modul 4, huruf dipilih sendiri oleh peserta didik, sehingga penggunaan huruf lain diterima sebagai jawaban benar disertai catatan agar peserta didik konsisten. Pada Modul 3, huruf ditetapkan oleh soal, sehingga penggunaan huruf lain ditolak, tetapi penolakan tersebut tidak mengurangi nyawa dan tidak dicatat sebagai salah paham, karena sistem tidak dapat memastikan apakah peserta didik salah paham atau sekadar salah menyalin."],
  ["p", "Prinsip yang mendasari keputusan terakhir tersebut dapat dirumuskan sebagai berikut: media yang mendiagnosis harus lebih memilih diam daripada menuduh keliru. Salah diagnosis lebih merugikan daripada sekadar salah menilai, karena ia menanamkan keraguan pada peserta didik yang sebenarnya sudah paham sekaligus mengotori data yang dibaca guru."],

  ["h3", "7. Desain Antarmuka dan Keterbacaan"],
  ["p", "Seluruh penanda status dalam media ini tidak pernah disampaikan melalui warna semata, melainkan selalu disertai label teks atau lambang. Palet warna status telah diperiksa terhadap keterbacaan bagi pengguna dengan defisiensi penglihatan warna jenis deuteranopia. Pemberitahuan di layar dibatasi paling banyak tiga sekaligus, dan pemberitahuan poin serta lencana digabungkan menjadi satu pesan, karena pada versi awal pemberitahuan yang menumpuk menutupi umpan balik yang sedang dibaca peserta didik."],

  ["h2", "B. Alat dan Bahan Media"],
  ["h3", "1. Perangkat Lunak Pengembangan"],
  ["p", "Media dikembangkan menggunakan bahasa HTML, CSS, dan JavaScript murni tanpa kerangka kerja maupun pustaka pihak ketiga. Penyuntingan dilakukan menggunakan penyunting teks. Pengujian otomatis dilakukan menggunakan Node.js dan Playwright."],

  ["h3", "2. Perangkat Keras dan Perangkat Lunak Pengguna"],
  ["p", "Media dapat dijalankan pada komputer, komputer tablet, maupun telepon pintar yang memiliki peramban web modern. Tidak diperlukan pemasangan aplikasi. Modul 2 dan Modul 4 memanfaatkan kamera perangkat, tetapi keduanya menyediakan jalur alternatif berupa contoh simulasi, unggah foto, dan penghitung manual, sehingga seluruh alur tetap dapat ditempuh tanpa kamera."],

  ["h3", "3. Bahan Cetak"],
  ["p", "Modul 4 memerlukan lembar kartu yang dicetak pada kertas HVS biasa dengan tinta hitam putih. Satu lembar memuat dua puluh empat kartu, terdiri atas delapan kartu persegi pekat sebagai wakil variabel dan enam belas kartu lingkaran pekat sebagai wakil konstanta, beserta arena bertanda sudut. Diperlukan pula gunting untuk memotong kartu. Modul 2 memerlukan alat ukur panjang berupa meteran atau penggaris panjang."],

  ["h3", "4. Yang Sengaja Tidak Digunakan"],
  ["p", "Media ini sengaja tidak menggunakan pustaka pihak ketiga, peladen, basis data, akun pengguna, maupun kunci antarmuka pemrograman aplikasi. Keputusan terakhir perlu diberi alasan khusus. Kunci antarmuka pemrograman aplikasi yang disematkan pada berkas HTML sisi klien adalah kunci yang pasti bocor, karena berkas tersebut dapat dibaca siapa pun yang membukanya. Selain itu, ketergantungan pada layanan luar berarti media akan berhenti bekerja ketika sambungan internet terputus, dan berarti pula data peserta didik dikirimkan ke luar lingkungan sekolah."],

  ["h2", "C. Cara Pembuatan Media"],

  ["h3", "1. Tahapan Pengembangan"],
  ["p", "Pengembangan media dilakukan melalui lima tahap, yaitu analisis kebutuhan, perancangan, pembuatan, pengujian, dan perbaikan. Kelima tahap tersebut tidak berlangsung secara berurutan sekali jalan, melainkan berulang: setiap temuan pada tahap pengujian mengembalikan pekerjaan ke tahap perancangan atau pembuatan."],
  ["p", "Tahap analisis kebutuhan menghasilkan taksonomi enam kode salah paham sebagaimana diuraikan pada Bab II. Tahap perancangan menghasilkan alur empat pos pada Modul 1 beserta pemetaan konteks. Tahap pembuatan menghasilkan berkas-berkas media. Tahap pengujian menghasilkan berkas uji otomatis. Tahap perbaikan menghasilkan perubahan atas temuan pengujian, beberapa di antaranya diuraikan pada butir 6."],

  ["h3", "2. Mesin Penilai Bentuk Aljabar"],
  ["p", "Media harus dapat memeriksa apakah bentuk aljabar yang dituliskan peserta didik setara dengan bentuk yang diharapkan, termasuk ketika peserta didik menuliskannya dalam susunan yang berbeda. Cara yang paling ringkas untuk keperluan ini adalah memanfaatkan fasilitas evaluasi ekspresi bawaan peramban. Cara tersebut tidak digunakan dalam media ini."],
  ["p", "Alasannya bersifat praktis. Banyak sistem pengelolaan pembelajaran di sekolah menyajikan bahan dalam bingkai dengan kebijakan keamanan konten yang ketat, dan kebijakan tersebut memblokir fasilitas evaluasi bawaan. Apabila fasilitas tersebut digunakan, seluruh pemeriksa bentuk aljabar akan diam-diam gagal tanpa pesan kesalahan, sehingga jawaban benar peserta didik dinyatakan keliru. Oleh karena itu, mesin penilai ditulis sendiri berupa pemindai token dan pengurai turun rekursif."],
  ["p", "Kesetaraan dua bentuk aljabar diperiksa secara numerik dengan menghitung nilai kedua bentuk pada sejumlah titik uji yang berbeda, termasuk titik bernilai negatif dan pecahan. Dua bentuk dinyatakan setara apabila nilainya bersesuaian pada seluruh titik uji tersebut."],

  ["h3", "3. Pengenalan Objek pada Modul 2"],
  ["p", "Modul 2 harus mengenali papan majalah dinding berbentuk segi empat dari gambar kamera. Pengolahan dilakukan seluruhnya di dalam peramban melalui tahapan berikut: pengubahan ke aras keabuan, pendeteksian tepi dengan penapis Sobel, penentuan ambang berdasarkan persentil, pencarian garis dengan transformasi Hough berbobot gradien, dan penyaringan hipotesis segi empat."],
  ["p", "Pada tahap pengujian awal, pendeteksi justru mengunci bingkai gambar itu sendiri alih-alih papan. Penyebabnya adalah piksel pada batas gambar bernilai nol setelah penapisan, sehingga membentuk tepi paling kuat pada keseluruhan gambar. Persoalan tersebut diatasi dengan menyalin larik gambar sebelum penapisan dan menetapkan sempadan selebar tiga piksel yang diabaikan."],
  ["p", "Berdasarkan pengujian pada seratus lima puluh adegan simulasi, pendeteksi berhasil mengunci papan secara tepat pada tujuh puluh tujuh persen adegan, dengan galat nisbah antarsisi bermedian satu koma tiga persen. Karena angka tersebut jauh dari sempurna, jalur penyuntingan sudut secara manual dengan jari tidak diposisikan sebagai jalur darurat melainkan sebagai jalur utama. Bahkan terdapat lencana Tangan Sendiri yang justru diberikan kepada peserta didik yang menggeser sudut secara manual."],

  ["h3", "4. Pengenalan Kartu pada Modul 4"],
  ["p", "Modul 4 harus membedakan kartu berbentuk persegi dari kartu berbentuk lingkaran, dalam keadaan kartu dapat diletakkan dengan sudut putar sembarang. Tahapannya meliputi pengubahan ke aras keabuan, penentuan ambang dengan metode Otsu, pelabelan komponen terhubung, dan pengklasifikasian bentuk."],
  ["p", "Pengklasifikasian bentuk tidak menggunakan perbandingan sisi kotak pembatas, karena ukuran tersebut runtuh ketika kartu persegi diputar empat puluh lima derajat. Sebagai gantinya digunakan nisbah jari-jari tepi terhadap titik berat, yaitu persentil kesembilan puluh dibagi persentil kelima belas. Nisbah tersebut tidak berubah ketika kartu diputar. Berdasarkan pengukuran pada tujuh ratus kartu, nisbah untuk lingkaran berkisar antara 1,10 sampai 1,18 dan untuk persegi berkisar antara 1,29 sampai 1,41, sehingga ambang 1,235 terletak pada jurang di antara kedua sebaran. Ketepatan penghitungan mencapai sembilan puluh sembilan persen pada seratus lima puluh adegan simulasi."],

  ["h3", "5. Sandi Pelaporan dan Sandi Simpan"],
  ["p", "Media ini tidak menggunakan peladen, sehingga diperlukan cara agar hasil kerja peserta didik dapat sampai kepada guru dan agar kemajuan dapat dipindahkan antarperangkat. Untuk keperluan tersebut dikembangkan dua jenis sandi ringkas."],
  ["p", "Sandi pelaporan, yang disebut KODE JEJAK, memampatkan status keenam kode salah paham peserta didik ke dalam rangkaian aksara pendek yang dapat disalin dengan tangan atau dikirim melalui aplikasi perpesanan. Guru menempelkan kumpulan sandi tersebut pada Panel Guru, dan panel akan menyusun sebaran salah paham satu kelas tanpa memerlukan peladen maupun akun."],
  ["p", "Sandi simpan berfungsi memindahkan kemajuan antarperangkat. Keduanya menggunakan penyandian bit yang dipetakan ke abjad base32 varian Crockford, yang meniadakan aksara I, L, O, dan U untuk menghindari kekeliruan pembacaan, serta dilengkapi dua aksara sidik periksa. Panjang sandi berkisar antara enam belas sampai tiga puluh aksara, cukup pendek untuk disalin ke buku tulis. Pengujian menunjukkan bahwa sidik periksa menolak seluruh variasi kekeliruan penulisan satu aksara serta seluruh variasi pertukaran posisi dua aksara yang diuji."],
  ["p", "Perlu ditegaskan bahwa sandi tersebut dapat dipalsukan oleh peserta didik yang memahami cara kerjanya. Hal ini dapat diterima karena sandi tersebut digunakan untuk asesmen formatif, bukan untuk penilaian yang menentukan nilai rapor."],

  ["h3", "6. Pengujian"],
  ["p", "Seluruh modul diuji menggunakan berkas uji otomatis yang menjalankan media pada peramban tanpa tampilan dan memeriksa perilakunya. Jumlah uji yang dijalankan disajikan pada Tabel 3."],
  ["tabel3"],
  ["p", "Pengujian tidak hanya memeriksa keadaan normal, melainkan juga keadaan tidak lazim yang lazim terjadi di sekolah, misalnya ketika penyimpanan peramban diblokir oleh kebijakan perangkat, ketika data simpanan rusak, ketika kamera tidak dapat dibuka, dan ketika media dijalankan di dalam bingkai dengan kebijakan keamanan konten yang ketat."],
  ["p", "Beberapa temuan pengujian mengubah rancangan secara berarti. Salah satunya, ditemukan bahwa kode salah paham ditampilkan kepada peserta didik tetapi tidak pernah didaftarkan ke peta salah paham, padahal umpan baliknya menjanjikan hal tersebut. Temuan lainnya, ditemukan bahwa peserta didik yang menuliskan bentuk aljabar benar dengan huruf yang berbeda dinyatakan keliru dan bahkan diberi umpan balik kode M2, yaitu salah diagnosis yang justru merugikan peserta didik yang sudah paham. Temuan terakhir inilah yang melahirkan kebijakan penggunaan huruf pada butir A.6."],

  ["h2", "D. Penggunaan Media"],

  ["h3", "1. Penggunaan di Dalam Kelas"],
  ["p", "Modul 1 digunakan pada pembelajaran di dalam kelas dengan alokasi dua sampai tiga jam pelajaran. Peserta didik membuka menu utama, memilih Modul 1, dan menempuh empat pos secara berurutan. Guru dapat membuka seluruh pos sekaligus melalui pranala yang disediakan apabila diperlukan untuk keperluan peragaan."],
  ["p", "Pada akhir kegiatan, peserta didik mencetak Lembar Kerja dalam bentuk PDF yang memuat jawaban, umpan balik yang diterima, peta salah paham, serta poin dan lencana yang diperoleh. Lembar tersebut dikumpulkan kepada guru sebagai bukti kerja yang utuh, bukan sekadar daftar nilai."],

  ["h3", "2. Penggunaan di Luar Kelas"],
  ["p", "Modul 2 digunakan di luar kelas, dengan papan majalah dinding sekolah sebagai objek. Peserta didik memindai papan dengan kamera, memeriksa bentuk aljabar yang disusun sistem, mengukur papan dengan meteran, memasukkan hasil ukur, dan menghitung kelilingnya. Sistem memeriksa kewajaran hasil ukur berdasarkan nisbah antarsisi hasil pindaian tanpa mengetahui ukuran sebenarnya."],
  ["p", "Kegiatan ini memerlukan pengawasan guru karena peserta didik bergerak di luar ruang kelas dan menggunakan alat ukur. Waktu yang diperlukan berkisar satu jam pelajaran."],

  ["h3", "3. Penggunaan Mandiri"],
  ["p", "Modul 3 digunakan secara mandiri di rumah maupun sebagai penugasan. Modul ini terdiri atas enam wilayah, masing-masing untuk satu kode salah paham, dengan empat tingkat pada setiap wilayah. Soal dibangkitkan dengan angka acak sehingga tidak pernah habis dan urutannya tidak dapat dihafalkan."],
  ["p", "Apabila terdapat kode yang bermasalah, layar hasil tidak berhenti pada angka melainkan mengarahkan peserta didik kembali ke Modul 1, dengan alasan bahwa menambah jam latihan tidak menghapus salah paham."],

  ["h3", "4. Penggunaan dengan Kartu Cetak"],
  ["p", "Modul 4 digunakan di meja dengan kartu yang telah dicetak dan dipotong. Peserta didik menempuh delapan misi yang berganti-ganti arah. Pada arah pertama, kamera membaca susunan kartu dan peserta didik menuliskan bentuk aljabarnya. Pada arah kedua, sistem meminta suatu bentuk aljabar dan peserta didik menyusun kartunya."],
  ["p", "Arah latihan ditentukan oleh misi, bukan dipilih peserta didik. Alasannya, apabila peserta didik boleh memilih, hampir seluruhnya akan bertahan pada arah pertama karena arah kedua terasa lebih sulit. Padahal justru arah kedua yang jarang dilatih di kelas, sedangkan menerjemahkan lambang kembali menjadi benda merupakan pengujian pemahaman yang lebih tajam daripada menamai apa yang sudah terlihat."],

  ["h3", "5. Penggunaan oleh Guru"],
  ["p", "Panel Guru diakses dari dalam Modul 1. Guru menempelkan kumpulan KODE JEJAK yang dikirimkan peserta didik, misalnya melalui aplikasi perpesanan, lalu panel menyusun sebaran salah paham satu kelas beserta peringkat kode yang paling banyak muncul. Panel ini sengaja tidak diberi lapisan permainan, karena yang diperlukan guru adalah data, bukan permainan."],
  ["p", "Berdasarkan sebaran tersebut, guru dapat menentukan kode mana yang perlu dibahas kembali secara klasikal dan peserta didik mana yang memerlukan pendampingan pada kode tertentu."],

  ["h3", "6. Batasan Penggunaan"],
  ["p", "Terdapat sejumlah batasan yang perlu diketahui pengguna. Pertama, peramban hanya mengizinkan akses kamera melalui sambungan aman atau melalui alamat lokal, sehingga Modul 2 dan Modul 4 tidak dapat menggunakan kamera apabila berkas dibuka langsung dari penyimpanan. Untuk keperluan tersebut disediakan contoh simulasi, unggah foto, dan penghitung manual, serta media dapat ditempatkan pada layanan penampung laman statis."],
  ["p", "Kedua, pengenalan objek pada Modul 2 mensyaratkan pemotretan yang mendekati tegak lurus terhadap bidang papan, dan sistem memperingatkan peserta didik apabila selisih panjang sisi berseberangan melebihi dua puluh lima persen. Ketiga, pengenalan kartu pada Modul 4 mensyaratkan kartu tidak saling bersentuhan dan tidak tertutup bayangan tangan. Keempat, peramban yang tertanam di dalam aplikasi perpesanan atau media sosial sering memblokir akses kamera, sehingga media sebaiknya dibuka melalui peramban biasa."]
],

/* ================= BAB IV ================= */
bab4: [
  ["h2", "A. Kesimpulan"],
  ["p", "Berdasarkan uraian pada bab-bab sebelumnya, dapat disimpulkan sebagai berikut."],
  ["num", [
    "Media pembelajaran JEJAK ALJABAR dirancang dengan menempatkan diagnosis jenis salah paham sebagai inti kerja media. Enam kode salah paham yang diturunkan dari kajian pustaka digunakan bersama oleh mesin diagnostik, teman sebaya buatan, pembangkit soal, dan sandi pelaporan, sehingga umpan balik bagi peserta didik, soal yang diberikan, dan laporan bagi guru menggunakan kosakata yang sama.",
    "Media dibuat menggunakan HTML, CSS, dan JavaScript murni tanpa pustaka pihak ketiga, tanpa peladen, tanpa akun, dan tanpa kunci antarmuka pemrograman aplikasi, sehingga dapat dijalankan secara luring dan tidak memindahkan data peserta didik ke luar perangkat. Mesin penilai bentuk aljabar, pengenalan objek pada Modul 2, dan pengenalan kartu pada Modul 4 seluruhnya ditulis sendiri dan telah diuji melalui dua ratus sembilan puluh lima uji otomatis.",
    "Media digunakan dalam empat suasana yang berbeda, yaitu pembelajaran di dalam kelas, kegiatan pengukuran di luar kelas, latihan mandiri, dan kegiatan dengan kartu cetak, serta dilengkapi Panel Guru yang merangkum sebaran salah paham satu kelas tanpa memerlukan peladen."
  ]],
  ["p", "Prinsip perancangan yang diajukan dalam penulisan ini, yaitu bahwa kamera memberikan struktur sedangkan peserta didik memberikan besaran, menjadikan keterbatasan kamera tunggal sebagai mesin didaktis. Apabila kemampuan mengukur secara otomatis diberikan kepada sistem, variabel dalam kegiatan tersebut akan kehilangan alasan keberadaannya."],

  ["h2", "B. Saran"],
  ["h3", "1. Keterbatasan yang Perlu Dinyatakan"],
  ["p", "Keterbatasan terpenting dari media ini harus dinyatakan secara terbuka: media ini belum diujicobakan kepada peserta didik sesungguhnya. Seluruh angka ketepatan yang disebutkan pada Bab III, yaitu tujuh puluh tujuh persen untuk Modul 2 dan sembilan puluh sembilan persen untuk Modul 4, berasal dari adegan simulasi dan bukan dari pengambilan gambar di lapangan. Pada koridor sekolah yang ramai, pencahayaan yang tidak merata, dan kertas yang melengkung, angka tersebut hampir pasti menurun. Demikian pula, keefektifan media dalam mengurangi salah paham peserta didik belum diukur."],
  ["p", "Keterbatasan kedua berkaitan dengan lapisan permainan. Sebagaimana diuraikan pada Bab II, Deci, Koestner, dan Ryan (1999) melaporkan bahwa imbalan yang bersifat kontingen terhadap penyelesaian tugas menurunkan motivasi intrinsik, dan bahwa imbalan verbal nyaris tidak berpengaruh pada anak-anak. Sistem poin dalam media ini pada dasarnya bersifat kontingen terhadap penyelesaian butir, sehingga tidak kebal terhadap temuan tersebut. Aturan bahwa poin diberikan untuk pemulihan sekurang-kurangnya menjaga agar lapisan permainan tidak bertentangan dengan pendirian pokok media, tetapi hal itu belum tentu meniadakan risikonya."],
  ["p", "Keterbatasan ketiga, taksonomi enam kode yang digunakan merupakan penyederhanaan. Salah paham peserta didik pada kenyataannya dapat bertumpuk dan tidak selalu jatuh tepat pada satu kode."],

  ["h3", "2. Saran Pengembangan"],
  ["p", "Berdasarkan keterbatasan tersebut, disarankan hal-hal berikut. Pertama, perlu dilakukan uji coba kepada peserta didik sesungguhnya, sekurang-kurangnya pada satu kelas, untuk memperoleh angka ketepatan pengenalan objek dalam keadaan nyata sekaligus untuk mengamati bagaimana peserta didik menanggapi umpan balik berbasis kode salah paham."],
  ["p", "Kedua, perlu dilakukan pengujian keefektifan melalui rancangan yang membandingkan capaian peserta didik sebelum dan sesudah penggunaan media, dengan instrumen yang mengukur jenis salah paham dan bukan hanya skor."],
  ["p", "Ketiga, perlu dipertimbangkan penyediaan Lembar Kerja PDF pada Modul 2, karena saat ini fasilitas tersebut baru tersedia pada Modul 1."],
  ["p", "Keempat, perlu dipertimbangkan penerjemahan media ke dalam bahasa Inggris untuk memperluas kemungkinan pemakaiannya."],

  ["tr", "Ghozian: bagian saran sebaiknya Anda tambahi satu butir yang berangkat dari rencana Anda sendiri — misalnya rencana penggunaan media ini di sekolah Anda pada semester mendatang, atau rencana pengembangannya menjadi bahan penelitian. Juri menyukai saran yang terlihat akan benar-benar dikerjakan, bukan saran umum."]
],

/* ================= DAFTAR PUSTAKA ================= */
pustaka: [
  "Ahmad, N. I. N., & Junaini, S. N. (2020). Augmented reality for learning mathematics: A systematic literature review. International Journal of Emerging Technologies in Learning (iJET), 15(16), 106–122. https://doi.org/10.3991/ijet.v15i16.14961",
  "Ahsan, M. G. K., Cahyono, A. N., & Kharisudin, I. (2023). Learning mathematical modelling with digital tools: A systematic literature review. AIP Conference Proceedings, 2614, 040082. https://doi.org/10.1063/5.0126587",
  "Ahsan, M. G. K., Cahyono, A. N., & Kharisudin, I. (2024). Designing digital math trail environment assisted by augmented reality using mathematical modeling learning approach. AIP Conference Proceedings, 3116, 050005. https://doi.org/10.1063/5.0215762",
  "Ahsan, M. G. K., Cahyono, A. N., & Prabowo, A. (2021). Desain web-apps-based student worksheet dengan pendekatan computational thinking pada pembelajaran matematika di masa pandemi. PRISMA, Prosiding Seminar Nasional Matematika, 4, 344–352.",
  "Ahsan, M. G. K., Miftahudin, & Cahyono, A. N. (2020). Designing augmented reality-based mathematics mobile apps for outdoor mathematics learning. Journal of Physics: Conference Series, 1567(3), 032004. https://doi.org/10.1088/1742-6596/1567/3/032004",
  "Biswas, G., Leelawong, K., Schwartz, D., & Vye, N. (2005). Learning by teaching: A new agent paradigm for educational software. Applied Artificial Intelligence, 19(3–4), 363–392. https://doi.org/10.1080/08839510590910200",
  "Black, P., & Wiliam, D. (1998). Assessment and classroom learning. Assessment in Education: Principles, Policy & Practice, 5(1), 7–74. https://doi.org/10.1080/0969595980050102",
  "Booth, L. R. (1988). Children's difficulties in beginning algebra. Dalam A. F. Coxford & A. P. Shulte (Ed.), The ideas of algebra, K–12 (hlm. 20–32). National Council of Teachers of Mathematics.",
  "Bujak, K. R., Radu, I., Catrambone, R., MacIntyre, B., Zheng, R., & Golubski, G. (2013). A psychological perspective on augmented reality in the mathematics classroom. Computers & Education, 68, 536–544. https://doi.org/10.1016/j.compedu.2013.02.017",
  "Cahyono, A. N., & Ludwig, M. (2019). Teaching and learning mathematics around the city supported by the use of digital technology. Eurasia Journal of Mathematics, Science and Technology Education, 15(1), em1654. https://doi.org/10.29333/ejmste/99514",
  "Cahyono, A. N., Sukestiyarno, Y. L., Asikin, M., Miftahudin, Ahsan, M. G. K., & Ludwig, M. (2020). Learning mathematical modelling with augmented reality mobile math trails program: How can it work? Journal on Mathematics Education, 11(2), 181–192. https://doi.org/10.22342/jme.11.2.10729.181-192",
  "Chase, C. C., Chin, D. B., Oppezzo, M. A., & Schwartz, D. L. (2009). Teachable agents and the protégé effect: Increasing the effort towards learning. Journal of Science Education and Technology, 18(4), 334–352. https://doi.org/10.1007/s10956-009-9180-4",
  "Clement, J. (1982). Algebra word problem solutions: Thought processes underlying a common misconception. Journal for Research in Mathematics Education, 13(1), 16–30.",
  "Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin, 125(6), 627–668. https://doi.org/10.1037/0033-2909.125.6.627",
  "Flavin, E., Hwang, S., & Flavin, M. T. (2025). Augmented reality for mathematics achievement: A meta-analysis of main and moderator effects. International Journal of Science and Mathematics Education, 23(7), 2305–2330. https://doi.org/10.1007/s10763-025-10546-x",
  "Freudenthal, H. (1973). Mathematics as an educational task. D. Reidel. https://doi.org/10.1007/978-94-010-2903-2",
  "Freudenthal, H. (1991). Revisiting mathematics education: China lectures. Kluwer Academic Publishers.",
  "Gravemeijer, K. (1999). How emergent models may foster the constitution of formal mathematics. Mathematical Thinking and Learning, 1(2), 155–177. https://doi.org/10.1207/s15327833mtl0102_4",
  "Hattie, J., & Timperley, H. (2007). The power of feedback. Review of Educational Research, 77(1), 81–112. https://doi.org/10.3102/003465430298487",
  "Kieran, C. (1981). Concepts associated with the equality symbol. Educational Studies in Mathematics, 12(3), 317–326. https://doi.org/10.1007/BF00311062",
  "Koten, O., Sulistyowati, F., Ahsan, M. G. K., & Kuncoro, K. S. (2023). Understanding common errors in solving math problems on systems of linear equations with two variables: A study of 8th grade students. UNION: Jurnal Ilmiah Pendidikan Matematika, 11(2), 348–355. https://doi.org/10.30738/union.v11i2.14910",
  "Küchemann, D. (1981). Algebra. Dalam K. M. Hart (Ed.), Children's understanding of mathematics: 11–16 (hlm. 102–119). John Murray.",
  "Leelawong, K., & Biswas, G. (2008). Designing learning by teaching agents: The Betty's Brain system. International Journal of Artificial Intelligence in Education, 18(3), 181–208.",
  "Ludwig, M., & Jesberg, J. (2015). Using mobile technology to provide outdoor modelling tasks: The MathCityMap-project. Procedia — Social and Behavioral Sciences, 191, 2776–2781. https://doi.org/10.1016/j.sbspro.2015.04.517",
  "MacGregor, M., & Stacey, K. (1997). Students' understanding of algebraic notation: 11–15. Educational Studies in Mathematics, 33(1), 1–19. https://doi.org/10.1023/A:1002970913563",
  "Posner, G. J., Strike, K. A., Hewson, P. W., & Gertzog, W. A. (1982). Accommodation of a scientific conception: Toward a theory of conceptual change. Science Education, 66(2), 211–227. https://doi.org/10.1002/sce.3730660207",
  "Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. Educational Psychology Review, 32(1), 77–112. https://doi.org/10.1007/s10648-019-09498-w",
  "Shoaf, M. M., Pollak, H., & Schneider, J. (2004). Math trails. COMAP."
]

};
