# KULIAHKU

Aplikasi web untuk mengatur kuliah: mata kuliah, jadwal (deteksi bentrok), catatan, tugas, ekspor/impor cadangan JSON, dan asisten AI lokal. Berbasis HTML, CSS, dan JavaScript biasa tanpa framework dan tanpa proses build. Dapat dipasang sebagai PWA.

## Menjalankan
Jalankan dari server lokal (tidak perlu instalasi paket):

    python3 -m http.server 8080      # atau: npm start
    # buka http://localhost:8080

Alternatif: `npx serve .`

Membuka `index.html` langsung (`file://`) masih menjalankan fitur inti, tetapi service worker, mode offline, dan pemasangan PWA **tidak aktif**. Fitur tersebut hanya jalan lewat `https://` atau `localhost`.

## Memasang di HP (PWA)
1. Hosting di alamat HTTPS (lihat bagian Deployment).
2. Buka alamat itu di Chrome Android, lalu menu ⋮ → **Pasang aplikasi** / **Tambahkan ke layar utama**. Menu Data juga menampilkan panduan dan tombol pasang bila browser mendukung.
3. iPhone: Safari → Bagikan → **Tambah ke Layar Utama**.

Setelah dibuka sekali secara online, aplikasi dapat dibuka tanpa internet.

## Deployment
Semua berkas statis, jadi cukup unggah isi folder ini ke GitHub Pages, Netlify, Cloudflare Pages, atau hosting statis lain yang memakai HTTPS. Path di dalam proyek bersifat relatif, sehingga aman di subfolder (mis. `user.github.io/kuliahku/`). Setelah mengubah berkas aplikasi, naikkan nomor `CACHE` di `sw.js` agar pengguna mendapat versi baru.

## Data dan privasi
- Data disimpan di `localStorage` browser, terikat pada perangkat dan alamat situs. Berpindah HP, browser, atau domain berarti data kosong. Gunakan **Data → Unduh cadangan** lalu **Pulihkan** di tempat baru.
- Jika data tersimpan rusak, aplikasi masuk mode baca saja dan tidak menimpanya. Salinan mentah dapat diunduh.
- Riwayat chat AI disimpan terpisah dan tidak ikut cadangan.
- Tidak ada data yang dikirim ke server.

## Asisten AI
Asisten ini **berbasis aturan dan bukan model bahasa**. Ia membaca datamu untuk menampilkan jadwal, tugas, catatan, dan mata kuliah, menyusun urutan prioritas dan jadwal belajar 7 hari, serta merangkum teks yang ditempel (ekstraktif). Ia tidak punya pengetahuan umum dan tidak mengubah data.

Menyambungkan AI online: ganti `AI.provider.reply` di `ai.js` dengan fungsi yang memanggil backend milikmu. Kunci API wajib disimpan di server (variabel lingkungan), jangan pernah di JavaScript frontend. Minta persetujuan pengguna sebelum mengirim datanya, dan batasi permintaan per pengguna.

## Batasan versi ini
Belum ada login, peran Developer/Member, sinkronisasi antar perangkat, unggah materi/PDF, atau notifikasi pengingat. Semua itu membutuhkan backend.

## Pengujian
    node tests/run.js      # atau: npm test
Tes mencakup logika penyimpanan, impor/ekspor, mesin AI, serta kelengkapan manifest dan daftar cache. Tampilan dan pemasangan PWA perlu dicek manual di Chrome.

## Struktur
    index.html  styles.css  app.js  storage.js  ai.js  pwa.js
    sw.js  manifest.webmanifest  assets/ (logo.svg, ikon PNG)  tests/run.js
