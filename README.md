# Smart Grocery & Budget Safety Tracker (PWA) 🛒💰

Aplikasi web mobile (**Progressive Web App**) pencatatan belanja bulanan dan pengendali anggaran supermarket bergaya native app untuk **naomiiracle** saat belanja bulanan sambil mendorong troli supermarket.

---

## 🌟 Fitur Baru & Pembaruan
1. **📷 Scanner Barcode Supermarket Otomatis (Tanpa Input Harga Manual):**
   - Viewfinder kamera dengan animasi garis laser pemindai.
   - Deteksi produk otomatis: nama barang, kategori, satuan, serta harga supermarket resmi langsung terisi tanpa perlu mengetik manual.
   - Dilengkapi efek suara *beep* pemindai kasir supermarket menggunakan Web Audio API + getaran haptik.
   - Katalog barcode produk supermarket populer Indonesia (Indomie, Ultra Milk, Aqua, Sania, Telur, SilverQueen, Lifebuoy, dll.) siap dipindai.
2. **🏪 Tampilan Cerah & Background Supermarket:**
   - Latar belakang bertema lorong supermarket modern yang cerah, hangat, dan hidup dengan efek *glassmorphism backdrop blur*.
   - Desain antarmuka cerah dan dinamis, ramah visual untuk layar smartphone.
3. **👤 Profil Pengguna: `naomiiracle`:**
   - Header profil khusus menampilkan nama pengguna **naomiiracle** (*Mahasiswa Rantau • Troli Belanja*).
4. **💳 Pemilihan Penyimpanan Duit / Rekening Bayar (Bank BCA):**
   - Pilihan sumber dana belanja dengan **Bank BCA** sebagai rekening pembayaran utama (BCA Mobile / MyBCA `5271-8892-01`).
   - Dapat beralih ke rekening lain (Dompet Tunai, QRIS/GoPay, Blu BCA, Mandiri).
   - Setiap transaksi mencatat metode pembayaran yang digunakan ke dalam riwayat.

---

## 📱 Karakteristik Mobile-First & Ergonomi
- **Format Layar:** Desain khusus smartphone (lebar maksimal 430px, *centered* pada layar desktop).
- **Floating Bottom Navigation Bar:** Navigasi melayang di bagian bawah dengan ikon Lucide (**Belanja**, **Riwayat**, **Anggaran**), counter badge isi troli, dan *safe-area inset* untuk notch perangkat.
- **Ergonomi Ramah Jempol (Thumb-Friendly):** Seluruh tombol dan target sentuh berukuran minimal 44–48px, stepper kuantitas cepat `+` dan `-`, serta input angka dengan `inputMode="numeric"` / `inputMode="decimal"`.
- **Dukungan PWA & Offline-First:** Standalone mode, service worker caching (Workbox), serta basis data lokal IndexedDB (**Dexie.js**). Berfungsi 100% tanpa login dan tanpa koneksi internet setelah aset dimuat.

---

## 🛠️ Teknologi & Stack
- **Framework & Language:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (Palet Finansial Modern: `#F7F8FA`, `#FFFFFF`, `#2563EB`, `#16A34A`, `#F59E0B`, `#DC2626`)
- **State Management:** Zustand
- **Database Lokal:** Dexie.js (IndexedDB)
- **Form & Validation:** React Hook Form + Zod
- **Ikon:** Lucide React
- **PWA Plugin:** `vite-plugin-pwa`
- **Testing:** Vitest + Testing Library + fake-indexeddb (28 Unit & Integration Tests)

---

## 🚀 Status Pemenuhan Kebutuhan Fungsional (F-01 s/d F-06)

| Kode | Fitur | Status | Deskripsi Implementasi |
| :--- | :--- | :---: | :--- |
| **F-01** | Pencatatan Item Belanja | ✅ Selesai | Form tambah & edit (bottom sheet), scanner barcode otomatis, 10 kategori bahan supermarket, multi-satuan, validasi Zod ketat, data langsung masuk ke troli tanpa refresh. |
| **F-02** | Kalkulasi Kuantitas Realtime | ✅ Selesai | Formula `subtotalKotor = kuantitas × hargaSatuan`, pembaruan otomatis di troli, pembulatan integer Rupiah presisi tanpa floating error. |
| **F-03** | Kalkulator Diskon Bertingkat | ✅ Selesai | Formula `hargaAkhir = hargaAwal × (1 - d1/100) × (1 - d2/100)...`, rincian per tahap, diskon efektif riil, dan nominal penghematan. |
| **F-04** | Komparator Harga Bulan Lalu | ✅ Selesai | Membandingkan harga satuan dengan transaksi kalender bulan sebelumnya. Indikator: 🔴 Naik %, 🟢 Turun %, ⚪ Stabil, atau "Belum ada data". |
| **F-05** | Budget Safety Cap | ✅ Selesai | Pagu batas anggaran dinamis. Indikator Hijau (<70%), Kuning (70-89%), Merah (90-100%), dan Merah Pulse jika terlampaui dengan nominal aktual. |
| **F-06** | Riwayat & Database Terpisah | ✅ Selesai | Penyimpanan Dexie.js terpisah (Katalog, Sesi Troli, Anggaran, Transaksi). Snapshot transaksi immutable, filter bulan, pencarian barang, metode bayar (Bank BCA), serta ekspor & impor JSON terverifikasi. |

---

## 📊 Hasil Pengujian Vitest (28/28 Lulus)

Seluruh skenario pengujian wajib telah diuji dan diverifikasi menggunakan Vitest:
- `barcode_and_payment.test.ts` (4 tes): Pengenalan barcode otomatis, Bank BCA sebagai sumber dana utama, dan persistensi snapshot metode bayar.
- `f01_f02_calculations.test.ts` (4 tes): Validasi perhitungan kuantitas `2 × Rp15.000 = Rp30.000`, `3 × Rp15.000 = Rp45.000`, dan agregat keranjang realtime.
- `f03_discount.test.ts` (5 tes): Diskon tunggal `Rp100.000` diskon `25%` = `Rp75.000`; diskon bertingkat `50% + 20%` = `Rp40.000` (hemat `Rp60.000`, diskon efektif 60%).
- `f04_priceComparison.test.ts` (5 tes): `Rp12.000` ke `Rp15.000` (+25% merah), `Rp12.000` ke `Rp9.000` (-25% hijau), harga sama (stabil), dan penanganan aman tanpa pembagian nol.
- `f05_budgetSafety.test.ts` (5 tes): Anggaran Rp1.000.000 belanja Rp700.000 (waspada), belanja Rp900.000 (kritis), belanja Rp1.050.000 (terlampaui Rp50.000), penanganan pagu 0.
- `f06_historyAndDatabase.test.ts` (5 tes): Integrasi IndexedDB, checkout atomik, snapshot transaksi *immutable*, serta cadangkan/pulihkan backup JSON.

---

## 💻 Cara Menjalankan Aplikasi

```powershell
# Menjalankan development server
npm run dev

# Menjalankan pengujian Vitest
npm run test

# Menjalankan build produksi PWA
npm run build

# Menjalankan preview hasil build
npm run preview
```
Buka browser pada `http://localhost:4173/` atau `http://localhost:5173/`.
