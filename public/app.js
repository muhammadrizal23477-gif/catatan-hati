// ---------- Entry Screen ----------
(() => {
  const entryScreen = document.getElementById("entry-screen");
  const shell = document.getElementById("shell");
  const entryVideo = document.getElementById("entry-video");
  const entryAudio = document.getElementById("entry-audio");
  const btnMasuk = document.getElementById("btn-masuk");
  const btnEntryAudio = document.getElementById("btn-entry-audio");
  const entryAudioLabel = document.getElementById("entry-audio-label");

  // Sembunyikan konten inti aplikasi sampai user menekan "Masuk ke Aplikasi"
  shell.classList.add("hidden");

  if (entryVideo) {
    entryVideo.play().catch(() => {});
  }

  function perbaruiTombolAudio() {
    if (!btnEntryAudio || !entryAudio) return;
    const sedangMain = !entryAudio.paused;
    btnEntryAudio.classList.toggle("playing", sedangMain);
    if (entryAudioLabel) {
      entryAudioLabel.textContent = sedangMain ? "Musik sedang diputar" : "Putar musik pembuka";
    }
  }

  // Coba putar musik pembuka otomatis. Kalau browser memblokir autoplay
  // bersuara, mainkan begitu ada interaksi pertama dari pengguna.
  if (entryAudio) {
    const cobaPutarAudio = () => entryAudio.play().catch(() => {});
    cobaPutarAudio();
    const putarSaatInteraksi = (e) => {
      // Kalau interaksi pertama justru di tombol audio, biarkan handler
      // tombol di bawah yang menangani, supaya tidak saling menimpa.
      if (e.target.closest && e.target.closest("#btn-entry-audio")) return;
      cobaPutarAudio();
      document.removeEventListener("click", putarSaatInteraksi, { capture: true });
      document.removeEventListener("touchstart", putarSaatInteraksi, { capture: true });
    };
    document.addEventListener("click", putarSaatInteraksi, { once: true, capture: true });
    document.addEventListener("touchstart", putarSaatInteraksi, { once: true, capture: true });

    entryAudio.addEventListener("play", perbaruiTombolAudio);
    entryAudio.addEventListener("pause", perbaruiTombolAudio);
    perbaruiTombolAudio();
  }

  // Tombol manual: nyalakan/matikan musik pembuka kapan saja
  btnEntryAudio?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!entryAudio) return;
    if (entryAudio.paused) {
      entryAudio.play().catch(() => {});
    } else {
      entryAudio.pause();
    }
  });

  btnMasuk?.addEventListener("click", () => {
    entryScreen.classList.add("entry-hidden");
    shell.classList.remove("hidden");

    // Hentikan video langsung, tapi beri musik pembuka jeda singkat (fade out)
    // supaya tetap sempat terdengar meski tap pertama pengguna langsung di
    // tombol ini (musik baru sempat mulai diputar sepersekian detik sebelumnya).
    entryVideo?.pause();
    if (entryAudio && !entryAudio.paused) {
      const audioAwal = entryAudio;
      const volumeAwal = audioAwal.volume;
      const langkah = 12;
      let i = 0;
      const fadeTimer = setInterval(() => {
        i += 1;
        audioAwal.volume = Math.max(0, volumeAwal * (1 - i / langkah));
        if (i >= langkah) {
          clearInterval(fadeTimer);
          audioAwal.pause();
          audioAwal.volume = volumeAwal;
        }
      }, 60);
    } else {
      entryAudio?.pause();
    }

    // Lepas dari DOM flow setelah animasi selesai
    setTimeout(() => {
      entryScreen.style.display = "none";
    }, 500);
  });
})();

// ---------- Toast kecil ----------
const toastEl = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

// ---------- Navigasi bottom tab ----------
const navButtons = document.querySelectorAll(".nav-btn");
const panels = {
  tulis: document.getElementById("panel-tulis"),
  curhat: document.getElementById("panel-curhat"),
  jurnal: document.getElementById("panel-jurnal"),
  tiktok: document.getElementById("panel-tiktok"),
  profil: document.getElementById("panel-profil"),
};

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    Object.entries(panels).forEach(([key, el]) => {
      el.classList.toggle("active", key === btn.dataset.tab);
    });
  });
});

// ---------- TAB 1: Kata & Puisi ----------
let kategori = "Motivasi";
let jenis = "kata";

document.getElementById("kategori-chips").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll("#kategori-chips .chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  kategori = btn.dataset.val;
});

document.getElementById("jenis-chips").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  document.querySelectorAll("#jenis-chips .seg-btn").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  jenis = btn.dataset.val;
});

const btnGenerate = document.getElementById("btn-generate");
const tulisError = document.getElementById("tulis-error");
const paperCard = document.getElementById("paper-card");
const paperSkeleton = document.getElementById("paper-skeleton");
const paperText = document.getElementById("paper-text");
const paperFooterLabel = document.getElementById("paper-footer-label");
const btnCopy = document.getElementById("btn-copy");
const btnRegen = document.getElementById("btn-regen");

const tulisEmpty = document.getElementById("tulis-empty");

// ---------- Musik latar untuk hasil tulisan ----------
const tulisMusic = document.getElementById("tulis-music");
const btnMuteMusic = document.getElementById("btn-mute-music");
let musicMuted = false;

function playTulisMusic() {
  if (!tulisMusic || musicMuted) return;
  tulisMusic.currentTime = 0;
  tulisMusic.play().catch(() => {});
}

function stopTulisMusic() {
  tulisMusic?.pause();
}

btnMuteMusic?.addEventListener("click", () => {
  musicMuted = !musicMuted;
  btnMuteMusic.classList.toggle("active", musicMuted);
  if (musicMuted) {
    stopTulisMusic();
  } else {
    playTulisMusic();
  }
});

// Hentikan musik saat pindah ke tab lain
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab !== "tulis") stopTulisMusic();
  });
});

async function generateTulisan() {
  const topik = document.getElementById("topik-input").value;
  tulisError.textContent = "";
  btnGenerate.disabled = true;
  if (tulisEmpty) tulisEmpty.classList.add("hidden");
  paperCard.classList.add("hidden");
  paperSkeleton.classList.remove("hidden");
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kategori, jenis, topik }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal membuat tulisan.");
    paperText.textContent = data.text;
    paperFooterLabel.textContent = kategori;
    paperSkeleton.classList.add("hidden");
    paperCard.classList.remove("hidden");
    playTulisMusic();
  } catch (err) {
    paperSkeleton.classList.add("hidden");
    tulisError.textContent = err.message;
  } finally {
    btnGenerate.disabled = false;
  }
}

btnGenerate.addEventListener("click", generateTulisan);
btnRegen.addEventListener("click", generateTulisan);

btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(paperText.textContent);
    showToast("Tersalin ke clipboard");
  } catch {
    showToast("Gagal menyalin");
  }
});

// ---------- TAB 2: Edit Foto (tulis teks di atas foto, seret seperti Markup iPhone) ----------
const photoInput = document.getElementById("photo-input");
const btnPilihFoto = document.getElementById("btn-pilih-foto");
const btnGantiFoto = document.getElementById("btn-ganti-foto");
const photoEmpty = document.getElementById("photo-empty");
const photoEditor = document.getElementById("photo-editor");
const canvasWrap = document.getElementById("canvas-wrap");
const photoCanvas = document.getElementById("photo-canvas");
const btnTambahTeks = document.getElementById("btn-tambah-teks");
const btnHapusTeks = document.getElementById("btn-hapus-teks");
const btnUnduhFoto = document.getElementById("btn-unduh-foto");
const teksWarna = document.getElementById("teks-warna");
const teksUkuran = document.getElementById("teks-ukuran");

let gambarAsli = null; // objek Image() resolusi asli
let daftarTeks = []; // { id, x, y (persen 0-100 relatif ke canvas tampilan), text, color, size, el }
let teksTerpilih = null;

function bukaPemilihFoto() {
  photoInput.value = "";
  photoInput.click();
}
btnPilihFoto?.addEventListener("click", bukaPemilihFoto);
btnGantiFoto?.addEventListener("click", bukaPemilihFoto);

photoInput?.addEventListener("change", () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    gambarAsli = img;
    daftarTeks = [];
    teksTerpilih = null;
    canvasWrap.querySelectorAll(".photo-text-layer").forEach((el) => el.remove());
    gambarKeCanvas();
    photoEmpty.classList.add("hidden");
    photoEditor.classList.remove("hidden");
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    showToast("Gagal membuka foto itu, coba foto lain ya.");
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

function gambarKeCanvas() {
  if (!gambarAsli) return;
  photoCanvas.width = gambarAsli.naturalWidth;
  photoCanvas.height = gambarAsli.naturalHeight;
  const ctx = photoCanvas.getContext("2d");
  ctx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
  ctx.drawImage(gambarAsli, 0, 0);
}

function tambahTeksLayer(xPersen, yPersen) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const el = document.createElement("div");
  el.className = "photo-text-layer";
  el.contentEditable = "true";
  el.style.left = `${xPersen}%`;
  el.style.top = `${yPersen}%`;
  el.style.color = teksWarna.value;
  el.style.fontSize = `${teksUkuran.value}px`;

  const layer = { id, xPersen, yPersen, color: teksWarna.value, size: Number(teksUkuran.value), el };
  daftarTeks.push(layer);
  canvasWrap.appendChild(el);
  pilihTeks(layer);
  pasangDragTeks(layer);

  el.addEventListener("focus", () => {
    el.classList.add("editing");
    pilihTeks(layer);
  });
  el.addEventListener("blur", () => {
    el.classList.remove("editing");
    // Hapus otomatis kalau ditinggal kosong tanpa isi teks.
    if (!el.textContent.trim()) {
      daftarTeks = daftarTeks.filter((t) => t.id !== id);
      el.remove();
      if (teksTerpilih && teksTerpilih.id === id) teksTerpilih = null;
    }
  });

  setTimeout(() => el.focus(), 0);
  return layer;
}

function pilihTeks(layer) {
  daftarTeks.forEach((t) => t.el.classList.remove("selected"));
  teksTerpilih = layer;
  if (layer) {
    layer.el.classList.add("selected");
    teksWarna.value = layer.color;
    teksUkuran.value = layer.size;
  }
}

function pasangDragTeks(layer) {
  let seret = false;
  let mulaiX = 0;
  let mulaiY = 0;
  let awalLeft = 0;
  let awalTop = 0;

  function mulaiSeret(e) {
    if (layer.el.classList.contains("editing")) return;
    e.preventDefault();
    seret = true;
    pilihTeks(layer);
    const titik = e.touches ? e.touches[0] : e;
    mulaiX = titik.clientX;
    mulaiY = titik.clientY;
    awalLeft = layer.xPersen;
    awalTop = layer.yPersen;
    layer.el.style.cursor = "grabbing";
  }

  function saatSeret(e) {
    if (!seret) return;
    const titik = e.touches ? e.touches[0] : e;
    const rect = canvasWrap.getBoundingClientRect();
    const dxPersen = ((titik.clientX - mulaiX) / rect.width) * 100;
    const dyPersen = ((titik.clientY - mulaiY) / rect.height) * 100;
    layer.xPersen = Math.min(96, Math.max(0, awalLeft + dxPersen));
    layer.yPersen = Math.min(96, Math.max(0, awalTop + dyPersen));
    layer.el.style.left = `${layer.xPersen}%`;
    layer.el.style.top = `${layer.yPersen}%`;
  }

  function selesaiSeret() {
    seret = false;
    layer.el.style.cursor = "grab";
  }

  layer.el.addEventListener("mousedown", mulaiSeret);
  layer.el.addEventListener("touchstart", mulaiSeret, { passive: false });
  window.addEventListener("mousemove", saatSeret);
  window.addEventListener("touchmove", saatSeret, { passive: false });
  window.addEventListener("mouseup", selesaiSeret);
  window.addEventListener("touchend", selesaiSeret);

  layer.el.addEventListener("dblclick", () => layer.el.focus());
  layer.el.addEventListener("click", (e) => {
    e.stopPropagation();
    pilihTeks(layer);
  });
}

canvasWrap?.addEventListener("click", (e) => {
  if (!gambarAsli) return;
  if (e.target !== canvasWrap && e.target !== photoCanvas) return; // klik di teks ditangani sendiri
  const rect = canvasWrap.getBoundingClientRect();
  const xPersen = ((e.clientX - rect.left) / rect.width) * 100;
  const yPersen = ((e.clientY - rect.top) / rect.height) * 100;
  tambahTeksLayer(Math.min(90, xPersen), Math.min(90, yPersen));
});

btnTambahTeks?.addEventListener("click", () => tambahTeksLayer(20, 20));

btnHapusTeks?.addEventListener("click", () => {
  if (!teksTerpilih) {
    showToast("Ketuk teksnya dulu untuk memilih.");
    return;
  }
  teksTerpilih.el.remove();
  daftarTeks = daftarTeks.filter((t) => t.id !== teksTerpilih.id);
  teksTerpilih = null;
});

teksWarna?.addEventListener("input", () => {
  if (!teksTerpilih) return;
  teksTerpilih.color = teksWarna.value;
  teksTerpilih.el.style.color = teksWarna.value;
});

teksUkuran?.addEventListener("input", () => {
  if (!teksTerpilih) return;
  teksTerpilih.size = Number(teksUkuran.value);
  teksTerpilih.el.style.fontSize = `${teksUkuran.value}px`;
});

btnUnduhFoto?.addEventListener("click", () => {
  if (!gambarAsli) return;
  const hasil = document.createElement("canvas");
  hasil.width = gambarAsli.naturalWidth;
  hasil.height = gambarAsli.naturalHeight;
  const ctx = hasil.getContext("2d");
  ctx.drawImage(gambarAsli, 0, 0);

  const skalaFont = gambarAsli.naturalWidth / canvasWrap.getBoundingClientRect().width;

  daftarTeks.forEach((t) => {
    const teks = t.el.textContent;
    if (!teks.trim()) return;
    const ukuranPx = t.size * skalaFont;
    ctx.font = `700 ${ukuranPx}px Inter, sans-serif`;
    ctx.fillStyle = t.color;
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 4 * skalaFont;
    ctx.shadowOffsetY = 1 * skalaFont;

    const x = (t.xPersen / 100) * hasil.width;
    const y = (t.yPersen / 100) * hasil.height;
    const baris = teks.split("\n");
    baris.forEach((baris1, i) => {
      ctx.fillText(baris1, x, y + i * ukuranPx * 1.2);
    });
  });

  hasil.toBlob((blob) => {
    if (!blob) {
      showToast("Gagal membuat file foto.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catatan-hati-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast("Foto tersimpan ke perangkatmu");
  }, "image/png");
});

// ---------- TAB 3: TikTok ----------
const btnTiktok = document.getElementById("btn-tiktok");
const btnPaste = document.getElementById("btn-paste");
const tiktokUrlInput = document.getElementById("tiktok-url");
const tiktokError = document.getElementById("tiktok-error");
const tiktokResult = document.getElementById("tiktok-result");
const tiktokSkeleton = document.getElementById("tiktok-skeleton");

btnPaste.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    tiktokUrlInput.value = text;
  } catch {
    showToast("Tidak bisa mengakses clipboard");
  }
});

btnTiktok.addEventListener("click", async () => {
  const url = tiktokUrlInput.value.trim();
  tiktokError.textContent = "";
  tiktokResult.classList.add("hidden");
  if (!url) {
    tiktokError.textContent = "Tempel link video TikTok terlebih dahulu.";
    return;
  }
  btnTiktok.disabled = true;
  tiktokSkeleton.classList.remove("hidden");
  try {
    const res = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengambil video.");

    document.getElementById("tiktok-cover").src = data.cover;
    document.getElementById("tiktok-title").textContent = data.title || "(tanpa judul)";
    document.getElementById("tiktok-author").textContent = data.author ? `@${data.author}` : "";
    const durEl = document.getElementById("tiktok-duration");
    durEl.textContent = data.duration ? `${data.duration}s` : "";
    durEl.style.display = data.duration ? "block" : "none";

    const downloadLink = document.getElementById("tiktok-download");
    downloadLink.href = `/api/tiktok/download?src=${encodeURIComponent(data.playNoWatermark)}&filename=${encodeURIComponent((data.title || "tiktok").slice(0, 40) + ".mp4")}`;
    tiktokSkeleton.classList.add("hidden");
    tiktokResult.classList.remove("hidden");
  } catch (err) {
    tiktokSkeleton.classList.add("hidden");
    tiktokError.textContent = err.message;
  } finally {
    btnTiktok.disabled = false;
  }
});

// ---------- TAB Jurnal: Jurnal Suasana Hati (tersimpan di perangkat) ----------
const JURNAL_KEY = "catatan-hati:jurnal";
const moodRow = document.getElementById("mood-row");
const jurnalInput = document.getElementById("jurnal-input");
const btnJurnalSimpan = document.getElementById("btn-jurnal-simpan");
const jurnalList = document.getElementById("jurnal-list");
const jurnalEmpty = document.getElementById("jurnal-empty");
const jurnalCount = document.getElementById("jurnal-count");
const jurnalStats = document.getElementById("jurnal-stats");

const MOOD_LABEL = { senang: "Senang", tenang: "Tenang", biasa: "Biasa saja", sedih: "Sedih", lelah: "Lelah / berat" };
let jurnalMoodTerpilih = null;

function loadJurnal() {
  try {
    return JSON.parse(localStorage.getItem(JURNAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveJurnal(entries) {
  localStorage.setItem(JURNAL_KEY, JSON.stringify(entries));
}

function formatTanggalJurnal(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function renderJurnalStats(entries) {
  if (!entries.length) {
    jurnalStats.classList.add("hidden");
    jurnalStats.innerHTML = "";
    return;
  }
  const counts = {};
  entries.forEach((e) => (counts[e.mood] = (counts[e.mood] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const emojiMap = { senang: "😄", tenang: "🙂", biasa: "😐", sedih: "😔", lelah: "😣" };
  jurnalStats.classList.remove("hidden");
  jurnalStats.innerHTML = `
    <div class="stat-box">
      <span class="stat-num">${entries.length}</span>
      <span class="stat-label">catatan</span>
    </div>
    <div class="stat-box">
      <span class="stat-num">${emojiMap[top[0]] || ""}</span>
      <span class="stat-label">suasana tersering: ${MOOD_LABEL[top[0]] || top[0]}</span>
    </div>
  `;
}

function renderJurnal() {
  const entries = loadJurnal();
  jurnalList.querySelectorAll(".jurnal-item").forEach((el) => el.remove());
  jurnalCount.textContent = entries.length ? `${entries.length} catatan` : "";
  renderJurnalStats(entries);

  if (!entries.length) {
    jurnalEmpty.classList.remove("hidden");
    return;
  }
  jurnalEmpty.classList.add("hidden");

  entries
    .slice()
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("div");
      item.className = "jurnal-item";
      item.innerHTML = `
        <span class="jurnal-emoji">${entry.emoji}</span>
        <div class="jurnal-body">
          <div class="jurnal-meta">
            <span class="jurnal-mood-label">${MOOD_LABEL[entry.mood] || entry.mood}</span>
            <span class="jurnal-date">${formatTanggalJurnal(entry.date)}</span>
          </div>
          ${entry.note ? `<p class="jurnal-note">${entry.note.replace(/</g, "&lt;")}</p>` : ""}
        </div>
        <button class="jurnal-delete" title="Hapus" data-id="${entry.id}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      `;
      jurnalList.appendChild(item);
    });
}

if (moodRow) {
  moodRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".mood-btn");
    if (!btn) return;
    moodRow.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    jurnalMoodTerpilih = { mood: btn.dataset.mood, emoji: btn.dataset.emoji };
    btnJurnalSimpan.disabled = false;
  });

  btnJurnalSimpan.addEventListener("click", () => {
    if (!jurnalMoodTerpilih) return;
    const entries = loadJurnal();
    entries.push({
      id: Date.now().toString(36),
      mood: jurnalMoodTerpilih.mood,
      emoji: jurnalMoodTerpilih.emoji,
      note: jurnalInput.value.trim(),
      date: new Date().toISOString(),
    });
    saveJurnal(entries);
    jurnalInput.value = "";
    moodRow.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("active"));
    jurnalMoodTerpilih = null;
    btnJurnalSimpan.disabled = true;
    renderJurnal();
    showToast("Tersimpan ke jurnal");
  });

  jurnalList.addEventListener("click", (e) => {
    const btn = e.target.closest(".jurnal-delete");
    if (!btn) return;
    const entries = loadJurnal().filter((entry) => entry.id !== btn.dataset.id);
    saveJurnal(entries);
    renderJurnal();
  });

  renderJurnal();
}
