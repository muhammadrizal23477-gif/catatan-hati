# Catatan Hati

Aplikasi web: generator kata-kata & puisi bertenaga AI (tak terbatas, selalu sesuai tema), ruang curhat dengan balasan AI yang mengalir natural, editor teks di atas foto, jurnal suasana hati, dan unduh video TikTok tanpa watermark.

## Tentang fitur AI (kata-kata & curhat)

Menu **Kata & Puisi** dan **Curhat** memakai AI lewat API key milikmu sendiri. Server mendukung dua provider — tinggal isi salah satu:

- **Groq** (`GROQ_API_KEY`) — cepat dan gratis untuk pemakaian ringan-menengah, model open-source seperti Llama 3.3. Dapatkan API key di [console.groq.com/keys](https://console.groq.com/keys).
- **Anthropic Claude** (`ANTHROPIC_API_KEY`) — kualitas tulisan biasanya lebih halus. Dapatkan API key di [console.anthropic.com](https://console.anthropic.com).

Kalau dua-duanya diisi, Groq dipakai lebih dulu (bisa dipaksa lewat env var `AI_PROVIDER=groq` atau `AI_PROVIDER=anthropic`).

- **Kata & Puisi**: setiap kali kamu menekan "Tulis untukku", server meminta AI menulis kata-kata/puisi baru sesuai tema yang dipilih — jadi hasilnya tidak pernah kehabisan variasi dan tetap fokus ke tema.
- **Curhat**: balasan chatbot "CH" dibuat oleh AI secara real-time berdasarkan isi ceritamu dan riwayat obrolan sebelumnya, jadi bisa mengobrol tanpa batas dan tetap nyambung ke topik perasaanmu (bukan melenceng ke topik lain).
- Kalau belum ada API key yang diisi, atau server API sedang bermasalah, aplikasi otomatis jatuh ke bank konten lokal / bank respons lokal sebagai cadangan supaya tetap bisa dipakai.
- Pesan yang mengandung tanda-tanda krisis (menyakiti diri/bunuh diri) selalu ditangani lebih dulu di server dengan info bantuan (layanan Sejiwa 119 ext 8), sebelum diproses AI.

## Menjalankan di komputer sendiri

1. Pastikan Node.js versi 18 ke atas sudah terpasang.
2. Buka folder proyek ini di terminal, lalu jalankan:
   ```
   npm install
   ```
3. Salin file `.env.example` menjadi `.env`, lalu isi salah satu: `GROQ_API_KEY` (dari [console.groq.com/keys](https://console.groq.com/keys)) atau `ANTHROPIC_API_KEY` (dari [console.anthropic.com](https://console.anthropic.com)).
   - `GROQ_MODEL` / `ANTHROPIC_MODEL` opsional kalau mau ganti model dari default.
4. Jalankan server:
   ```
   npm start
   ```
5. Buka `http://localhost:3000` di browser.

## Deploy ke Render

1. Unggah folder ini ke repository GitHub kamu.
2. Masuk ke [render.com](https://render.com) → **New +** → **Web Service** → hubungkan repository tadi.
   - Render akan otomatis mendeteksi `render.yaml`. Kalau tidak, isi manual:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
3. Di bagian **Environment**, tambahkan environment variable:
   - `GROQ_API_KEY` → isi dengan API key Groq kamu, ATAU
   - `ANTHROPIC_API_KEY` → isi dengan API key Anthropic kamu.
   - `GROQ_MODEL` / `ANTHROPIC_MODEL` (opsional) → isi kalau ingin ganti model dari default.
4. Klik **Create Web Service**. Setelah build selesai, aplikasi bisa diakses lewat URL `xxxx.onrender.com` yang diberikan Render.

Catatan: paket gratis Render akan "tidur" setelah tidak ada aktivitas, jadi permintaan pertama setelah lama tidak dipakai bisa terasa lambat beberapa detik.

## Tentang fitur unduh TikTok

Fitur ini memanggil layanan publik pihak ketiga (tikwm.com) dari sisi server untuk mendapatkan link video tanpa watermark, lalu server meneruskan (proxy) file videonya supaya benar-benar terunduh ke perangkat pengguna. Karena bergantung pada layanan pihak ketiga, fitur ini bisa saja berhenti bekerja sewaktu-waktu jika layanan tersebut berubah atau tidak tersedia — kalau itu terjadi, endpoint di `server.js` (`/api/tiktok`) perlu diarahkan ke layanan pengganti.

## Struktur proyek

```
catatan-hati/
├── server.js          # backend Express + endpoint API (termasuk integrasi AI)
├── package.json
├── render.yaml         # konfigurasi deploy Render
├── .env.example
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```
