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
  const untuk = document.getElementById("untuk-input")?.value || "";
  tulisError.textContent = "";
  btnGenerate.disabled = true;
  if (tulisEmpty) tulisEmpty.classList.add("hidden");
  paperCard.classList.add("hidden");
  paperSkeleton.classList.remove("hidden");
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kategori, jenis, topik, untuk }),
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

// ---------- TAB 2: Chat Bot Perasaan (respons lokal, tanpa API key) ----------
const chatScroll = document.getElementById("chat-scroll");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");
const suggestRow = document.getElementById("suggest-row");

const HOTLINE_INFO =
  "Kalau rasanya berat sekali, kamu tidak sendirian — coba hubungi layanan Sejiwa di 119 ext 8, atau ceritakan ke orang terdekat yang kamu percaya.";
const POLA_SIAGA = /(bunuh diri|mengakhiri hidup|nyakitin diri|melukai diri|self ?harm|ingin mati)/i;

// Bank respons lokal per kategori perasaan. Semua diproses di perangkat,
// tidak memanggil API/AI eksternal mana pun.
const BANK_RESPON = {
  sedih: {
    kata: ["sedih", "nangis", "menangis", "kecewa", "hancur", "gagal", "putus asa", "patah hati", "terpuruk"],
    balasan: [
      "Aku dengar kamu lagi sedih. Nggak apa-apa kok kalau mau nangis dulu, itu bukan tanda kamu lemah.",
      "Kedengarannya berat banget ya hari ini. Aku di sini, cerita aja sepelan yang kamu mau.",
      "Rasa sedih itu wajar, dan kamu berhak merasakannya tanpa buru-buru 'baik-baik saja'.",
      "Aku ikut merasakan beratnya. Kalau kamu mau, cerita lebih lanjut apa yang bikin sedih hari ini?",
    ],
  },
  cemas: {
    kata: ["cemas", "khawatir", "takut", "gelisah", "panik", "overthinking", "was-was"],
    balasan: [
      "Cemas itu capek ya, pikiran jadi susah tenang. Coba tarik napas pelan-pelan dulu, aku tunggu.",
      "Aku dengar kekhawatiranmu. Boleh cerita apa yang paling bikin kamu was-was sekarang?",
      "Rasa cemas sering bikin pikiran lompat ke skenario terburuk. Pelan-pelan aja, kamu nggak sendirian mikirinnya.",
      "Wajar kok kalau kamu merasa gelisah. Kadang cukup diakui dulu perasaannya, sebelum dicari solusinya.",
    ],
  },
  marah: {
    kata: ["marah", "kesal", "emosi", "benci", "jengkel", "sebel"],
    balasan: [
      "Kedengarannya kamu lagi kesal banget. Wajar kok marah kalau ada yang bikin nggak nyaman.",
      "Aku dengar emosimu. Mau cerita apa yang bikin kamu sekesal ini?",
      "Marah itu sinyal ada batas yang dilanggar. Nggak apa-apa merasakannya, yang penting disalurkan dengan sehat.",
      "Aku di sini dengerin, nggak perlu ditahan-tahan. Cerita aja apa yang terjadi.",
    ],
  },
  lelah: {
    kata: ["lelah", "capek", "cape", "burnout", "pengen istirahat", "ngantuk banget"],
    balasan: [
      "Kedengarannya kamu udah berusaha keras banget sampai capek gini. Istirahat sebentar itu perlu, bukan malas.",
      "Lelah fisik atau lelah hati nih? Dua-duanya sama validnya kok untuk diistirahatkan.",
      "Kamu udah kerja keras. Boleh banget kasih diri sendiri jeda sebentar tanpa merasa bersalah.",
      "Aku dengar capeknya. Coba pelan-pelan aja dulu, nggak semua harus selesai hari ini.",
    ],
  },
  kesepian: {
    kata: ["sendiri", "kesepian", "sepi", "gaada teman", "tidak ada teman", "sendirian"],
    balasan: [
      "Rasa sepi itu berat ya, meskipun kadang dikelilingi orang. Aku di sini nemenin ceritamu.",
      "Terima kasih udah cerita ke aku. Perasaan kesepian itu valid, dan nggak berarti kamu nggak berharga.",
      "Kadang butuh waktu buat nemuin orang yang pas buat cerita. Untuk sekarang, aku dengerin kok.",
    ],
  },
  senang: {
    kata: ["senang", "bahagia", "bersyukur", "seneng", "gembira", "excited"],
    balasan: [
      "Wah, seneng banget dengernya! Cerita dong apa yang bikin harimu secerah ini?",
      "Ikut bahagia buat kamu! Momen kaya gini layak banget dirayain.",
      "Bersyukur itu indah ya. Makasih udah mau bagi cerita baiknya ke aku.",
      "Senyummu kebaca sampai sini. Terus rawat perasaan baik ini ya.",
    ],
  },
  cinta: {
    kata: ["cinta", "sayang", "kangen", "rindu", "suka sama", "gebetan"],
    balasan: [
      "Perasaan itu emang bisa bikin hati rame ya. Cerita lebih lanjut boleh banget.",
      "Kangen atau sayang yang lagi kamu rasain ini, keduanya valid kok untuk diceritain.",
      "Urusan hati emang nggak sesederhana kelihatannya. Aku dengerin, pelan-pelan aja ceritanya.",
    ],
  },
  bingung: {
    kata: ["bingung", "galau", "gatau harus gimana", "gak tau harus apa"],
    balasan: [
      "Bingung nentuin arah itu wajar kok, nggak perlu buru-buru mutusin sekarang.",
      "Aku dengar kegalauanmu. Coba cerita dulu, kadang ngomong keras-keras bikin lebih jelas.",
      "Nggak apa-apa belum tahu jawabannya sekarang. Yuk pelan-pelan diurai bareng.",
    ],
  },
  semangat: {
    kata: ["semangat", "motivasi", "pengen sukses", "pengen berubah"],
    balasan: [
      "Suka banget sama energimu! Cerita dong rencana atau mimpi yang lagi kamu kejar.",
      "Semangat itu modal berharga. Aku di sini dukung ceritamu.",
      "Keren, niat baik kaya gini layak dirayain dari sekarang.",
    ],
  },
};

const RESPON_UMUM = [
  "Aku dengar kok. Cerita lebih banyak boleh, aku nggak buru-buru kok.",
  "Terima kasih udah mau cerita ke aku. Ada lagi yang mau kamu keluarkan?",
  "Pelan-pelan aja ceritanya, aku di sini nemenin.",
  "Boleh cerita lebih detail? Aku pengin ngerti apa yang kamu rasain.",
];

function cariKategori(teks) {
  const rendah = teks.toLowerCase();
  for (const [nama, data] of Object.entries(BANK_RESPON)) {
    if (data.kata.some((k) => rendah.includes(k))) return nama;
  }
  return null;
}

function buatBalasanBot(teks) {
  if (POLA_SIAGA.test(teks)) {
    return `Aku dengar kamu, dan aku serius pengin kamu tetap aman. ${HOTLINE_INFO}`;
  }
  const kategori = cariKategori(teks);
  const kumpulan = kategori ? BANK_RESPON[kategori].balasan : RESPON_UMUM;
  return kumpulan[Math.floor(Math.random() * kumpulan.length)];
}

function addBubble({ text, mine, system, typing }) {
  const row = document.createElement("div");
  row.className = system ? "bubble-row system" : `bubble-row ${mine ? "user" : "app"}`;

  if (system) {
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-system";
    bubble.textContent = text;
    row.appendChild(bubble);
    chatScroll.appendChild(row);
    chatScroll.scrollTop = chatScroll.scrollHeight;
    return row;
  }

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = mine ? "Kamu" : "CH";
  if (mine) avatar.style.fontSize = "8px";

  const wrap = document.createElement("div");
  wrap.className = "bubble-col";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${mine ? "bubble-user" : "bubble-app"}${typing ? " bubble-typing" : ""}`;
  if (typing) {
    bubble.innerHTML = '<span class="typing-dots"><span>●</span><span>●</span><span>●</span></span>';
  } else {
    bubble.textContent = text;
  }
  wrap.appendChild(bubble);

  row.appendChild(avatar);
  row.appendChild(wrap);
  chatScroll.appendChild(row);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return row;
}

// Riwayat percakapan (disimpan di memori tab ini) supaya balasan AI ingat konteks obrolan sebelumnya.
let riwayatChat = [];

async function kirimPesan(pesanAwal) {
  const text = (pesanAwal ?? chatInput.value).trim();
  if (!text) return;

  if (suggestRow) suggestRow.classList.add("hidden");
  addBubble({ text, mine: true });
  const riwayatSebelumnya = riwayatChat.slice();
  riwayatChat.push({ mine: true, text });
  chatInput.value = "";
  chatInput.style.height = "auto";
  btnSend.disabled = true;

  const baris = addBubble({ mine: false, typing: true });

  try {
    const res = await fetch("/api/curhat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesan: text, riwayat: riwayatSebelumnya }),
    });
    const data = await res.json().catch(() => ({}));
    baris.remove();

    if (res.ok && data.balasan) {
      addBubble({ text: data.balasan, mine: false });
      riwayatChat.push({ mine: false, text: data.balasan });
    } else {
      // AI belum aktif / gagal merespons — tetap kasih balasan lewat bank respons lokal
      const balasanCadangan = buatBalasanBot(text);
      addBubble({ text: balasanCadangan, mine: false });
      riwayatChat.push({ mine: false, text: balasanCadangan });
    }
  } catch {
    baris.remove();
    const balasanCadangan = buatBalasanBot(text);
    addBubble({ text: balasanCadangan, mine: false });
    riwayatChat.push({ mine: false, text: balasanCadangan });
  } finally {
    btnSend.disabled = false;
  }
}

btnSend.addEventListener("click", () => kirimPesan());
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    kirimPesan();
  }
});
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
});

if (suggestRow) {
  suggestRow.addEventListener("click", (e) => {
    const chip = e.target.closest(".suggest-chip");
    if (!chip) return;
    kirimPesan(chip.dataset.msg);
  });
}

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
  document.getElementById("tiktok-video")?.pause();
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

    const videoEl = document.getElementById("tiktok-video");
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
    if (data.cover) videoEl.poster = data.cover;
    videoEl.src = data.playNoWatermark;
    videoEl.load();

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
