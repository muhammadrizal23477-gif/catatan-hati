# Catatan Hati

Aplikasi web: generator kata-kata & puisi, ruang curhat dengan balasan motivasi otomatis (tidak terbatas), dan unduh video TikTok tanpa watermark.

## Menjalankan di komputer sendiri

1. Pastikan Node.js versi 18 ke atas sudah terpasang.
2. Buka folder proyek ini di terminal, lalu jalankan:
   ```
   npm install
   ```
3. Salin file `.env.example` menjadi `.env`, lalu isi `ANTHROPIC_API_KEY` dengan API key dari [console.anthropic.com](https://console.anthropic.com).
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
   - `ANTHROPIC_API_KEY` → isi dengan API key Anthropic kamu.
4. Klik **Create Web Service**. Setelah build selesai, aplikasi bisa diakses lewat URL `xxxx.onrender.com` yang diberikan Render.

Catatan: paket gratis Render akan "tidur" setelah tidak ada aktivitas, jadi permintaan pertama setelah lama tidak dipakai bisa terasa lambat beberapa detik.

## Tentang fitur unduh TikTok

Fitur ini memanggil layanan publik pihak ketiga (tikwm.com) dari sisi server untuk mendapatkan link video tanpa watermark, lalu server meneruskan (proxy) file videonya supaya benar-benar terunduh ke perangkat pengguna. Karena bergantung pada layanan pihak ketiga, fitur ini bisa saja berhenti bekerja sewaktu-waktu jika layanan tersebut berubah atau tidak tersedia — kalau itu terjadi, endpoint di `server.js` (`/api/tiktok`) perlu diarahkan ke layanan pengganti.

## Struktur proyek

```
catatan-hati/
├── server.js          # backend Express + endpoint API
├── package.json
├── render.yaml         # konfigurasi deploy Render
├── .env.example
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```
