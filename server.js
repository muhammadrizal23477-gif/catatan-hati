require("dotenv").config();
const express = require("express");
const path = require("path");
const { Readable } = require("stream");

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Helper: panggil Claude API dari server (tidak dibatasi browser) ----------
async function askClaude(messages, { maxTokens = 600, system } = {}) {
  if (!ANTHROPIC_API_KEY) {
    const err = new Error("ANTHROPIC_API_KEY belum diatur di environment variable server.");
    err.kind = "missing_key";
    throw err;
  }
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    const err = new Error("Tidak bisa menghubungi server Anthropic (masalah jaringan).");
    err.kind = "network";
    err.cause = networkErr;
    throw err;
  }

  if (!res.ok) {
    const errText = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(errText);
    } catch {
      parsed = null;
    }
    const apiMessage = parsed?.error?.message || errText;
    const err = new Error(`Anthropic API error ${res.status}: ${apiMessage}`);
    err.status = res.status;
    if (res.status === 401) err.kind = "invalid_key";
    else if (res.status === 429) err.kind = "rate_limit";
    else if (res.status === 529 || res.status === 503) err.kind = "overloaded";
    else if (res.status === 400) err.kind = "bad_request";
    else err.kind = "api_error";
    throw err;
  }

  const data = await res.json();
  const text = (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  if (!text) {
    const err = new Error("Balasan dari model kosong.");
    err.kind = "empty_reply";
    throw err;
  }

  return text;
}

function pesanErrorUntukPengguna(err) {
  switch (err?.kind) {
    case "missing_key":
      return "Server belum diatur dengan API key. Hubungi admin aplikasi untuk mengaktifkan fitur ini.";
    case "invalid_key":
      return "API key server tidak valid atau sudah kedaluwarsa. Hubungi admin aplikasi.";
    case "rate_limit":
      return "Server sedang menerima banyak permintaan. Coba kirim lagi sebentar ya.";
    case "overloaded":
      return "Layanan sedang sibuk sesaat. Coba kirim lagi dalam beberapa detik.";
    case "network":
      return "Server gagal terhubung ke layanan AI. Coba lagi sebentar.";
    case "empty_reply":
      return "Belum dapat balasan yang jelas. Coba kirim ulang pesannya ya.";
    case "bad_request":
      return "Pesan tidak bisa diproses. Coba tulis ulang dengan kalimat yang berbeda.";
    default:
      return "Terjadi kendala di server. Coba lagi sebentar.";
  }
}

// ---------- API: generator kata-kata / puisi ----------
app.post("/api/generate", async (req, res) => {
  try {
    const { kategori = "Motivasi", jenis = "kata", topik = "" } = req.body || {};
    const instruksi =
      jenis === "puisi"
        ? "Buat SATU puisi pendek bahasa Indonesia (4-8 baris), orisinal, dengan bait yang mengalir dan diksi yang hidup, tanpa judul, tanpa penjelasan tambahan."
        : "Buat SATU kutipan kata-kata singkat (maksimal 2 kalimat), bahasa Indonesia, orisinal, dalam-tetapi-sederhana, tanpa tanda kutip di awal/akhir, tanpa embel-embel penjelasan.";
    const konteks = topik.trim()
      ? ` Sentuh tema spesifik ini jika relevan: "${topik.trim()}".`
      : "";
    const prompt = `${instruksi} Temanya: ${kategori}.${konteks} Jangan gunakan markdown, jangan beri pembuka seperti "Berikut adalah". Langsung isinya saja.`;

    const text = await askClaude([{ role: "user", content: prompt }], { maxTokens: 400 });
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: pesanErrorUntukPengguna(err) });
  }
});

// ---------- API: ruang curhat — teman ngobrol sekaligus bisa jawab pertanyaan apa pun ----------
const CURHAT_SYSTEM_PROMPT = `Kamu adalah "CH", teman ngobrol di aplikasi Catatan Hati. Kamu berbahasa Indonesia yang hangat, natural, dan tidak kaku, seperti teman dekat lewat chat.

ATURAN PALING UTAMA: selalu baca dan pahami betul apa yang benar-benar ditanyakan atau diceritakan pengguna, lalu balas sesuai itu secara spesifik. Jangan pernah membalas dengan kalimat generik/template yang bisa dipakai untuk pesan apa saja. Jangan mengarang topik yang tidak disebutkan pengguna. Jangan mengubah topik jadi curhat kalau pengguna sebenarnya sedang bertanya sesuatu.

Baca dulu maksud pesan pengguna, lalu sesuaikan gaya balasan:

1. Kalau pengguna curhat / cerita masalah / mengungkapkan perasaan (sedih, capek, cemas, marah, bingung, dll):
   - Tunjukkan kamu benar-benar memahami perasaannya (jangan menggurui, jangan meremehkan, jangan buru-buru kasih solusi kalau dia cuma butuh didengar).
   - Beri respons yang personal dan relevan dengan cerita spesifiknya, bukan template motivasi generik.
   - Kalau memang pas, tutup dengan satu kalimat penyemangat atau pertanyaan lanjutan yang membuka ruang untuk cerita lebih jauh.

2. Kalau pengguna bertanya sesuatu (fakta, pengetahuan umum, minta saran praktis, minta dijelaskan sesuatu, minta bantuan menulis, dsb):
   - Jawab PERSIS pertanyaannya, langsung ke inti jawaban di kalimat pertama, baru tambahkan penjelasan kalau perlu.
   - Jawab dengan jelas, akurat, dan membantu — seperti asisten yang cerdas dan enak diajak ngobrol.
   - Jangan alihkan ke topik curhat kalau dia tidak sedang curhat. Tidak semua pesan adalah curhat.

3. Kalau pesannya ringan/basa-basi (sapaan, obrolan santai), balas santai dan hangat, boleh sambil menawarkan untuk bantu apa saja.

4. Kalau pengguna melanjutkan topik dari pesan-pesan sebelumnya (ada riwayat percakapan), gunakan konteks itu supaya balasanmu nyambung — jangan mengulang pertanyaan yang sudah dijawab atau berbicara seolah percakapan baru dimulai.

Gaya bahasa: percakapan natural, kalimat tidak terlalu panjang, tanpa format markdown (tanpa bintang, tanpa heading, tanpa numbering kecuali pengguna secara eksplisit minta daftar/langkah-langkah), maksimal 1 emoji jika memang pas — jangan berlebihan. Panjang balasan menyesuaikan kebutuhan: singkat untuk obrolan ringan, lebih panjang kalau pertanyaannya memang butuh penjelasan lengkap.

Jika pesan menunjukkan tanda-tanda krisis serius (ingin menyakiti diri sendiri atau putus asa berat), prioritaskan keselamatan: tunjukkan empati, dan sisipkan ajakan lembut untuk berbicara dengan orang terdekat atau layanan bantuan profesional (misalnya layanan Sejiwa di 119 ext 8).`;

// Pastikan riwayat percakapan yang dikirim balik selalu berselang-seling user/assistant
// dan diawali role "user" — riwayat yang rusak/urutannya salah akan ditolak oleh API Anthropic.
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const cleaned = history.filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
  );

  const result = [];
  let expected = "user";
  for (const m of cleaned) {
    if (m.role !== expected) continue; // lewati apa pun yang merusak urutan selang-seling
    result.push({ role: m.role, content: m.content.trim() });
    expected = expected === "user" ? "assistant" : "user";
  }

  let trimmed = result.slice(-10);
  if (trimmed.length && trimmed[0].role !== "user") trimmed = trimmed.slice(1);
  return trimmed;
}

app.post("/api/curhat", async (req, res) => {
  try {
    const { message = "", history = [] } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    const trimmedHistory = sanitizeHistory(history);
    const messages = [...trimmedHistory, { role: "user", content: message.trim() }];

    const reply = await askClaude(messages, {
      maxTokens: 800,
      system: CURHAT_SYSTEM_PROMPT,
    });
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: pesanErrorUntukPengguna(err) });
  }
});

// ---------- API: info video TikTok tanpa watermark ----------
// Menggunakan endpoint publik tikwm.com yang umum dipakai layanan sejenis (SnapTik/SSSTik).
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

// ---------- API: proxy unduh file video (memaksa file terunduh, bukan hanya diputar) ----------
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
      // Sumber tidak mengembalikan video yang valid (mis. halaman error/HTML)
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
