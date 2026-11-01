import type { PadewasanItem } from '../types/alaAyuning.types';

/**
 * ============================================================================
 * DATA MASTER 220 ALA AYUNING DEWASA (PADEWASAN KALENDER BALI)
 * ============================================================================
 * Sumber: Tabel resmi kalenderbali_normalized.calendar_reference_values & ala_ayuning_dewasas
 * Berisi 220 kriteria padewasan otentik lengkap dengan nama, uraian sastra, dan severity_code.
 * Berfungsi sebagai jaring pengaman (fallback & lookup) agar nama dan uraian selalu tampil utuh.
 * ============================================================================
 */
export const MASTER_PADEWASAN_LIST: PadewasanItem[] = [
  {
    "id": "1",
    "nama": "Agni Agung Doyan Basmi",
    "keterangan": "Bersifat panas, tidak baik membangun rumah, terutama tidak baik mengatapi rumah, karena mudah terbakar. Baik untuk mulai membakar bata, genteng, gerabah, keramik, tembikar, dan lain-lain.",
    "severity_code": "4"
  },
  {
    "id": "2",
    "nama": "Agni Agung Patra Limutan",
    "keterangan": "Baik membuat/meramu obat-obatan, menghilangkan yang angker. Tidak baik membangun rumah, mengatapi rumah, pindah rumah, atau memasuki rumah baru.",
    "severity_code": "4"
  },
  {
    "id": "3",
    "nama": "Amerta Akasa",
    "keterangan": "Baik untuk memuja leluhur/Pitra Yadnya dan Dewa Yadnya",
    "severity_code": "2"
  },
  {
    "id": "4",
    "nama": "Amerta Bumi",
    "keterangan": "Baik untuk perkawinan (nikah).",
    "severity_code": "2"
  },
  {
    "id": "5",
    "nama": "Amerta Bhuwana",
    "keterangan": "Baik untuk upacara Dewa Yadnya dan Pitra Yadnya",
    "severity_code": "2"
  },
  {
    "id": "6",
    "nama": "Amerta Dadi",
    "keterangan": "Baik untuk upacara Dewa Yadnya dan pemujaan terhadap leluhur.",
    "severity_code": "4"
  },
  {
    "id": "7",
    "nama": "Amerta Danta",
    "keterangan": "Baik untuk melakukan tapa, brata, yoga, semadi, penyucian diri, segala pekerjaan.",
    "severity_code": "2"
  },
  {
    "id": "8",
    "nama": "Amerta Dewa",
    "keterangan": "Baik untuk melakukan Panca Yadnya khususnya Dewa Yadnya, membangun tempat-tempat suci/ibadah, membuat lumbung maupun dapur.",
    "severity_code": "2"
  },
  {
    "id": "9",
    "nama": "Amerta Dewa Jaya",
    "keterangan": "Baik untuk hal-hal yang mengandung unsur keunggulan.",
    "severity_code": "2"
  },
  {
    "id": "10",
    "nama": "Amerta Dewata",
    "keterangan": "Baik untuk semua upacara.",
    "severity_code": "2"
  },
  {
    "id": "11",
    "nama": "Amerta Gati",
    "keterangan": "Baik untuk memaulai suatu usaha, bercocok tanam.",
    "severity_code": "2"
  },
  {
    "id": "12",
    "nama": "Amerta Kundalini",
    "keterangan": "Baik untuk bercocok tanam, segala kegiatan atau yadnya.",
    "severity_code": "2"
  },
  {
    "id": "13",
    "nama": "Amerta Masa",
    "keterangan": "Baik untuk upacara Dewa Yadnya, membangun, dan bercocok tanam.",
    "severity_code": "2"
  },
  {
    "id": "14",
    "nama": "Amerta Murti",
    "keterangan": "Baik untuk melakukan upacara Manusa Yadnya, upacara potong gigi",
    "severity_code": "2"
  },
  {
    "id": "15",
    "nama": "Amerta Pageh",
    "keterangan": "Baik untuk upacara Dewa Yadnya.",
    "severity_code": "2"
  },
  {
    "id": "16",
    "nama": "Amerta Papageran",
    "keterangan": "Tidak baik untuk melakukan dewasa ayu karena mengandung pengaruh sakit-sakitan.",
    "severity_code": "4"
  },
  {
    "id": "17",
    "nama": "Amerta Sari",
    "keterangan": "Baik untuk upacara Dewa Yadnya di sanggah/merajan, menanam bunga-bungaan.",
    "severity_code": "2"
  },
  {
    "id": "18",
    "nama": "Amerta Wija",
    "keterangan": "Baik untuk upacara Dewa Yadnya, menanam biji-bijian.",
    "severity_code": "2"
  },
  {
    "id": "19",
    "nama": "Amertayoga",
    "keterangan": "Baik untuk membangun, mencari pengupa jiwa (nafkah), dan memulai suatu usaha/perusahaan.",
    "severity_code": "3,"
  },
  {
    "id": "20",
    "nama": "Asuajeg Munggah",
    "keterangan": "Baik untuk membuat alat-alat yang menakutkan seperti lelakut. Tidak baik untuk menanam padi, kacang-kacangan.",
    "severity_code": "3"
  },
  {
    "id": "21",
    "nama": "Asuajeg Turun",
    "keterangan": "Baik untuk membuat penakut, menanam padi, kacang-kacangan, sirih. berburu, membuat alat bunyi-bunyian, kentongan, gamelan, genta, dll.",
    "severity_code": "3"
  },
  {
    "id": "22",
    "nama": "Asuasa",
    "keterangan": "Mengandung sifat boros, tidak baik untuk berbelanja, tidak baik untuk dewasa ayu.",
    "severity_code": "3"
  },
  {
    "id": "23",
    "nama": "Ayu Badra",
    "keterangan": "Baik untuk memulai suatu usaha, bercocok tanam, membangun.",
    "severity_code": "2"
  },
  {
    "id": "24",
    "nama": "Ayu Dana",
    "keterangan": "Hari Baik melaksanakan Panca Yadnya, segala macam pekerjaan, berdana punia, bersuci laksana, mengajukan permohonan, bercocok tanam.",
    "severity_code": "2"
  },
  {
    "id": "25",
    "nama": "Ayu Nulus",
    "keterangan": "Baik untuk segala usaha.",
    "severity_code": "2"
  },
  {
    "id": "26",
    "nama": "Babi Munggah",
    "keterangan": "Tidak baik untuk bercocok tanam.",
    "severity_code": "4"
  },
  {
    "id": "27",
    "nama": "Babi Turun",
    "keterangan": "Baik untuk memasang sesirep.",
    "severity_code": "4"
  },
  {
    "id": "28",
    "nama": "Banyu Milir",
    "keterangan": "Baik untuk membuat sumur, kolam, membuka jalan air, ngirisin (menyadap nira).",
    "severity_code": "3"
  },
  {
    "id": "29",
    "nama": "Banyu Urug",
    "keterangan": "Baik untuk membuat bendungan. Tidak baik untuk membuat sumur.",
    "severity_code": "3"
  },
  {
    "id": "30",
    "nama": "Bojog Munggah",
    "keterangan": "Tidak baik untuk menanam padi, jagung.",
    "severity_code": "4"
  },
  {
    "id": "31",
    "nama": "Bojog Turun",
    "keterangan": "Baik untuk menyetem gambelan.",
    "severity_code": "4"
  },
  {
    "id": "32",
    "nama": "Buda Gajah",
    "keterangan": "Baik untuk melakukan tapa, brata, yoga, semadi, upacara penyucian (pebersihan lahir batin), dan upacara Dewa Yadnya.",
    "severity_code": "2"
  },
  {
    "id": "33",
    "nama": "Buda Ireng",
    "keterangan": "Baik untuk segala pekerjaan.",
    "severity_code": "2"
  },
  {
    "id": "34",
    "nama": "Buda Suka",
    "keterangan": "Baik untuk segala pekerjaan.",
    "severity_code": "2"
  },
  {
    "id": "35",
    "nama": "Carik Walangati",
    "keterangan": "Tidak baik untuk melakukan pernikahan/wiwaha, atiwa-tiwa/ngaben dan membangun rumah.",
    "severity_code": "3"
  },
  {
    "id": "36",
    "nama": "Catur Laba",
    "keterangan": "Baik untuk bepergian menuju arah utara, upacara Manusa Yadnya, dan Pitra Yadnya.",
    "severity_code": "4"
  },
  {
    "id": "37",
    "nama": "Cintamanik",
    "keterangan": "Baik untuk melakukan upacara potong rambut.",
    "severity_code": "3"
  },
  {
    "id": "38",
    "nama": "Corok Kodong",
    "keterangan": "Baik untuk membuat jaring.",
    "severity_code": "3"
  },
  {
    "id": "39",
    "nama": "Dadig Krana",
    "keterangan": "Baik untuk menanam tebu, mentimun. Tidak baik untuk upacara atau yadnya, mengadakan pertemuan (rapat), berenggama.",
    "severity_code": "2"
  },
  {
    "id": "40",
    "nama": "Dasa Amerta",
    "keterangan": "Baik untuk melakukan upacara pembersihan diri, upacara potong gigi, pernikahan tanpa memperhitungkan sasih.",
    "severity_code": "2"
  },
  {
    "id": "41",
    "nama": "Dasa Guna",
    "keterangan": "Baik untuk membuat bangunan suci, pelantikan pengurus/pejabat.",
    "severity_code": "2"
  },
  {
    "id": "42",
    "nama": "Dauh Ayu",
    "keterangan": "Baik untuk membuat awig-awig, peraturan-peraturan atau undang-undang, baik untuk membangun.",
    "severity_code": "2"
  },
  {
    "id": "43",
    "nama": "Derman Bagia",
    "keterangan": "Baik untuk nikah, membangun, mulai belajar/berlatih, belajar menari.",
    "severity_code": "2"
  },
  {
    "id": "44",
    "nama": "Dewa Ngelayang",
    "keterangan": "Baik untuk membuat bangunan suci, Dewa Yadnya dan Pitra Yadnya.",
    "severity_code": "2"
  },
  {
    "id": "45",
    "nama": "Dewa Stata",
    "keterangan": "Baik untuk melakukan Panca Yadnya, khususnya Dewa Yadnya.",
    "severity_code": "2"
  },
  {
    "id": "46",
    "nama": "Dewa Werdi",
    "keterangan": "Baik untuk upacara Dewa Yadnya, upacara potong gigi.",
    "severity_code": "2"
  },
  {
    "id": "47",
    "nama": "Dewasa Mentas",
    "keterangan": "Baik untuk melakukan segala macam yadnya, upacara penyucian (pembersihan), memberi petuah-petuah (nasehat), memberi petunjuk jalan yang berguna, serta baik untuk membangun.",
    "severity_code": "2"
  },
  {
    "id": "48",
    "nama": "Dewasa Ngelayang",
    "keterangan": "Baik untuk membangun rumah, membuat jukung dan sejenisnya.",
    "severity_code": "2"
  },
  {
    "id": "49",
    "nama": "Dewasa Tanian",
    "keterangan": "Baik untuk mulai menanam, mulai suatu usaha pertanian.",
    "severity_code": "2"
  },
  {
    "id": "50",
    "nama": "Dina Carik",
    "keterangan": "Tidak baik dipakai dewasa.",
    "severity_code": "2"
  },
  {
    "id": "51",
    "nama": "Dina Jaya",
    "keterangan": "Baik untuk belajar menari atau pengetahuan yang lain dan mengandung unsur keunggulan.",
    "severity_code": "2"
  },
  {
    "id": "52",
    "nama": "Dina Mandi",
    "keterangan": "Baik untuk upacara penyucian diri, memberikan petuah-petuah, membuat jimat.",
    "severity_code": "2"
  },
  {
    "id": "53",
    "nama": "Dirgahayu",
    "keterangan": "Baik untuk mulai belajar.",
    "severity_code": "4"
  },
  {
    "id": "54",
    "nama": "Dirgayusa",
    "keterangan": "Baik untuk upacara Manusa Yadnya seperti potong gigi dan lain-lain.",
    "severity_code": "2"
  },
  {
    "id": "55",
    "nama": "Gagak Anungsang Pati",
    "keterangan": "Tidak baik melakukan upacara membakar mayat, atiwa-tiwa",
    "severity_code": "2"
  },
  {
    "id": "56",
    "nama": "Geheng Manyinget",
    "keterangan": "Tidak baik untuk segala pekerjaan yang penting-penting termasuk melakukan yadnya karena banyak ganguan.",
    "severity_code": "2"
  },
  {
    "id": "57",
    "nama": "Geni Agung",
    "keterangan": "Tidak baik dipakai dewasa, sangat buruk.",
    "severity_code": "2"
  },
  {
    "id": "58",
    "nama": "Geni Murub",
    "keterangan": "Baik untuk segala pekerjaan yang mempergunakan api seperti membakar bata mentah, genteng, dan lain-lain. Tidak baik untuk membangun, mengatapi rumah.",
    "severity_code": "2"
  },
  {
    "id": "59",
    "nama": "Geni Rawana",
    "keterangan": "Baik untuk segala pekerjaan yang menggunakan api. Tidak baik untuk mengatapi rumah, melaspas, bercocok tanam.",
    "severity_code": "2"
  },
  {
    "id": "60",
    "nama": "Gni Rawana Jejepan",
    "keterangan": "Baik untuk mulai pekerjaan yang menggunakan api seperti membakar genteng, batu bata, keramik, gerabah, membuat senjata tajam (pande besi). Tidak baik mengatapi rumah, melaspas, dan bercocok tanam.",
    "severity_code": "2"
  },
  {
    "id": "61",
    "nama": "Gni Rawana Rangkep",
    "keterangan": "Baik untuk segala pekerjaan yang mempergunakan api. Tidak baik untuk membangun, mengatapi rumah.",
    "severity_code": "2"
  },
  {
    "id": "62",
    "nama": "Guntur Umah/Graha",
    "keterangan": "Baik untuk membangun atau memindahkan rumah.",
    "severity_code": "3"
  },
  {
    "id": "63",
    "nama": "Ingkel Macan",
    "keterangan": "Baik untuk menangkap banteng/sapi, kerbau, kuda, kambing, dan sejenisnya, dan untuk berburu",
    "severity_code": "3"
  },
  {
    "id": "64",
    "nama": "Istri Payasan",
    "keterangan": "Mengandung unsur keindahan. Baik untuk melaspas dan bercocok tanam",
    "severity_code": "2"
  },
  {
    "id": "65",
    "nama": "Jiwa Menganti",
    "keterangan": "Baik untuk bercocok tanam dan memulai suatu usaha.",
    "severity_code": "3"
  },
  {
    "id": "66",
    "nama": "Kajeng Kipkipan",
    "keterangan": "Baik untuk membuat dungki (keranjang kecil tempat ikan).",
    "severity_code": "3"
  },
  {
    "id": "67",
    "nama": "Kajeng Kliwon Enyitan",
    "keterangan": "Baik untuk memulai membuat sesikepan atau sesuatu yang berkekuatan gaib",
    "severity_code": "2"
  },
  {
    "id": "68",
    "nama": "Kajeng Lulunan",
    "keterangan": "Tidak baik untuk membuat sok dan sejenisnya.",
    "severity_code": "4"
  },
  {
    "id": "69",
    "nama": "Kajeng Rendetan",
    "keterangan": "Baik untuk menanam tumbuhan yang menghasilkan buah.",
    "severity_code": "2"
  },
  {
    "id": "70",
    "nama": "Kajeng Susunan",
    "keterangan": "Baik untuk membuat sok atau sejenisnya.",
    "severity_code": "4"
  },
  {
    "id": "71",
    "nama": "Kajeng Uwudan",
    "keterangan": "Tidak baik untuk menanam dan memetik tanaman.",
    "severity_code": "2"
  },
  {
    "id": "72",
    "nama": "Kala Alap",
    "keterangan": "Baik untuk menanam kelapa.",
    "severity_code": "3"
  },
  {
    "id": "73",
    "nama": "Kala Angin",
    "keterangan": "Baik untuk memulai mengajar/melatih sapi, kerbau, kuda, dan ternak lainnya.",
    "severity_code": "3"
  },
  {
    "id": "74",
    "nama": "Kala Atat",
    "keterangan": "Baik untuk membuat tali, tali pancing, melakukan pekerjaan anyam-anyaman, tampus, jerat.",
    "severity_code": "3"
  },
  {
    "id": "75",
    "nama": "Kala Awus",
    "keterangan": "Baik untuk membuat garu (lampit). Tidak baik untuk membuat bendungan/empangan, membangun rumah.",
    "severity_code": "3"
  },
  {
    "id": "76",
    "nama": "Kala Bancaran",
    "keterangan": "Baik untuk membuat senjata, taji, pengiris (pisau besar untuk mengiris atau untuk mengadap nira).",
    "severity_code": "3"
  },
  {
    "id": "77",
    "nama": "Kala Bangkung, Kala Nanggung",
    "keterangan": "Tidak baik untuk mulai memelihara ternak.",
    "severity_code": "4"
  },
  {
    "id": "78",
    "nama": "Kala Beser",
    "keterangan": "Baik untuk menyadap tirta, mengasah taji, tombak. Tidak baik untuk membuat empangan/bendungan, berbicara yang sifatnya rahasia.",
    "severity_code": "4"
  },
  {
    "id": "79",
    "nama": "Kala Brahma",
    "keterangan": "Mengandung arti kepanasan atau kesakitan.",
    "severity_code": "3"
  },
  {
    "id": "80",
    "nama": "Kala Bregala",
    "keterangan": "Tidak baik dipakai dewasa ayu.",
    "severity_code": "3"
  },
  {
    "id": "81",
    "nama": "Kala Buingrau",
    "keterangan": "Baik untuk menebang kayu, membuat bubu, memuja pitra. Tidak baik untuk membangun, mengatapi rumah.",
    "severity_code": "4"
  },
  {
    "id": "82",
    "nama": "Kala Cakra",
    "keterangan": "Baik untuk memulai segala jenis pekerjaan, mengandung arti kebulatan tekad.",
    "severity_code": "3"
  },
  {
    "id": "83",
    "nama": "Kala Capika",
    "keterangan": "Baik untuk membuat pancing (kail), perangkap.",
    "severity_code": "2"
  },
  {
    "id": "84",
    "nama": "Kala Caplokan",
    "keterangan": "Baik untuk membuat alat-alat penangkap ikan seperti pancing (kail), jala, jaring, bubu, bahan untuk umpan.",
    "severity_code": "3"
  },
  {
    "id": "85",
    "nama": "Kala Cepitan",
    "keterangan": "Baik untuk membuat pancing, jebag/perangkap, dan alat yang berfungsi menjepit.",
    "severity_code": "3"
  },
  {
    "id": "86",
    "nama": "Kala Dangastra",
    "keterangan": "Baik untuk membangun tembok pekarangan, membuat alat-alat penangkap ikan. Tidak baik untuk memulai pekerjaan penting, tidak baik melakukan upacara (gawe ayu).",
    "severity_code": "3"
  },
  {
    "id": "87",
    "nama": "Kala Dangu",
    "keterangan": "Tidak baik untuk memulai suatu pekerjaan, pindah tempat, bepergian.",
    "severity_code": "3"
  },
  {
    "id": "88",
    "nama": "Kala Demit",
    "keterangan": "Baik untuk memasang tanda-tanda atau alat-alat yang mengandung arti larangan, membuat pagar, memasang pelindung kelapa (ngangasin), hal-hal menghalau, atau mengusir. Tidak baik unruk mengajukan permohonan.",
    "severity_code": "3"
  },
  {
    "id": "89",
    "nama": "Kala Empas Munggah",
    "keterangan": "Baik untuk membangun rumah. Tidak baik untuk memetik buah-buahan.",
    "severity_code": "4"
  },
  {
    "id": "90",
    "nama": "Kala Empas Turun",
    "keterangan": "Baik untuk menanam umbi-umbian. Tidak baik untuk membangun, memetik buah-buahan.",
    "severity_code": "4"
  },
  {
    "id": "91",
    "nama": "Kala Gacokan",
    "keterangan": "Baik untuk membuat alat-alat yang runcing seperti taji, tombak dan sebagainya.",
    "severity_code": "3"
  },
  {
    "id": "92",
    "nama": "Kala Garuda",
    "keterangan": "Tidak baik untuk dipakai dewasa ayu.",
    "severity_code": "3"
  },
  {
    "id": "93",
    "nama": "Kala Geger",
    "keterangan": "Baik untuk membuat alat-alat penangkap ikan, membuat kentongan, cagcag (perkakas tenun), kroncongan (genta sampi dari kayu), genta (bajra), kendang (bedug), gambelan, dan alat bunyi-bunyian lainnya.",
    "severity_code": "3"
  },
  {
    "id": "94",
    "nama": "Kala Gotongan",
    "keterangan": "Baik untuk memulai suatu usaha. Tidak baik untuk mengubur atau membakar mayat.",
    "severity_code": "4"
  },
  {
    "id": "95",
    "nama": "Kala Graha",
    "keterangan": "Baik untuk membangun perumahan.",
    "severity_code": "3"
  },
  {
    "id": "96",
    "nama": "Kala Gumarang Munggah",
    "keterangan": "Baik melakukan upacara Bhuta Yadnya. Tidak Baik untuk menanam sirih, tembakau.",
    "severity_code": "4"
  },
  {
    "id": "97",
    "nama": "Kala Gumarang Turun",
    "keterangan": "Baik untuk menanam sirih dan tambakau. Tidak baik untuk pembuatan bibit.",
    "severity_code": "4"
  },
  {
    "id": "98",
    "nama": "Kala Guru",
    "keterangan": "Baik untuk membuat peraturan, awig-awig.",
    "severity_code": "3"
  },
  {
    "id": "99",
    "nama": "Kala Ingsor",
    "keterangan": "Mengandung sifat/tanda-tanda mengecewakan",
    "severity_code": "3"
  },
  {
    "id": "100",
    "nama": "Kala Isinan",
    "keterangan": "Baik untuk mulai belajar, membuat almari, membuat gudang atau tempat barang-barang.",
    "severity_code": "3"
  },
  {
    "id": "101",
    "nama": "Kala Jangkut",
    "keterangan": "Baik untuk membuat pencar, jaring, senjata.",
    "severity_code": "4"
  },
  {
    "id": "102",
    "nama": "Kala Jengkang",
    "keterangan": "Baik untuk membuat alat penangkap ikan, bubu dan mengadakan sabungan ayam (tajen)",
    "severity_code": "3"
  },
  {
    "id": "103",
    "nama": "Kala Jengking",
    "keterangan": "Baik untuk mulai belajar menari, menabuh, membuat bubu, seser, jaring. Tidak baik untuk Manusa Yadnya, nikah, upacara potong rambut.",
    "severity_code": "4"
  },
  {
    "id": "104",
    "nama": "Kala Katemu",
    "keterangan": "Baik untuk menangkap ikan, berburu, mapikat, memasang jerat, kungkungan, mangadakan pertemuan.",
    "severity_code": "3"
  },
  {
    "id": "105",
    "nama": "Kala Keciran",
    "keterangan": "Baik untuk membuat pisau penyadap (pengiris), mulai memotong danggul nira, membuat atau membuka saluran air.",
    "severity_code": "3"
  },
  {
    "id": "106",
    "nama": "Kala Kilang-kilung",
    "keterangan": "Baik untuk membuat barong, membuat sok (bakul), dan segala anyam-anyaman.",
    "severity_code": "3"
  },
  {
    "id": "107",
    "nama": "Kala Kingkingan",
    "keterangan": "Tidak baik untuk meminang.",
    "severity_code": "3"
  },
  {
    "id": "108",
    "nama": "Kala Klingkung",
    "keterangan": "Baik untuk mencuri demi kepentingan umum yang bertujuan baik.",
    "severity_code": "3"
  },
  {
    "id": "109",
    "nama": "Kala Kutila Manik",
    "keterangan": "Baik untuk membuat ranjau, pagar, rintangan, lubang penghalang maupun pemisah, alat perangkap, upacara Bhuta Yadnya.",
    "severity_code": "4"
  },
  {
    "id": "110",
    "nama": "Kala KutilaÂ",
    "keterangan": "Baik untuk memulai pekerjaan yang mempergunakan api.",
    "severity_code": "4"
  },
  {
    "id": "111",
    "nama": "Kala Luang",
    "keterangan": "Baik untuk membuat terowongan, menanam ketela atau umbi-umbian.",
    "severity_code": "3"
  },
  {
    "id": "112",
    "nama": "Kala Lutung Magelut",
    "keterangan": "Baik untuk membuat/meramu obat-obatan, mencampur sadek (makanan jangkrik), mulai membikin sawuh, melakukan tapa brata. Tidak baik untuk berburu.",
    "severity_code": "3"
  },
  {
    "id": "113",
    "nama": "Kala Lutung Megandong",
    "keterangan": "Baik untuk menanam pijer (bibit kelapa yang baru tumbuh), menanam buah-buahan.",
    "severity_code": "4"
  },
  {
    "id": "114",
    "nama": "Kala Macan",
    "keterangan": "Baik untuk membuat segala yang menakutkan, membuat tombak, keris, lelakut (penakut). Tidak baik untuk berbicara yang tidak perlu",
    "severity_code": "3"
  },
  {
    "id": "115",
    "nama": "Kala Mangap",
    "keterangan": "Tidak baik untuk berbelanja, bila menggunakan hari ini akan berakibat boros.",
    "severity_code": "4"
  },
  {
    "id": "116",
    "nama": "Kala Manguneb",
    "keterangan": "Baik untuk membuat paketok (perangkap landak) dan santeb (semacam perangkap binatang).",
    "severity_code": "3"
  },
  {
    "id": "117",
    "nama": "Kala Matampak",
    "keterangan": "Baik untuk menanam segala sesuatu (bercocok tanam).",
    "severity_code": "3"
  },
  {
    "id": "118",
    "nama": "Kala Mereng",
    "keterangan": "Tidak baik untuk bercocok tanam",
    "severity_code": "3"
  },
  {
    "id": "119",
    "nama": "Kala Miled",
    "keterangan": "Baik untuk meramu obat-obatan, sadek dan yang sejenisnya.",
    "severity_code": "3"
  },
  {
    "id": "120",
    "nama": "Kala Mina",
    "keterangan": "Baik untuk membuat peralatan penangkap ikan, tombak, dan baik untuk menangkap ikan.",
    "severity_code": "3"
  },
  {
    "id": "121",
    "nama": "Kala Mretyu",
    "keterangan": "Baik untuk membuat senjata, mulai berperang membela kebenaran, memberi nasehat kepada orang lain. Tidak baik untuk bersenggama, segala yadnya.",
    "severity_code": "3"
  },
  {
    "id": "122",
    "nama": "Kala Muas",
    "keterangan": "Tidak baik untuk menanam sesuatu (bercocok tanam).",
    "severity_code": "3"
  },
  {
    "id": "123",
    "nama": "Kala Muncar",
    "keterangan": "Baik untuk membuat taji, mengasah senjata.",
    "severity_code": "3"
  },
  {
    "id": "124",
    "nama": "Kala Muncrat",
    "keterangan": "Baik untuk membuat keris, tombak, taji dll.",
    "severity_code": "3"
  },
  {
    "id": "125",
    "nama": "Kala Ngadeg",
    "keterangan": "Baik untuk membuat pintu gerbang, tembok pekarangan, pagar, sangkar ayam (guwungan), kisa pengaduan, mulai memeliharan ayam kurungan, membuat empangan/bendungan.\tRedite Pujut. Redite Krulut. Soma Tambir. Soma Kulawu. Sukra Kuningan. Sukra Watugunung.",
    "severity_code": "3"
  },
  {
    "id": "126",
    "nama": "Kala Ngamut",
    "keterangan": "Baik untuk membuat pancing (kail) dan alat-alat panangkap ikan lainnya.",
    "severity_code": "3"
  },
  {
    "id": "127",
    "nama": "Kala Ngruda",
    "keterangan": "Baik untuk membuat taji, keris, ranjau (sungga), bambu runcing (gelanggang) dan sejenisnya, membuat rencana baik. Tidak baik untuk segala pekerjaan, akan mendapat godaan/halangan sakit keras, melakukan yadnya yang besar.",
    "severity_code": "3"
  },
  {
    "id": "128",
    "nama": "Kala Ngunya",
    "keterangan": "Baik untuk berkunjung, membuat/memasang kungkungan dan bubu.",
    "severity_code": "3"
  },
  {
    "id": "129",
    "nama": "Kala Olih",
    "keterangan": "Baik untuk memulai suatu usaha. Tidak baik untuk membuat terowongan, sumur, mulai membajak.",
    "severity_code": "3"
  },
  {
    "id": "130",
    "nama": "Kala Pacekan",
    "keterangan": "Baik untuk membuat tombak, taji, keris, dan sejenisnya. Tidak baik untuk mengadakan perundingan/rapat.",
    "severity_code": "3"
  },
  {
    "id": "131",
    "nama": "Kala Pager",
    "keterangan": "Baik untuk membuat tembok, pagar, dan sejenisnya. Tidak baik untuk bepergian.",
    "severity_code": "3"
  },
  {
    "id": "132",
    "nama": "Kala Panyeneng",
    "keterangan": "Baik untuk membuat peraturan-peraturan, awig-awig, membuat tempat penyimpanan harta benda.",
    "severity_code": "3"
  },
  {
    "id": "133",
    "nama": "Kala Pati",
    "keterangan": "Baik untuk membuat jerat dan memasangnya, pembuat pengrusak. Tidak baik untuk semua upacara dan pekerjaan yang lainnya.",
    "severity_code": "3"
  },
  {
    "id": "134",
    "nama": "Kala Pati Jengkang",
    "keterangan": "Baik untuk mengadakan sabungan.",
    "severity_code": "4"
  },
  {
    "id": "135",
    "nama": "Kala Pegat",
    "keterangan": "Baik untuk mulai menyadap (ngirisin), memisah bayi menetek (melas rare). Tidak baik untuk melakukan karya ayu.",
    "severity_code": "3"
  },
  {
    "id": "136",
    "nama": "Kala Prawani",
    "keterangan": "Tidak baik untuk semua kegiatan, hari ini mengandung pengaruh yang kurang baik.",
    "severity_code": "3"
  },
  {
    "id": "137",
    "nama": "Kala Raja",
    "keterangan": "Baik untuk segala pekerjaan, mengkat atau melantik petugas atau calon pejabat.",
    "severity_code": "3"
  },
  {
    "id": "138",
    "nama": "Kala Rau",
    "keterangan": "Baik untuk meramu obat-obatan, sadek, membuat senjata, upas (penjaga). Tidak baik untuk membangun rumah, mengatapi rumah akibatnya akan terbakar, batasi berbicara yang dapat menimbulkan kekeliruan, mengawinkan orang.",
    "severity_code": "3"
  },
  {
    "id": "139",
    "nama": "Kala Rebutan",
    "keterangan": "Baik untuk membuat tempat berjualan, membuat alat-alat tempat barang dagangan, alat-alat penangkap ikan, membuat dan memasang kungkungan.",
    "severity_code": "3"
  },
  {
    "id": "140",
    "nama": "Kala Rumpuh",
    "keterangan": "Tidak baik untuk pindah rumah, memulai memelihara ayam, itik, sapi, kerbau, kambing, babi (ternak).",
    "severity_code": "3"
  },
  {
    "id": "141",
    "nama": "Kala Sapuhau",
    "keterangan": "Baik untuk membuat alat-alat pertanian seperti garu, tulud, pemlasahan, tenggala (bajak). Tidak baik untuk membangun.",
    "severity_code": "3"
  },
  {
    "id": "142",
    "nama": "Kala Sarang",
    "keterangan": "Mengandung sifat boros/terapas. Tidak baik untuk berbelanja",
    "severity_code": "3"
  },
  {
    "id": "143",
    "nama": "Kala Siyung",
    "keterangan": "Tidak baik, hari ini harus diwaspadai karena mengandung pengaruh buas.",
    "severity_code": "3"
  },
  {
    "id": "144",
    "nama": "Kala Sor",
    "keterangan": "Tidak baik untuk bekerja hubungannya dengan dengan tanah seperti membajak, bercocok tanam, membuat terowongan.",
    "severity_code": "3"
  },
  {
    "id": "145",
    "nama": "Kala Sudangastra",
    "keterangan": "Baik untuk membuat alat-alat yang runcing.",
    "severity_code": "3"
  },
  {
    "id": "146",
    "nama": "Kala Sudukan",
    "keterangan": "Tidak baik untuk memindahkan orang sakit, menunjukkan unsur perombakan.",
    "severity_code": "3"
  },
  {
    "id": "147",
    "nama": "Kala Sungsang",
    "keterangan": "Mengandung sifat/unsur terbalik, bertentangan, kontras. Tidak baik untuk melakukan karya ayu atau yadnya",
    "severity_code": "3"
  },
  {
    "id": "148",
    "nama": "Kala Susulan",
    "keterangan": "Baik untuk membuat tepis, sabang, jating.",
    "severity_code": "3"
  },
  {
    "id": "149",
    "nama": "Kala Suwung",
    "keterangan": "Tidak baik untuk dewasa ayu, berkunjung.",
    "severity_code": "3"
  },
  {
    "id": "150",
    "nama": "Kala Tampak",
    "keterangan": "Tidak baik untuk dewasa nikah (perkawinan).",
    "severity_code": "3"
  },
  {
    "id": "151",
    "nama": "Kala Temah",
    "keterangan": "Tidak baik untuk dewasa ayu.",
    "severity_code": "3"
  },
  {
    "id": "152",
    "nama": "Kala Timpang",
    "keterangan": "Baik untuk membuat senjata, membuat/memasang ranjau, guna-guna, meramu sadek, memasang sesuatu yang merupakan larangan pada tanaman. Tidak baik untuk berburu.",
    "severity_code": "3"
  },
  {
    "id": "153",
    "nama": "Kala Tukaran",
    "keterangan": "Baik untuk memasang jaring/tepis, mapikat (mencari burung), mulai melatih atau mengajar burung.",
    "severity_code": "3"
  },
  {
    "id": "154",
    "nama": "Kala Tumapel",
    "keterangan": "Baik untuk membuat topeng (tapel), membuat dan memasang kungkungan (tempat mengurung lebah.",
    "severity_code": "3"
  },
  {
    "id": "155",
    "nama": "Kala Tumpar",
    "keterangan": "Tidak baik untuk dewasa ayu karena mengandung unsur kecewa.",
    "severity_code": "3"
  },
  {
    "id": "156",
    "nama": "Kala Upa",
    "keterangan": "Baik untuk memulai mengambil/memelihara ternak (wewalungan).",
    "severity_code": "4"
  },
  {
    "id": "157",
    "nama": "Kala Was",
    "keterangan": "Baik untuk mengebiri (melesin) hewan, menebang kayu untuk bahan bangunan.",
    "severity_code": "3"
  },
  {
    "id": "158",
    "nama": "Kala Wikalpa",
    "keterangan": "Baik untuk membuat keris dan yang sejenisnya.",
    "severity_code": "3"
  },
  {
    "id": "159",
    "nama": "Kala Wisesa",
    "keterangan": "Baik untuk menebang kayu bahan bangunan, memulau suatu kegiatan, mengangkat/melantik petugas.",
    "severity_code": "4"
  },
  {
    "id": "160",
    "nama": "Kala Wong",
    "keterangan": "Tidak baik untuk magundul (digundul), meotong rambut atau macukur (dicukur), meminang, melakukan upacara manusa yadnya.",
    "severity_code": "3"
  },
  {
    "id": "161",
    "nama": "Kaleburau",
    "keterangan": "Tidak baik melakukan karya ayu atau yadnya. Tidak baik melaksanakan atiwa-tiwa/ngaben",
    "severity_code": "3,4"
  },
  {
    "id": "162",
    "nama": "Kamajaya",
    "keterangan": "Baik untuk dewasa pernikahan, membangun, membuat alat-alat perang, mulai belajar/berlatih.",
    "severity_code": "2"
  },
  {
    "id": "163",
    "nama": "Karna Sula",
    "keterangan": "Tidak baik untuk melangsungkan perkawinan, mengambil/menangkap/membeli binatang peliharaan, mengadakan pertemuan/rapat, berbicara kepada orang lain.",
    "severity_code": "2"
  },
  {
    "id": "164",
    "nama": "Karnasula",
    "keterangan": "Baik untuk membuat kentongan, bajra, kendang, kroncongan (denta sapi dari kayu) dan sejenisnya. Tidak baik untuk membangun rumah tempat tidur, mengadakan rapat atau pertemuan.",
    "severity_code": "3"
  },
  {
    "id": "165",
    "nama": "Lebur Awu",
    "keterangan": "Tidak baik melakukan upacara wiwaha/pernikahan, pertemuan, membangun rumah, mengatapi rumah. Baik untuk membangun irigasi.",
    "severity_code": "4"
  },
  {
    "id": "166",
    "nama": "Lutung Megandong",
    "keterangan": "Baik untuk menanam buah-buahan dan umbi-umbian",
    "severity_code": "3"
  },
  {
    "id": "167",
    "nama": "Macekan Agung",
    "keterangan": "Untuk membuat benda-benda runcing untuk pura seperti pengawin, tumbak, senjata pengider-ider dll.",
    "severity_code": "2"
  },
  {
    "id": "168",
    "nama": "Macekan Lanang",
    "keterangan": "Baik untuk membuat taji, tumbak, keris, alat penangkap ikan. Tidak baik untuk upacara yadnya",
    "severity_code": "2"
  },
  {
    "id": "169",
    "nama": "Macekan Wadon",
    "keterangan": "Baik untuk membuat taji, tumbak, keris, alat penangkap ikan",
    "severity_code": "2"
  },
  {
    "id": "170",
    "nama": "Mreta Sula",
    "keterangan": "Tidak baik untuk melakukan semua macam yadnya",
    "severity_code": "2"
  },
  {
    "id": "171",
    "nama": "Naga Naut",
    "keterangan": "Tidak baik untuk dewasa ayu",
    "severity_code": "1"
  },
  {
    "id": "172",
    "nama": "Pamacekan",
    "keterangan": "Baik untuk mengerjakan sawah/tegal, membuat tombak penangkap ikan. Tidak baik melaksanakan yadnya",
    "severity_code": "2"
  },
  {
    "id": "173",
    "nama": "Panca Amerta",
    "keterangan": "Baik untuk pernikahan, melaukan upacara pembersihan diri.",
    "severity_code": "2"
  },
  {
    "id": "174",
    "nama": "Panca Prawani",
    "keterangan": "Tidak baik dipakai dewasa ayu.",
    "severity_code": "2"
  },
  {
    "id": "175",
    "nama": "Panca Werdi",
    "keterangan": "Baik untuk upacara potong gigi, potong rambut.",
    "severity_code": "2"
  },
  {
    "id": "176",
    "nama": "Pati Paten",
    "keterangan": "Tidak baik untuk melakukan segala yadnya/kerja.",
    "severity_code": "2"
  },
  {
    "id": "177",
    "nama": "Patra Limutan",
    "keterangan": "Baik untuk memasang guna-guna.",
    "severity_code": "2"
  },
  {
    "id": "178",
    "nama": "Pepedan",
    "keterangan": "Baik untuk membuka lahan pertanian baru. Tidak baik untuk membuat peralatan dari besi.",
    "severity_code": "3"
  },
  {
    "id": "179",
    "nama": "Prabu Pendah",
    "keterangan": "Tidak baik melakukan upacara pelantikan.",
    "severity_code": "2"
  },
  {
    "id": "180",
    "nama": "Prangewa",
    "keterangan": "Tidak baik mengadakan pertemuan karena mengandung unsur keributan.",
    "severity_code": "2"
  },
  {
    "id": "181",
    "nama": "Purnama Danta",
    "keterangan": "Baik untuk dewasa ayu.",
    "severity_code": "2"
  },
  {
    "id": "182",
    "nama": "Purnasuka",
    "keterangan": "Baik untuk mulai membangun karya ayu, juga baik untuk perkawinan tanpa memperhitungkan sasih.",
    "severity_code": "2"
  },
  {
    "id": "183",
    "nama": "Purwani",
    "keterangan": "Tidak baik dipakai dewasa.",
    "severity_code": "2"
  },
  {
    "id": "184",
    "nama": "Purwanin Dina",
    "keterangan": "Tidak baik sebagai dewasa ayu",
    "severity_code": "4"
  },
  {
    "id": "185",
    "nama": "Rangda Tiga",
    "keterangan": "Tidak baik melakukan upacara pawiwahan.",
    "severity_code": "3"
  },
  {
    "id": "186",
    "nama": "Rarung Pagelangan",
    "keterangan": "Tidak baik melakukan pitra yadnya dan manusa yadnya",
    "severity_code": "2"
  },
  {
    "id": "187",
    "nama": "Ratu Magelung",
    "keterangan": "Baik untuk menanam kelapa.",
    "severity_code": "3"
  },
  {
    "id": "188",
    "nama": "Ratu Mangure",
    "keterangan": "Baik untuk menanam yang buahnya berbatu.",
    "severity_code": "3"
  },
  {
    "id": "189",
    "nama": "Ratu Megambahan",
    "keterangan": "Tidak baik untuk membuat peraturan-peraturan, membuat rencana, mengangkat petugas/pejabat.",
    "severity_code": "2"
  },
  {
    "id": "190",
    "nama": "Ratu Nanyingal",
    "keterangan": "Baik untuk mananam kepaya.",
    "severity_code": "3"
  },
  {
    "id": "191",
    "nama": "Ratu Ngemban Putra",
    "keterangan": "Baik untuk membangun, mengangkat sentana (meras), melantik petugas.",
    "severity_code": "2"
  },
  {
    "id": "192",
    "nama": "Rekatadala Ayudana",
    "keterangan": "Baik untuk menanam tanaman yang beruas/berbuku, melakukan dana punia (beramal).",
    "severity_code": "2"
  },
  {
    "id": "193",
    "nama": "Salah Wadi",
    "keterangan": "Tidak baik untuk melakukan Manusa Yadnya (wiwaha, mapendes, potong rambut dll.) Pitra Yadnya (Penguburan, atiwa-tiwa/ngaben, nyekah, ngasti dll.",
    "severity_code": "3"
  },
  {
    "id": "194",
    "nama": "Sampar Wangke",
    "keterangan": "Tidak baik untuk bersenggama, kalau dilanggar bisa melahirkan bayi yang penuh kesialan dan kemalangan.",
    "severity_code": "4"
  },
  {
    "id": "195",
    "nama": "Sampi Gumarang Munggah",
    "keterangan": "Tidak baik menanam padi dan jagung.",
    "severity_code": "4"
  },
  {
    "id": "196",
    "nama": "Sampi Gumarang Turun",
    "keterangan": "Baik untuk menanam padi, jagung, dan membangun rumah.",
    "severity_code": "4"
  },
  {
    "id": "197",
    "nama": "Sarik Agung",
    "keterangan": "Tidak baik untuk segala pekerjaan.",
    "severity_code": "3"
  },
  {
    "id": "198",
    "nama": "Sarik Ketah",
    "keterangan": "Baik untuk membuat tembok pagar.",
    "severity_code": "2"
  },
  {
    "id": "199",
    "nama": "Sedana Tiba",
    "keterangan": "Baik untuk melakukan Pitra Yadnya, Dewa Yadnya di Pamarajan/di Panti.",
    "severity_code": "2"
  },
  {
    "id": "200",
    "nama": "Sedana Yoga",
    "keterangan": "Baik untuk membuat alat berdagang, tempat berdagang, mulai berjualan karena akan murah rejeki.",
    "severity_code": "2"
  },
  {
    "id": "201",
    "nama": "Semut Sedulur",
    "keterangan": "Baik untuk gotong royang, kerja bakti, memulai kampanye, membentuk perkumpulan. Tidak baik mengubur atau membakar mayat.",
    "severity_code": "4"
  },
  {
    "id": "202",
    "nama": "Siwa Sampurna",
    "keterangan": "Baik untuk segala jenis upacara, mulai belajar/berlatih, membangun segala macam bangungan.",
    "severity_code": "2"
  },
  {
    "id": "203",
    "nama": "Sri Bagia",
    "keterangan": "Baik untuk memulai membina persahabatan.",
    "severity_code": "3"
  },
  {
    "id": "204",
    "nama": "Sri Murti",
    "keterangan": "Baik untuk mempersembahkan yadnya kepada Dewi Sri di lumbung.",
    "severity_code": "4"
  },
  {
    "id": "205",
    "nama": "Sri Tumpuk",
    "keterangan": "Baik untuk memcari burung (mepikat).",
    "severity_code": "4"
  },
  {
    "id": "206",
    "nama": "Srigati",
    "keterangan": "Baik untuk menyimpan padi di lumbung dan menurunkan padi dari lumbung",
    "severity_code": "4"
  },
  {
    "id": "207",
    "nama": "Srigati Jenek",
    "keterangan": "Baik untuk membibit/menanam padi, menyimpan padi dilumbung, serta pelaksanaan upacaranya.",
    "severity_code": "4"
  },
  {
    "id": "208",
    "nama": "Srigati Munggah",
    "keterangan": "Baik untuk membibit/menanam padi, membuat alat-alat berjualan, membuat pahat, menyimpan padi atau upacara padi li lumbung. Tidak baik meminjam sesuatu, menjual beli beras.",
    "severity_code": "4"
  },
  {
    "id": "209",
    "nama": "Srigati Turun",
    "keterangan": "Baik untuk membibit/menanam padi, menyimpan padi, mengaturkan yadnya di lumbung, menanam kelapa, mulai membuat barang dagangan.",
    "severity_code": "4"
  },
  {
    "id": "210",
    "nama": "Subacara",
    "keterangan": "Baik untuk melangsungkan segala jenis upacara, membuat program (rencana), membuat peraturan, mengangkat.menunjuk petugas, mulai berlatih/belajar.",
    "severity_code": "2"
  },
  {
    "id": "211",
    "nama": "Swarga Menge",
    "keterangan": "Hari baik untuk upacara Pitra Yadnya memuja bhatara-bhatari kawitan",
    "severity_code": "3"
  },
  {
    "id": "212",
    "nama": "Taliwangke",
    "keterangan": "Baik untuk memasang tali penghambat di sawah atau di kebun, memperbaiki pagar, membuat tali pengikat padi/benda-benda mati. Tidak baik untuk mulai mengerjakan benang tenun, membuat tali ternak.",
    "severity_code": "3"
  },
  {
    "id": "213",
    "nama": "Titibuwuk",
    "keterangan": "Baik untuk menghilangkan penyakit karena guna-guna dan sejenisnya. Tidak baik untuk memulai suatu pekerjaan penting bepergian, membuat tangga/banggul.",
    "severity_code": "3"
  },
  {
    "id": "214",
    "nama": "Tunut Masih",
    "keterangan": "Baik untuk melas rare (bayi menetek), mulai mengajar/melatih ternak bekerja, membentuk perkumpulan (organisasi), memulai membuka sekolah atau perguruan, baik untuk nelusuk (mencocok hidung sapi atau kerbau) diisi tali pengikat.",
    "severity_code": "3"
  },
  {
    "id": "215",
    "nama": "Tutur Mandi",
    "keterangan": "Baik untuk melakukan hal yang bersifat gaib (kedyatmikan), memberikan petuah/nasehat.",
    "severity_code": "3"
  },
  {
    "id": "216",
    "nama": "Uncal Balung",
    "keterangan": "Tidak baik melakukan semua jenis perkerjaan yang dianggap penting.",
    "severity_code": "3"
  },
  {
    "id": "217",
    "nama": "Upadana Amerta",
    "keterangan": "Baik untuk menanam suatu tanaman, membuat alat-alat berdagang atau mulai berjualan.",
    "severity_code": "2"
  },
  {
    "id": "218",
    "nama": "Werdi Suka",
    "keterangan": "Baik untuk upacara Dewa Yadnya.",
    "severity_code": "2"
  },
  {
    "id": "219",
    "nama": "Wisesa",
    "keterangan": "Baik untuk upacara mabersih/dwijati, mapeningan, mabiseka ratu",
    "severity_code": "2"
  },
  {
    "id": "220",
    "nama": "Wredhi Guna",
    "keterangan": "Baik untuk melakukan segala upacara (panca yadnya) karena akan memperoleh manfaat yang berlimpah",
    "severity_code": "1"
  }
];

export const MASTER_PADEWASAN_MAP: Record<string, PadewasanItem> = MASTER_PADEWASAN_LIST.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, PadewasanItem>
);

export function enrichPadewasanItem(item: PadewasanItem): PadewasanItem {
  const master = MASTER_PADEWASAN_MAP[String(item.id)];
  if (!master) return item;

  const isPlaceholderName = !item.nama || item.nama.startsWith('Padewasan #');
  const isMissingDesc = !item.keterangan || item.keterangan.trim() === '';

  return {
    ...item,
    nama: isPlaceholderName ? master.nama : item.nama,
    keterangan: isMissingDesc ? master.keterangan : item.keterangan,
    severity_code: item.severity_code || master.severity_code || '4',
  };
}
