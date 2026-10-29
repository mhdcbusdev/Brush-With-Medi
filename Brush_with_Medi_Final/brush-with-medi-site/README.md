# Brush with Medi — Static Web Game (Cloudflare Pages + Elementor)

Game edukasi anak untuk Medikids. Static site murni (HTML/CSS/JS), tanpa library besar,
mobile portrait, mouse + touch, progres 7 hari disimpan di `localStorage`.

## Struktur folder
```
brush-with-medi-site/
├── index.html            # halaman game (layar penuh)
├── css/style.css
├── js/game.js
├── images/
│   ├── medi/             # karakter Medi (gameface, brush, hore, drink, trophy, avatar)
│   └── tools/            # sikat, gelas, odol (semua PNG asli → WebP)
├── _headers              # cache Cloudflare + izin embed iframe
└── embed-elementor.html  # cuplikan embed untuk Elementor
```
Total aset gambar ± **281 KB** (WebP, visual Medi tidak diubah). Preload: gambar layar
awal; sisanya lazy-load saat dibutuhkan.

## Deploy ke Cloudflare Pages (via GitHub)
1. Buat repo GitHub baru, upload SEMUA isi folder ini ke root repo, lalu push.
2. Buka Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pilih repo-nya. Pengaturan build:
   - **Framework preset:** None
   - **Build command:** (kosongkan)
   - **Build output directory:** `/`  (root — file sudah statis)
4. **Save and Deploy.** Dapat URL seperti `https://brush-with-medi.pages.dev`.
5. (Opsional) Tambah custom domain, misal `game.medikids.co.id`, di tab **Custom domains**.

> Tiap update: push ke GitHub → Cloudflare auto-deploy.

## Integrasi ke WordPress + Elementor
Website WordPress TIDAK terbebani karena game di-host terpisah di Cloudflare.

**Cara A — Tombol "Main Sekarang" (paling ringan, layar penuh):**
Elementor → widget **Button** → Text: `Main Sekarang` → Link: URL Pages kamu →
aktifkan buka tab baru. Pengunjung main di halaman penuh yang cepat.

**Cara B — Embed di halaman (iframe):**
Elementor → widget **HTML** → tempel isi `embed-elementor.html` (ganti URL dengan URL
Pages kamu). Sudah responsif (rasio HP) + ada tombol "Main Sekarang (Layar Penuh)".

## Catatan
- **Progres 7 hari** disimpan di `localStorage` pada domain game (Cloudflare). Jika di-embed
  via iframe, progres tersimpan per-domain game dan tetap ada saat pengunjung kembali.
- Game sudah mendukung iframe (tidak ada `X-Frame-Options` yang memblokir).
- Tidak ada dependensi/library eksternal.
