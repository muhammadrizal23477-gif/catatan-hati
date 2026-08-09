const express = require("express");
const path = require("path");
const { Readable } = require("stream");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =========================================================================
// KATA-KATA & PUISI — bank konten lokal, tidak butuh API key / AI eksternal
// Kata-kata dibangun dari kombinasi frasa pembuka x penutup per kategori
// (10 pembuka x 10 penutup = 100 kombinasi unik per kategori).
// =========================================================================
const FRASA_KATA = {
  Motivasi: {
    pembuka: [
      "Kamu tidak harus terburu-buru",
      "Langkahmu boleh pelan",
      "Hari ini mungkin terasa berat",
      "Kamu sudah berjalan sejauh ini",
      "Lelahmu adalah bukti kamu berusaha",
      "Tidak semua usaha terlihat hasilnya sekarang",
      "Kegagalan hari ini bukan akhir cerita",
      "Kamu boleh istirahat sejenak",
      "Proses ini memang tidak instan",
      "Setiap orang punya waktunya masing-masing",
    ],
    penutup: [
      "yang penting kamu terus melangkah.",
      "asal kamu tidak pernah benar-benar berhenti.",
      "tapi besok selalu punya kesempatan baru.",
      "dan itu sudah pantas dibanggakan.",
      "bukan tanda kamu gagal.",
      "sabar sedikit lagi, hasilnya akan terlihat.",
      "selama kau memilih untuk bangkit lagi.",
      "asal kau kembali melangkah setelahnya.",
      "sebab hasil yang berarti butuh waktu.",
      "jadi jangan bandingkan dirimu dengan orang lain.",
    ],
  },
  Cinta: {
    pembuka: [
      "Cinta yang tulus tidak memaksa",
      "Mencintai seseorang berarti memilihnya lagi",
      "Kasih sayang yang sehat membuatmu tenang",
      "Rasa yang benar tidak butuh diyakinkan berulang kali",
      "Cinta terbaik adalah yang membiarkanmu jadi diri sendiri",
      "Hubungan yang baik dibangun dari kepercayaan",
      "Kau tidak perlu mengejar seseorang yang pergi",
      "Cinta sejati tumbuh pelan-pelan",
      "Menyayangi diri sendiri adalah langkah pertama",
      "Perasaan yang tulus akan selalu punya cara untuk bertahan",
    ],
    penutup: [
      "ia hanya hadir dan tetap tinggal.",
      "bukan hanya sekali, tapi setiap hari.",
      "bukan cemas sepanjang waktu.",
      "sebab ia terasa dengan sendirinya.",
      "meski semua tak sempurna.",
      "bukan dari rasa curiga.",
      "sebab yang memang untukmu akan kembali dengan caranya sendiri.",
      "tidak selalu meledak-ledak sejak awal.",
      "sebelum bisa menyayangi orang lain dengan utuh.",
      "meski waktu dan jarak menguji.",
    ],
  },
  Sedih: {
    pembuka: [
      "Tidak apa untuk merasa sedih hari ini",
      "Air mata bukan tanda lemah",
      "Kesedihan hari ini bukan berarti besok tetap sama",
      "Kamu boleh berhenti sejenak",
      "Rasa sakit ini nyata",
      "Hatimu sedang butuh waktu untuk pulih",
      "Tidak semua luka harus buru-buru sembuh",
      "Kamu tidak harus selalu terlihat baik-baik saja",
      "Sedih ini akan berlalu meski terasa lama",
      "Menangis bukan berarti kamu menyerah",
    ],
    penutup: [
      "kamu tidak wajib selalu terlihat baik-baik saja.",
      "ia hanya cara hati melepas beban yang terlalu berat.",
      "sebab besok tetap punya peluang untuk lebih baik.",
      "memberi ruang untuk hatimu yang lelah.",
      "dan kamu berhak merasakannya tanpa terburu sembuh.",
      "beri ia waktu sebelum kembali melangkah.",
      "beberapa memang butuh proses yang lebih panjang.",
      "kamu hanya sedang jujur pada perasaanmu sendiri.",
      "pelan-pelan, satu hari pada satu waktu.",
      "itu caramu melepaskan apa yang terlalu berat dipikul sendiri.",
    ],
  },
  Rindu: {
    pembuka: [
      "Rindu adalah cara hati mengingatkan",
      "Jarak boleh memisahkan raga",
      "Setiap rindu yang kau simpan",
      "Rindu ini terasa berat",
      "Menunggu memang tidak mudah",
      "Kadang rindu datang tanpa peringatan",
      "Kau jauh di mata",
      "Waktu terasa lambat saat merindu",
      "Rindu adalah bukti sebuah kasih",
      "Meski tak bisa bertemu sekarang",
    ],
    penutup: [
      "bahwa ada seseorang yang begitu berarti.",
      "tapi rindu selalu tahu jalan pulang.",
      "adalah bukti betapa dalam kau menyayangi.",
      "tapi setidaknya ia mengingatkanku bahwa kau nyata.",
      "tapi menunggu untuk hal yang berarti selalu sepadan.",
      "di tengah kesibukan yang paling padat sekalipun.",
      "tapi selalu dekat di hati.",
      "namun setiap detiknya membawa kita lebih dekat pada pertemuan.",
      "yang tidak pernah benar-benar hilang meski waktu berjalan.",
      "rindu ini tetap kusimpan sampai tiba waktunya.",
    ],
  },
  Perjuangan: {
    pembuka: [
      "Perjuanganmu hari ini mungkin belum terlihat hasilnya",
      "Setiap orang punya medan perangnya sendiri",
      "Kamu tidak harus kuat setiap saat",
      "Jatuh berkali-kali bukan kekalahan",
      "Perjuangan yang sunyi tetaplah berarti",
      "Peluh yang kau keluarkan hari ini",
      "Tidak ada usaha yang benar-benar sia-sia",
      "Kau sudah bertahan sejauh ini",
      "Setiap langkah kecil dalam perjuanganmu",
      "Lelah dalam perjuangan itu wajar",
    ],
    penutup: [
      "tapi ia tidak pernah sia-sia.",
      "teruslah berjuang di jalanmu sendiri.",
      "cukup jangan menyerah hari ini.",
      "selama kau selalu memilih bangkit lagi.",
      "meski tak ada yang bertepuk tangan.",
      "adalah investasi untuk masa depanmu.",
      "meski hasilnya belum terlihat sekarang.",
      "dan itu sudah sebuah pencapaian.",
      "tetap membawamu lebih dekat ke tujuan.",
      "asal tidak membuatmu berhenti melangkah.",
    ],
  },
  "Masalah Hidup": {
    pembuka: [
      "Masalah datang bukan untuk menghancurkanmu",
      "Tidak semua masalah harus selesai hari ini",
      "Hidup memang tidak selalu adil",
      "Setiap masalah punya waktunya untuk selesai",
      "Kamu tidak sendirian menghadapi ini",
      "Badai dalam hidup ini terasa panjang",
      "Beban ini terasa berat sekarang",
      "Ujian hidup tidak datang tanpa alasan",
      "Kadang jalan keluar butuh waktu untuk terlihat",
      "Semua masalah pada akhirnya punya penyelesaian",
    ],
    penutup: [
      "tapi untuk menunjukkan sekuat apa dirimu.",
      "beri dirimu waktu untuk bernapas.",
      "tapi kamu berhak mencari jalan keluarmu sendiri.",
      "kamu hanya perlu terus mencoba.",
      "meski rasanya begitu berat sekarang.",
      "tapi tak ada badai yang abadi.",
      "namun kau tidak memikulnya sendirian.",
      "ia mengajarkan sesuatu yang berharga.",
      "sabar sedikit lagi, terang akan datang.",
      "meski caranya kadang tidak sesuai harapan.",
    ],
  },
  Syukur: {
    pembuka: [
      "Bersyukur bukan berarti semua sempurna",
      "Hari ini kamu masih bisa bernapas dan mencoba lagi",
      "Kadang hal kecil yang terlewat begitu saja",
      "Rasa syukur mengubah cara kita melihat hidup",
      "Bersyukurlah atas langkah yang sudah kau tempuh",
      "Tidak semua orang seberuntung ini",
      "Ada banyak hal kecil yang patut disyukuri",
      "Napas yang kau hirup pagi ini",
      "Kebahagiaan kecil hari ini",
      "Rasa cukup datang dari hati yang bersyukur",
    ],
    penutup: [
      "tapi memilih melihat kebaikan yang masih ada.",
      "itu sudah alasan untuk bersyukur.",
      "sebenarnya adalah berkah yang besar.",
      "dari kurang menjadi cukup.",
      "sekecil apa pun itu.",
      "masih diberi satu hari lagi untuk mencoba.",
      "sering terlewat begitu saja tanpa disadari.",
      "adalah hadiah yang tidak semua orang dapatkan.",
      "layak untuk disyukuri dan dirayakan.",
      "bukan dari banyaknya yang dimiliki.",
    ],
  },
};

const PUISI = {
  Motivasi: [
    "Langkah kecil hari ini,\nadalah jejak menuju esok yang lebih terang.\nTak perlu berlari,\ncukup jangan berhenti berjalan.",
    "Ketika lelah mendekap erat,\ningatlah kenapa kau memulai.\nSetiap luka yang kau rawat,\nakan menjadi kekuatan di hari nanti.",
    "Badai boleh datang malam ini,\ntapi fajar tetap punya janji.\nBertahanlah sedikit lagi,\nsebab kamu lebih kuat dari yang kau kira.",
  ],
  Cinta: [
    "Kau hadir seperti senja,\npelan namun mengubah seluruh warna langit.\nDan aku, yang dulu ragu,\nkini belajar percaya pada rasa ini.",
    "Cinta bukan tentang siapa yang paling sempurna,\ntapi siapa yang mau tetap tinggal saat semua tak sempurna.\nDan aku memilih tetap di sini,\nbersamamu, apa adanya.",
  ],
  Sedih: [
    "Malam ini hujan turun di dalam dada,\ntanpa suara, tanpa siapa yang tahu.\nTapi biarkan saja ia jatuh,\nsebab esok pagi akan datang jua.",
    "Ada luka yang tak terlihat mata,\nhanya terasa saat sunyi tiba.\nPelan-pelan, izinkan dirimu berduka,\nsebelum kembali berjalan seperti semula.",
  ],
  Rindu: [
    "Kutulis rindu ini di antara detik yang sepi,\nberharap angin menyampaikannya kepadamu.\nJika kau rasakan hangat tiba-tiba,\nitu aku, yang sedang merindu.",
    "Jarak hanya angka,\ntapi rindu tak pernah tahu cara berhenti.\nAku menunggu waktu mempertemukan kita lagi,\ndi ruang dan saat yang tepat.",
  ],
  Perjuangan: [
    "Di jalan yang terjal ini,\nkubawa langkah yang kadang goyah.\nTapi kubawa juga tekad,\nyang tak pernah benar-benar padam.",
    "Peluh ini bukan tanda lemah,\nia bukti aku sedang berjuang.\nSuatu hari nanti akan kupetik,\nbuah dari semua yang kutanam.",
  ],
  "Masalah Hidup": [
    "Badai ini terasa panjang,\ntapi tak ada badai yang abadi.\nSetelah gelap yang menekan,\nakan ada terang yang menanti.",
    "Kupikul beban ini sendiri,\ntapi aku percaya ada ujung dari semua ini.\nSatu langkah, satu hari,\naku akan sampai juga di sana.",
  ],
  Syukur: [
    "Kubuka mata pagi ini,\ndan itu sudah cukup untuk berterima kasih.\nSebab tak semua orang seberuntung ini,\nmasih diberi satu hari lagi untuk mencoba.",
    "Di antara semua yang belum tercapai,\nada banyak hal kecil yang patut disyukuri.\nNapas, langkah, dan hari yang baru,\nadalah hadiah yang sering terlewat begitu saja.",
  ],
};

// Bangun 100 kombinasi kata-kata unik per kategori (10 pembuka x 10 penutup)
const KONTEN = {};
for (const kategori of Object.keys(FRASA_KATA)) {
  const { pembuka, penutup } = FRASA_KATA[kategori];
  const kata = [];
  for (const p of pembuka) {
    for (const t of penutup) {
      kata.push(`${p}, ${t}`);
    }
  }
  KONTEN[kategori] = { kata, puisi: PUISI[kategori] };
}

function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

app.post("/api/generate", (req, res) => {
  const { kategori = "Motivasi", jenis = "kata" } = req.body || {};
  const grup = KONTEN[kategori] || KONTEN.Motivasi;
  const daftar = grup[jenis] || grup.kata;
  const text = pilihAcak(daftar);
  res.json({ text });
});

// =========================================================================
// RUANG CURHAT — balasan berbasis aturan sederhana, tidak butuh AI eksternal
// =========================================================================
const HOTLINE_INFO =
  "Kalau rasanya berat sekali, kamu tidak sendirian — coba hubungi layanan Sejiwa di 119 ext 8, atau ceritakan ke orang terdekat yang kamu percaya.";

const POLA_CURHAT = [
  {
    cocok: /(bunuh diri|mengakhiri hidup|nyakitin diri|melukai diri|self ?harm|ingin mati)/i,
    balas: () =>
      `Aku dengar kamu, dan aku serius pengin kamu tetap aman. Perasaan seberat ini penting untuk dibagikan ke orang yang bisa bantu langsung. ${HOTLINE_INFO}`,
  },
  {
    cocok: /(capek|lelah|cape|burnout|penat)/i,
    balas: () =>
      pilihAcak([
        "Capek yang kamu rasain itu valid banget. Kadang tubuh dan pikiran memang butuh jeda sebelum lanjut lagi. Mau cerita apa yang paling bikin capek belakangan ini?",
        "Wajar kok kalau lagi lelah, apalagi kalau sudah dipendam lama. Boleh cerita lebih lanjut, aku dengerin.",
      ]),
  },
  {
    cocok: /(sedih|nangis|kecewa|hancur|patah hati|galau)/i,
    balas: () =>
      pilihAcak([
        "Kedengarannya berat ya yang kamu rasain sekarang. Nggak apa-apa buat sedih dulu, aku di sini nemenin ceritamu.",
        "Aku ikut merasakan beratnya. Kalau kamu mau cerita lebih detail apa yang terjadi, aku siap dengerin.",
      ]),
  },
  {
    cocok: /(semangat|motivasi|males|malas|gak niat|nggak niat)/i,
    balas: () =>
      pilihAcak([
        "Kadang semangat memang naik-turun, itu manusiawi kok. Coba mulai dari langkah paling kecil dulu — pelan-pelan aja, nggak harus langsung besar.",
        "Susah ya cari semangat kalau lagi drop. Coba istirahat sebentar, lalu mulai lagi dari satu hal kecil yang paling mudah dulu.",
      ]),
  },
  {
    cocok: /(cemas|khawatir|takut|panik|anxiety|gugup)/i,
    balas: () =>
      "Perasaan cemas itu memang tidak nyaman, tapi kamu tidak salah karena merasakannya. Coba tarik napas pelan-pelan, dan kalau nyaman, ceritain apa yang lagi bikin kamu khawatir.",
  },
  {
    cocok: /^(hai|halo|hi|hey|pagi|siang|sore|malam)\b/i,
    balas: () =>
      pilihAcak([
        "Hai juga! Gimana harimu sejauh ini?",
        "Halo! Senang kamu mampir. Ada yang mau diceritain atau ditanyain?",
      ]),
  },
  {
    cocok: /(makasih|terima kasih|thanks|thank you)/i,
    balas: () => "Sama-sama. Aku senang bisa nemenin, jangan ragu cerita lagi kapan pun.",
  },
];

function balasCurhatLokal(pesan) {
  const teks = pesan.trim();
  for (const pola of POLA_CURHAT) {
    if (pola.cocok.test(teks)) return pola.balas();
  }

  // Deteksi pertanyaan umum — beri jawaban jujur bahwa mode ini sederhana (tanpa AI)
  if (/\?\s*$/.test(teks) || /^(apa|kenapa|gimana|bagaimana|berapa|siapa|dimana|di mana|kapan)\b/i.test(teks)) {
    return "Pertanyaanmu menarik, tapi mode Curhat di sini jalan tanpa koneksi ke AI eksternal jadi aku belum bisa jawab pertanyaan umum dengan akurat. Kalau mau cerita perasaan atau keluh kesah, aku tetap siap dengerin ya.";
  }

  return pilihAcak([
    "Aku dengerin ceritamu. Boleh lanjutkan, apa yang lagi kamu rasain?",
    "Terima kasih sudah mau cerita. Ceritain lebih lanjut, aku di sini kok.",
    "Aku di sini nemenin kamu. Ada lagi yang mau dibagikan?",
  ]);
}

app.post("/api/curhat", (req, res) => {
  const { message = "" } = req.body || {};
  if (!message.trim()) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong." });
  }
  const reply = balasCurhatLokal(message);
  res.json({ reply });
});

// =========================================================================
// TIKTOK — unduh video tanpa watermark (tidak butuh API key)
// =========================================================================
app.get("/api/tiktok", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Parameter url wajib diisi." });

    const apiRes = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.tikwm.com/",
      },
      body: new URLSearchParams({ url, hd: "1" }),
    });
    const data = await apiRes.json();

    if (data.code !== 0 || !data.data) {
      return res.status(422).json({ error: "Video tidak ditemukan atau link tidak valid." });
    }

    const d = data.data;
    res.json({
      title: d.title,
      cover: d.cover,
      author: d.author?.nickname || d.author?.unique_id || "",
      duration: d.duration,
      playNoWatermark: d.hdplay || d.play,
      musicUrl: d.music,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data video. Coba lagi." });
  }
});

function sanitizeFilename(name) {
  const cleaned = String(name)
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/:*?<>|]/g, "_")
    .trim()
    .slice(0, 80);
  return cleaned || "tiktok-no-watermark.mp4";
}

app.get("/api/tiktok/download", async (req, res) => {
  try {
    const { src, filename = "tiktok-no-watermark.mp4" } = req.query;
    if (!src) return res.status(400).send("Parameter src wajib diisi.");

    let parsedUrl;
    try {
      parsedUrl = new URL(src);
    } catch {
      return res.status(400).send("URL video tidak valid.");
    }
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return res.status(400).send("URL video tidak valid.");
    }

    const videoRes = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.tikwm.com/",
      },
    });

    if (!videoRes.ok || !videoRes.body) {
      return res.status(502).send("Gagal mengambil file video dari sumber.");
    }

    const upstreamType = videoRes.headers.get("content-type") || "";
    if (!upstreamType.startsWith("video/") && !upstreamType.includes("octet-stream")) {
      return res.status(502).send("Video tidak tersedia dari sumber saat ini. Coba lagi.");
    }

    const contentLength = videoRes.headers.get("content-length");
    res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFilename(filename)}"`);
    res.setHeader("Content-Type", upstreamType || "video/mp4");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const nodeStream = Readable.fromWeb(videoRes.body);
    nodeStream.on("error", (streamErr) => {
      console.error("Stream error saat unduh TikTok:", streamErr);
      if (!res.headersSent) {
        res.status(500).send("Gagal mengunduh video.");
      } else {
        res.destroy();
      }
    });
    nodeStream.pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send("Gagal mengunduh video.");
    } else {
      res.destroy();
    }
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Catatan Hati berjalan di port ${PORT}`);
});
