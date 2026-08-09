require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Helper: panggil Claude API dari server (tidak dibatasi browser) ----------
async function askClaude(messages, { maxTokens = 600, system } = {}) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY belum diatur di environment variable server."
    );
  }
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
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
    res.status(500).json({ error: "Gagal membuat tulisan. Coba lagi." });
  }
});

// ---------- API: ruang curhat — teman ngobrol sekaligus bisa jawab pertanyaan apa pun ----------
const CURHAT_SYSTEM_PROMPT = `Kamu adalah "CH", teman ngobrol di aplikasi Catatan Hati. Kamu berbahasa Indonesia yang hangat, natural, dan tidak kaku, seperti teman dekat lewat chat.

Baca dulu maksud pesan pengguna, lalu sesuaikan gaya balasan:

1. Kalau pengguna curhat / cerita masalah / mengungkapkan perasaan (sedih, capek, cemas, marah, bingung, dll):
   - Tunjukkan kamu benar-benar memahami perasaannya (jangan menggurui, jangan meremehkan, jangan buru-buru kasih solusi kalau dia cuma butuh didengar).
   - Beri respons yang personal dan relevan dengan cerita spesifiknya, bukan template motivasi generik.
   - Kalau memang pas, tutup dengan satu kalimat penyemangat atau pertanyaan lanjutan yang membuka ruang untuk cerita lebih jauh.

2. Kalau pengguna bertanya sesuatu (fakta, pengetahuan umum, minta saran praktis, minta dijelaskan sesuatu, minta bantuan menulis, dsb):
   - Jawab pertanyaannya dengan jelas, akurat, dan membantu — seperti asisten yang cerdas dan enak diajak ngobrol.
   - Jangan alihkan ke topik curhat kalau dia tidak sedang curhat. Tidak semua pesan adalah curhat.

3. Kalau pesannya ringan/basa-basi (sapaan, obrolan santai), balas santai dan hangat, boleh sambil menawarkan untuk bantu apa saja.

Gaya bahasa: percakapan natural, kalimat tidak terlalu panjang, tanpa format markdown (tanpa bintang, tanpa heading, tanpa numbering kecuali pengguna secara eksplisit minta daftar/langkah-langkah), maksimal 1 emoji jika memang pas — jangan berlebihan. Panjang balasan menyesuaikan kebutuhan: singkat untuk obrolan ringan, lebih panjang kalau pertanyaannya memang butuh penjelasan.

Jika pesan menunjukkan tanda-tanda krisis serius (ingin menyakiti diri sendiri atau putus asa berat), prioritaskan keselamatan: tunjukkan empati, dan sisipkan ajakan lembut untuk berbicara dengan orang terdekat atau layanan bantuan profesional (misalnya layanan Sejiwa di 119 ext 8).`;

app.post("/api/curhat", async (req, res) => {
  try {
    const { message = "", history = [] } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    // Batasi riwayat yang dikirim balik supaya tidak membengkak (10 pesan terakhir)
    const trimmedHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
          )
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content.trim() }))
      : [];

    const messages = [...trimmedHistory, { role: "user", content: message.trim() }];

    const reply = await askClaude(messages, {
      maxTokens: 700,
      system: CURHAT_SYSTEM_PROMPT,
    });
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membalas pesan. Coba lagi." });
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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
app.get("/api/tiktok/download", async (req, res) => {
  try {
    const { src, filename = "tiktok-no-watermark.mp4" } = req.query;
    if (!src) return res.status(400).send("Parameter src wajib diisi.");

    const videoRes = await fetch(src);
    if (!videoRes.ok || !videoRes.body) {
      return res.status(502).send("Gagal mengambil file video dari sumber.");
    }

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "video/mp4");
    videoRes.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal mengunduh video.");
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Catatan Hati berjalan di port ${PORT}`);
});
