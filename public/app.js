// ---------- Navigasi tab ----------
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
  tulis: document.getElementById("panel-tulis"),
  curhat: document.getElementById("panel-curhat"),
  tiktok: document.getElementById("panel-tiktok"),
};

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    Object.entries(panels).forEach(([key, el]) => {
      el.classList.toggle("hidden", key !== btn.dataset.tab);
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
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll("#jenis-chips .chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  jenis = btn.dataset.val;
});

const btnGenerate = document.getElementById("btn-generate");
const tulisError = document.getElementById("tulis-error");
const paperCard = document.getElementById("paper-card");
const paperText = document.getElementById("paper-text");
const paperFooter = document.getElementById("paper-footer");

btnGenerate.addEventListener("click", async () => {
  const topik = document.getElementById("topik-input").value;
  tulisError.textContent = "";
  btnGenerate.disabled = true;
  btnGenerate.textContent = "Menulis...";
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kategori, jenis, topik }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal membuat tulisan.");
    paperText.textContent = data.text;
    paperFooter.textContent = `— ${kategori}`;
    paperCard.classList.remove("hidden");
  } catch (err) {
    tulisError.textContent = err.message;
  } finally {
    btnGenerate.disabled = false;
    btnGenerate.textContent = "Tulis untukku";
  }
});

// ---------- TAB 2: Ruang Curhat ----------
const chatScroll = document.getElementById("chat-scroll");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");

function addBubble(text, role) {
  const div = document.createElement("div");
  div.className = `bubble ${role === "user" ? "bubble-user" : "bubble-app"}`;
  div.textContent = text;
  chatScroll.appendChild(div);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return div;
}

async function kirimCurhat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  addBubble(text, "user");
  btnSend.disabled = true;
  const typingBubble = addBubble("sedang menulis balasan...", "app");
  typingBubble.classList.add("bubble-typing");

  try {
    const res = await fetch("/api/curhat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    typingBubble.remove();
    if (!res.ok) throw new Error(data.error || "Gagal membalas pesan.");
    addBubble(data.reply, "app");
  } catch (err) {
    typingBubble.remove();
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

// ---------- TAB 3: TikTok ----------
const btnTiktok = document.getElementById("btn-tiktok");
const tiktokUrlInput = document.getElementById("tiktok-url");
const tiktokError = document.getElementById("tiktok-error");
const tiktokResult = document.getElementById("tiktok-result");

btnTiktok.addEventListener("click", async () => {
  const url = tiktokUrlInput.value.trim();
  tiktokError.textContent = "";
  tiktokResult.classList.add("hidden");
  if (!url) {
    tiktokError.textContent = "Tempel link video TikTok terlebih dahulu.";
    return;
  }
  btnTiktok.disabled = true;
  btnTiktok.textContent = "Mencari...";
  try {
    const res = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengambil video.");

    document.getElementById("tiktok-cover").src = data.cover;
    document.getElementById("tiktok-title").textContent = data.title || "(tanpa judul)";
    document.getElementById("tiktok-author").textContent = data.author ? `@${data.author}` : "";
    const downloadLink = document.getElementById("tiktok-download");
    downloadLink.href = `/api/tiktok/download?src=${encodeURIComponent(data.playNoWatermark)}&filename=${encodeURIComponent((data.title || "tiktok").slice(0, 40) + ".mp4")}`;
    tiktokResult.classList.remove("hidden");
  } catch (err) {
    tiktokError.textContent = err.message;
  } finally {
    btnTiktok.disabled = false;
    btnTiktok.textContent = "Cari video";
  }
});
