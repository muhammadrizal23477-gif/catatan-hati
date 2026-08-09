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

async function generateTulisan() {
  const topik = document.getElementById("topik-input").value;
  tulisError.textContent = "";
  btnGenerate.disabled = true;
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

// ---------- TAB 2: Ruang Curhat ----------
const chatScroll = document.getElementById("chat-scroll");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");

function addBubble(text, role) {
  const row = document.createElement("div");
  row.className = `bubble-row ${role === "user" ? "user" : "app"}`;

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "Kamu" : "CH";
  if (role === "user") avatar.style.fontSize = "8px";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "bubble-user" : "bubble-app"}`;
  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatScroll.appendChild(row);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return { row, bubble };
}

function addTypingBubble() {
  const row = document.createElement("div");
  row.className = "bubble-row app";
  row.innerHTML = `<span class="avatar">CH</span><div class="bubble bubble-app bubble-typing"><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span> menulis balasan</div>`;
  chatScroll.appendChild(row);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return row;
}

async function kirimCurhat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  chatInput.style.height = "auto";
  addBubble(text, "user");
  btnSend.disabled = true;
  const typingRow = addTypingBubble();

  try {
    const res = await fetch("/api/curhat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    typingRow.remove();
    if (!res.ok) throw new Error(data.error || "Gagal membalas pesan.");
    addBubble(data.reply, "app");
  } catch (err) {
    typingRow.remove();
    addBubble("Maaf, aku belum bisa membalas sekarang. Coba kirim lagi sebentar ya.", "app");
  } finally {
    btnSend.disabled = false;
  }
}

btnSend.addEventListener("click", kirimCurhat);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    kirimCurhat();
  }
});
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
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
