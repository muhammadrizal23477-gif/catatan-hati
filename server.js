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

// Bait puisi (masing-masing 2 baris) — 10 pembuka x 10 penutup per kategori,
// menghasilkan 100 puisi 4-baris yang unik dan tetap mengalir secara makna.
const BAIT_PUISI = {
  Motivasi: {
    pembuka: [
      "Langkah kecil hari ini,\nadalah jejak menuju esok yang lebih terang.",
      "Ketika lelah mendekap erat,\ningatlah kenapa kau memulai.",
      "Badai boleh datang malam ini,\ntapi fajar tetap punya janji.",
      "Jangan takut berjalan pelan,\nasal kau tak pernah berhenti.",
      "Setiap keringat yang jatuh hari ini,\nsedang menulis kisah tentang siapa kau nanti.",
      "Kegagalan bukan tanda untuk menyerah,\nia hanya bagian dari peta menuju arah.",
      "Waktu tak pernah salah membawa,\nsemua yang kau tanam pada masanya akan tiba.",
      "Ada hari yang terasa berat sekali,\ntapi kau tetap memilih untuk berdiri lagi.",
      "Mimpi besar dimulai dari niat kecil,\nyang dijaga meski dunia terasa sulit.",
      "Bukan seberapa cepat kau berlari,\ntapi seberapa kuat kau bertahan hari demi hari.",
    ],
    penutup: [
      "Tak perlu berlari,\ncukup jangan berhenti berjalan.",
      "Setiap luka yang kau rawat,\nakan menjadi kekuatan di hari nanti.",
      "Bertahanlah sedikit lagi,\nsebab kamu lebih kuat dari yang kau kira.",
      "Sebab yang penting bukan secepat apa,\ntapi seteguh apa kau menjaga arah.",
      "Suatu hari nanti kau akan mengerti,\nkenapa semua perjuangan ini berarti.",
      "Teruslah melangkah meski gelap terasa panjang,\nsebab fajar tak pernah lupa datang.",
      "Percayalah pada proses yang sedang kau jalani,\nsebab hasil terbaik butuh waktu untuk terjadi.",
      "Kau tidak sendirian dalam perjuangan ini,\nsemesta sedang menyusun jalanmu sendiri.",
      "Jangan bandingkan langkahmu dengan orang lain,\nsebab setiap orang punya waktu yang berlainan.",
      "Simpan saja niat itu baik-baik,\nsebab ia akan membawamu ke tempat yang layak.",
    ],
  },
  Cinta: {
    pembuka: [
      "Kau hadir seperti senja,\npelan namun mengubah seluruh warna langit.",
      "Cinta bukan tentang siapa yang paling sempurna,\ntapi siapa yang mau tetap tinggal saat semua tak sempurna.",
      "Rasa ini tumbuh tanpa terburu,\ndari hal-hal kecil yang kau lakukan untukku.",
      "Kau bukan alasan aku bahagia,\ntapi kau membuat bahagia terasa lebih nyata.",
      "Tidak semua cinta harus diributkan,\nada yang cukup dijaga dalam diam dan kesetiaan.",
      "Di antara banyak orang yang datang dan pergi,\nkau yang memilih untuk tetap menemani.",
      "Cinta yang tenang tidak selalu terlihat mewah,\ntapi terasa hangat dan membuat pulang jadi mudah.",
      "Kau mengajarkanku arti menerima,\nbukan hanya mencintai yang sempurna saja.",
      "Bersamamu waktu terasa lebih pelan,\nseakan dunia memberi ruang untuk kita berdua bertahan.",
      "Aku belajar mencintai tanpa syarat,\nsejak kau menerimaku apa adanya, tanpa berat.",
    ],
    penutup: [
      "Dan aku, yang dulu ragu,\nkini belajar percaya pada rasa ini.",
      "Dan aku memilih tetap di sini,\nbersamamu, apa adanya.",
      "Dan aku bahagia menyaksikannya,\ntumbuh perlahan menjadi cinta yang nyata.",
      "Dan itu sudah lebih dari cukup,\nuntuk membuatku ingin terus menyambut.",
      "Sebab cinta yang bertahan,\nbukan yang paling ramai, tapi yang paling tulus dan tenang.",
      "Dan aku bersyukur menjadi tempat singgahmu,\nsampai kapan pun waktu mengizinkanku.",
      "Sebab bersamamu, aku merasa cukup,\ntanpa perlu mencari yang lain untuk kutuju.",
      "Dan aku ingin terus belajar bersamamu,\nmenata cinta ini, hari demi waktu.",
      "Semoga waktu selalu mengizinkan,\nkita berdua tetap saling menguatkan.",
      "Dan untuk itu aku berterima kasih,\npada semesta, karena telah mempertemukan kita berdua di sini.",
    ],
  },
  Sedih: {
    pembuka: [
      "Malam ini hujan turun di dalam dada,\ntanpa suara, tanpa siapa yang tahu.",
      "Ada luka yang tak terlihat mata,\nhanya terasa saat sunyi tiba.",
      "Kadang aku hanya ingin diam sejenak,\nmembiarkan air mata jatuh tanpa harus dijelaskan.",
      "Sedih ini datang tanpa permisi,\nmerampas sedikit demi sedikit energi hari ini.",
      "Aku lelah berpura-pura baik-baik saja,\npadahal di dalam hati sedang runtuh perlahan.",
      "Tidak semua yang terlihat tenang,\nsedang benar-benar baik-baik saja di dalam.",
      "Hatiku sedang berat malam ini,\nmembawa cerita yang belum sempat kuutarakan sendiri.",
      "Aku menangis bukan karena lemah,\ntapi karena aku sudah menahan terlalu lama.",
      "Ruang ini sunyi, sesunyi hatiku,\nyang sedang mencoba memahami apa yang sedang terjadi padaku.",
      "Kadang aku hanya butuh didengar,\nbukan dinasihati, hanya ditemani sebentar saja.",
    ],
    penutup: [
      "Tapi biarkan saja ia jatuh,\nsebab esok pagi akan datang jua.",
      "Pelan-pelan, izinkan dirimu berduka,\nsebelum kembali berjalan seperti semula.",
      "Sebab air mata juga cara hati bicara,\ntentang apa yang tak sanggup diucap kata-kata.",
      "Dan itu tidak apa-apa,\nsebab kamu berhak merasakannya tanpa terburu sembuh.",
      "Suatu hari nanti akan terasa ringan,\nasal kau beri waktu, pelan-pelan.",
      "Sebab tidak semua luka harus segera pulih,\nada yang butuh waktu untuk benar-benar sembuh.",
      "Dan besok, meski masih terasa berat,\ntetap akan ada langkah baru yang bisa diperbuat.",
      "Kamu tidak harus kuat setiap saat,\ncukup jujur pada dirimu sendiri, itu sudah tepat.",
      "Sebab badai ini pun akan reda,\nmeninggalkan langit yang kembali cerah seperti sedia.",
      "Dan aku percaya, meski pelan,\nkamu akan menemukan caramu sendiri untuk bertahan.",
    ],
  },
  Rindu: {
    pembuka: [
      "Kutulis rindu ini di antara detik yang sepi,\nberharap angin menyampaikannya kepadamu.",
      "Jarak hanya angka,\ntapi rindu tak pernah tahu cara berhenti.",
      "Setiap sudut yang pernah kita singgahi,\nmasih menyimpan jejak yang belum sempat kulupakan sendiri.",
      "Rindu ini datang di waktu yang tak terduga,\nmembuatku berhenti sejenak di tengah harinya.",
      "Aku menatap langit yang sama denganmu,\nberharap jarak ini tak benar-benar memisahkan kita berdua.",
      "Kadang aku hanya ingin mendengar suaramu,\nsekadar melepas rindu yang menumpuk begitu lama.",
      "Waktu berjalan tanpa menungguku,\ntapi rindu ini selalu setia mengikutiku.",
      "Aku menyimpan rindu ini rapi-rapi,\nsampai tiba saatnya kita bertemu lagi.",
      "Setiap malam aku bertanya pada bintang,\nkapan rindu ini bisa berubah jadi pelukan yang panjang.",
      "Rindu ini bukan tentang keluhan,\ntapi tentang betapa berartinya kau dalam kehidupan.",
    ],
    penutup: [
      "Jika kau rasakan hangat tiba-tiba,\nitu aku, yang sedang merindu.",
      "Aku menunggu waktu mempertemukan kita lagi,\ndi ruang dan saat yang tepat.",
      "Sebab rindu yang tulus akan selalu menemukan jalan,\nuntuk sampai walau harus menunggu lebih lama.",
      "Dan rindu ini kusimpan sebagai alasan,\nuntuk terus melangkah menuju pertemuan.",
      "Meski jarak memisahkan raga kita,\nhati ini tetap saling menyapa.",
      "Sebab rindu sejati tidak pernah memaksa,\nia hanya menunggu dengan sabar dan percaya.",
      "Dan aku percaya, waktu akan mempertemukan,\nkita berdua, pada saat yang telah ditentukan.",
      "Sampai saat itu tiba, kusimpan rindu ini,\nsebagai bukti betapa berartinya dirimu bagi hati ini.",
      "Semoga bintang menyampaikan pesan ini untukku,\nbahwa aku merindukanmu lebih dari yang kau tahu.",
      "Dan aku akan terus menunggu dengan sabar,\nsampai rindu ini berubah menjadi pertemuan yang benar.",
    ],
  },
  Perjuangan: {
    pembuka: [
      "Di jalan yang terjal ini,\nkubawa langkah yang kadang goyah.",
      "Peluh ini bukan tanda lemah,\nia bukti aku sedang berjuang.",
      "Setiap kali aku ingin menyerah,\nkuingat lagi alasan kenapa aku memulai.",
      "Jalan ini tidak selalu mulus,\ntapi aku memilih untuk terus melangkah tanpa putus.",
      "Aku jatuh berkali-kali di jalan ini,\ntapi setiap kali itu juga aku belajar bangkit sendiri.",
      "Perjuangan ini sunyi, tak banyak yang tahu,\ntapi aku percaya semua usaha punya waktunya untuk berlaku.",
      "Tidak ada yang bertepuk tangan untuk perjuanganku,\ntapi aku tetap melangkah dengan caraku sendiri.",
      "Setiap luka dalam perjalanan ini,\nmengajarkan aku arti bertahan sampai nanti.",
      "Aku memilih untuk terus mencoba,\nmeski hasilnya belum terlihat nyata.",
      "Dalam lelah yang datang silih berganti,\naku tetap memilih untuk berdiri lagi.",
    ],
    penutup: [
      "Tapi kubawa juga tekad,\nyang tak pernah benar-benar padam.",
      "Suatu hari nanti akan kupetik,\nbuah dari semua yang kutanam.",
      "Sebab perjuangan yang sungguh-sungguh,\ntidak akan pernah benar-benar sia-sia dan luruh.",
      "Dan aku percaya, jalan ini akan sampai,\npada tujuan yang selama ini kunantikan sendiri.",
      "Sebab bangkit lagi setelah jatuh,\nadalah keberanian yang tidak semua orang tahu.",
      "Dan aku yakin, semesta sedang mencatat,\nsetiap usaha yang kulakukan dengan penuh semangat.",
      "Sebab perjuangan yang sunyi pun tetap berarti,\ndan hasilnya akan terasa pada waktunya nanti.",
      "Dan luka itu menjadi kekuatan baru,\nyang membawaku semakin dekat pada tujuanku.",
      "Sebab hasil bukan satu-satunya ukuran,\nprosesnya sendiri sudah menjadi kebanggaan.",
      "Dan aku percaya pada diriku sendiri,\nbahwa aku akan sampai, cepat atau lambat nanti.",
    ],
  },
  "Masalah Hidup": {
    pembuka: [
      "Badai ini terasa panjang,\ntapi tak ada badai yang abadi.",
      "Kupikul beban ini sendiri,\ntapi aku percaya ada ujung dari semua ini.",
      "Hidup memang tidak selalu berjalan sesuai rencana,\ntapi aku belajar menerima dan terus mencoba lagi.",
      "Masalah datang silih berganti,\ntapi aku percaya semua ada hikmah di dalamnya nanti.",
      "Kadang aku merasa sendirian menghadapi ini,\ntapi aku tahu ada yang selalu mendoakan dari hati.",
      "Ujian ini terasa berat sekarang,\ntapi aku percaya aku akan melewatinya perlahan.",
      "Tidak semua masalah bisa langsung selesai hari ini,\ntapi aku memilih untuk terus mencoba mencari jalan keluar sendiri.",
      "Aku pernah merasa dunia terasa berat sekali,\ntapi aku tetap memilih untuk bertahan sampai nanti.",
      "Setiap masalah mengajarkanku sesuatu yang baru,\ntentang seberapa kuat sebenarnya diriku.",
      "Kadang jalan keluar tidak langsung terlihat,\ntapi aku percaya semua akan indah pada waktunya kelak.",
    ],
    penutup: [
      "Setelah gelap yang menekan,\nakan ada terang yang menanti.",
      "Satu langkah, satu hari,\naku akan sampai juga di sana.",
      "Sebab setiap masalah punya waktunya untuk selesai,\ndan aku percaya waktuku akan tiba juga nantinya.",
      "Dan aku percaya, semua ini bukan tanpa arti,\nia sedang membentukku menjadi lebih kuat lagi.",
      "Sebab aku tidak sendirian memikul ini,\nada yang selalu menyertai langkahku setiap hari.",
      "Dan perlahan aku akan menemukan jalan keluarnya,\nselama aku tidak berhenti mencoba dan percaya.",
      "Sebab tak ada ujian yang diberikan tanpa alasan,\nselalu ada pelajaran di balik setiap perjalanan.",
      "Dan aku percaya matahari akan terbit lagi,\nsetelah malam paling gelap yang pernah kulewati.",
      "Sebab masalah ini pun akan berlalu,\nmeninggalkan aku yang lebih kuat dari sebelumnya.",
      "Dan aku akan terus melangkah dengan yakin,\nbahwa semua ini akan berakhir baik pada akhirnya nanti.",
    ],
  },
  Syukur: {
    pembuka: [
      "Kubuka mata pagi ini,\ndan itu sudah cukup untuk berterima kasih.",
      "Di antara semua yang belum tercapai,\nada banyak hal kecil yang patut disyukuri.",
      "Bersyukur bukan berarti hidup selalu sempurna,\ntapi memilih melihat kebaikan di tengah segala kekurangan.",
      "Setiap napas yang kuhirup hari ini,\nadalah hadiah yang tak semua orang bisa rasakan lagi.",
      "Aku belajar bersyukur dari hal-hal kecil,\nyang dulu sering kulewatkan begitu saja tanpa disadari.",
      "Tidak semua orang seberuntung ini,\nmasih diberi kesempatan untuk mencoba lagi hari ini.",
      "Ada kebahagiaan kecil di setiap harinya,\nyang layak untuk disyukuri dan dirayakan sepenuhnya.",
      "Rasa cukup bukan datang dari banyaknya yang dimiliki,\ntapi dari hati yang mampu bersyukur setiap hari.",
      "Aku bersyukur atas setiap langkah yang sudah kutempuh,\nmeski jalannya tidak selalu mudah dan mulus.",
      "Pagi ini aku memilih untuk berhenti sejenak,\nmenghitung berkah yang selama ini terlewat begitu banyak.",
    ],
    penutup: [
      "Sebab tak semua orang seberuntung ini,\nmasih diberi satu hari lagi untuk mencoba.",
      "Napas, langkah, dan hari yang baru,\nadalah hadiah yang sering terlewat begitu saja.",
      "Dan aku belajar bahwa cukup itu,\ndatang dari hati yang mau bersyukur, bukan dari harta.",
      "Sebab kebahagiaan sejati bukan soal memiliki banyak,\ntapi soal mampu bersyukur atas yang ada meski sedikit.",
      "Dan aku memilih terus bersyukur setiap hari,\natas semua yang telah dan akan terjadi nanti.",
      "Sebab hidup ini penuh berkah yang sering terlewat,\ntinggal bagaimana aku mau melihatnya dengan tepat.",
      "Dan rasa syukur ini membuatku lebih tenang,\nmenjalani hidup meski penuh tantangan.",
      "Sebab setiap hal kecil yang kusyukuri hari ini,\nmenjadi alasan untuk tersenyum lebih sering lagi.",
      "Dan aku percaya, semakin aku bersyukur,\nsemakin banyak kebaikan yang akan mengalir.",
      "Sebab syukur adalah kunci hati yang tenang,\ndi tengah dunia yang kadang terasa berat dan menantang.",
    ],
  },
};

// Bangun 100 kombinasi kata-kata & 100 puisi unik per kategori
// (10 pembuka x 10 penutup masing-masing).
const KONTEN = {};
for (const kategori of Object.keys(FRASA_KATA)) {
  const { pembuka, penutup } = FRASA_KATA[kategori];
  const kata = [];
  for (const p of pembuka) {
    for (const t of penutup) {
      kata.push(`${p}, ${t}`);
    }
  }

  const baitPuisi = BAIT_PUISI[kategori];
  const puisi = [];
  if (baitPuisi) {
    for (const p of baitPuisi.pembuka) {
      for (const t of baitPuisi.penutup) {
        puisi.push(`${p}\n${t}`);
      }
    }
  }

  KONTEN[kategori] = { kata, puisi };
}

function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatNama(nama) {
  return String(nama)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(" ");
}

app.post("/api/generate", (req, res) => {
  const { kategori = "Motivasi", jenis = "kata", untuk = "" } = req.body || {};
  const grup = KONTEN[kategori] || KONTEN.Motivasi;
  const daftar = grup[jenis] || grup.kata;
  let text = pilihAcak(daftar);

  const namaTujuan = formatNama(untuk);
  if (namaTujuan) {
    text = `${namaTujuan},\n${text}`;
  }

  res.json({ text });
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
