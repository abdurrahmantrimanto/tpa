# 📱 TPA Digital — Panduan Setup Lengkap

## File yang Anda terima:
| File | Fungsi |
|------|--------|
| `tpa-digital.html` | Aplikasi utama (buka di browser/share ke orang tua) |
| `tpa-apps-script.js` | Backend yang diletakkan di Google Apps Script |
| `README_SETUP.md` | Panduan ini |

---

## LANGKAH 1 — Buat Google Sheets

1. Buka [sheets.google.com](https://sheets.google.com) → Buat spreadsheet baru
2. Beri nama: **"TPA Digital Database"**
3. Salin **ID** dari URL: `https://docs.google.com/spreadsheets/d/**[INI_ID_NYA]**/edit`
1ua6BgV7Fbjs9y261W4dy-fcFdOA-Fu9tAY_ZMH2KlMg

---

## LANGKAH 2 — Setup Apps Script

1. Dari Google Sheets, klik menu **Extensions > Apps Script**
2. Hapus semua kode default yang ada
3. **Paste seluruh isi file `tpa-apps-script.js`** ke editor
4. Di baris ke-8, ganti `GANTI_DENGAN_ID_GOOGLE_SHEETS_ANDA` dengan ID dari Langkah 1
5. Klik **Save** (ikon disket)
6. Di dropdown fungsi (kanan atas), pilih **`setupSheets`**
7. Klik **Run** → Izinkan akses yang diminta
8. Cek Google Sheets Anda — harus sudah ada 3 sheet baru ✅

---

## LANGKAH 3 — Deploy Apps Script sebagai Web App

1. Klik **Deploy > New Deployment**
2. Klik ikon gear ⚙️ → pilih **Web App**
3. Isi:
   - Description: `TPA Digital v1`
   - Execute as: **Me**
   - Who has access: **Anyone** *(agar app HTML bisa mengakses)*
4. Klik **Deploy**
5. **Salin URL** yang muncul (format: `https://script.google.com/macros/s/ABC.../exec`)
ID Penerapan : AKfycbx4lsGNKQGDJfbWPDwWd6P3-GXRntGGzN2S4TopFLNFmgSVbkxlI1DRGOz6mwDFBGPm7Q
URL : https://script.google.com/macros/s/AKfycbx4lsGNKQGDJfbWPDwWd6P3-GXRntGGzN2S4TopFLNFmgSVbkxlI1DRGOz6mwDFBGPm7Q/exec

---

## LANGKAH 4 — Hubungkan ke App HTML

1. Buka file **`tpa-digital.html`** dengan text editor (Notepad, VSCode, dll)
2. Cari baris:
   ```
   APPS_SCRIPT_URL: 'GANTI_DENGAN_URL_APPS_SCRIPT_ANDA',
   ```
3. Ganti dengan URL dari Langkah 3:
   ```
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/ABC.../exec',
   ```
4. Simpan file

---

## LANGKAH 5 — Isi Data Santri

Buka Google Sheets → Sheet **Master_Santri**, isi data:
| ID_Santri | Nama_Santri | Foto | Kelas | Saldo_Bintang | Total_Akumulasi |
|-----------|-------------|------|-------|---------------|-----------------|
| S001 | Ahmad Fauzi | (URL foto) | SD | 0 | 0 |
| S002 | Siti Aisyah | | TK | 0 | 0 |

> **Tips Foto:** Upload foto ke Google Drive → klik kanan → "Get shareable link" → ubah ke format: `https://drive.google.com/uc?id=[FILE_ID]`

---

## LANGKAH 6 — Share App ke Orang Tua

**Opsi A — File HTML langsung:**
- Kirim file `tpa-digital.html` via WhatsApp
- Orang tua buka di browser HP

**Opsi B — Host gratis di GitHub Pages / Netlify:**
- Upload file ke GitHub
- Aktifkan GitHub Pages → dapat URL permanen
- Share URL ke grup WhatsApp orang tua

**Opsi C — Google Sites:**
- Buat halaman di sites.google.com
- Embed HTML menggunakan widget "Embed"

---

## FAQ

**Q: Apakah data aman?**
A: Ya, data tersimpan di Google Sheets milik Anda sendiri. Apps Script hanya diakses oleh file HTML ini.

**Q: Apakah orang tua bisa edit data?**
A: Tidak. Halaman publik (Home) hanya read-only. Input form terlindungi password guru.

**Q: Bagaimana mengubah password guru?**
A: Di file HTML, cari `GURU_PASSWORD: '1234'` dan ganti angkanya.

**Q: Bagaimana mengubah daftar hadiah?**
A: Di file HTML, cari bagian `HADIAH:` dan edit nama, ikon, dan harga bintangnya.

**Q: Apakah bisa dipakai offline?**
A: Tidak — butuh koneksi internet untuk sinkronisasi dengan Google Sheets. Tapi saat offline, UI tetap terbuka dengan data terakhir yang dicache browser.

---

## Struktur Google Sheets

### Sheet 1: Master_Santri
```
ID_Santri | Nama_Santri | Foto | Kelas | Saldo_Bintang | Total_Akumulasi_Bintang
```

### Sheet 2: Log_Ngaji
```
Timestamp | Tanggal | ID_Santri | Nama_Santri | Kategori | Level_Iqra | Hal_Iqra | Surah | Ayat | Nilai | Pengajar | Keterangan
```

### Sheet 3: Log_Redeem
```
Timestamp | ID_Santri | Nama_Santri | Hadiah_Diambil | Poin_Dipotong
```

---

*Dibuat dengan ❤️ untuk kemudahan TPA Anda. Semoga bermanfaat dan barokah!*
