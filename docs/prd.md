# 📄 MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Repair Monitoring Information System (RMIS)**

## 📑 1. Document Control & Metadata

* **Product Name:** Repair Monitoring Information System (RMIS)
* **Version:** 1.3.0 (Master Production-Ready Spec)
* **Status:** Approved for Development / Specification Phase
* **Author:** Micka Mayulia Utama
* **Client / Organization:** PT Raf Robian Pratama
* **Industry Domain:** Heavy Equipment Component Repair
* **Project Category:** Management & Decision Support Information System (Kerja Praktik)

---

## 📌 2. Executive Summary & Product Vision

### 2.1 Vision

Mentransformasi manajemen pemantauan perbaikan komponen alat berat dari ekosistem *spreadsheet* manual yang terisolasi menjadi platform web berbasis data terpusat yang cerdas. Platform ini dirancang untuk mengeliminasi beban kerja administratif yang repetitif melalui otomatisasi ekstraksi dokumen, sekaligus berfungsi sebagai sistem pendukung keputusan operasional (*Decision Support System*) yang aman dan responsif.

### 2.2 Core Objectives

* **Otomatisasi Penuh:** Mengurangi intervensi manual dalam pemindahan data Quotation Form berformat PDF hingga 100%.
* **Sentralisasi Keamanan:** Mengamankan aksesibilitas data operasional melalui sistem *Single Sign-On* (SSO) Google Workspace bawaan perusahaan tanpa perlu manajemen kata sandi mandiri.
* **Optimalisasi Visibilitas:** Menyediakan dasbor analitik interaktif yang menyajikan metrik pengerjaan secara *real-time* guna meminimalkan keterlambatan penanganan komponen (*overdue*).

---

## 🚨 3. Problem Statement & Context

Proses bisnis internal saat ini menciptakan hambatan operasional (*bottleneck*) yang signifikan:

1. **Manual Data Entry Loop:** Setiap berkas Quotation Form PDF dari klien yang diterima melalui email harus dibuka secara manual, lalu datanya disalin dan diketik ulang ke dalam baris-baris *spreadsheet*. Proses pengisian ini memakan waktu rata-rata 3–5 menit per dokumen.
2. **Skalabilitas Administrasi Rendah:** Seiring meningkatnya volume pesanan perbaikan komponen, akumulasi waktu yang habis untuk entri data manual terus membengkak dan membebani staf operasional.
3. **Kerentanan Integritas Data:** Pengetikan manual memiliki risiko kesalahan input (*human error*) yang tinggi pada kolom kritis, seperti Nomor Pekerjaan (*Job Number*) atau Nomor Suku Cadang (*Part Number*).
4. **Aksesibilitas Fragmented:** Pemantauan performa pengerjaan komponen yang bertumpu pada dokumen lokal menyulitkan manajemen untuk melacak status riwayat pengerjaan, menganalisis keterlambatan, atau menghasilkan laporan agregat yang cepat.

---

## 👥 4. User Personas & Role-Based Access Control (RBAC)

Sistem menerapkan pembatasan hak akses yang ketat menggunakan kontrol peran berbasis token untuk menjaga keamanan kode dan validitas data operasional:

| Peran Pengguna | Deskripsi Operasional | Hak Akses Fitur Utama |
| --- | --- | --- |
| **Super Admin** | *System Maintainer* / Developer bertanggung jawab atas kesehatan aplikasi. | - Mengelola otorisasi akun pengguna.<br>

<br>- Melakukan elevasi atau penurunan tingkat peran pengguna (*role mapping*).<br>

<br>- Memantau log sistem dan konfigurasi dasar. |
| **Admin (PPC Staff)** | Operator utama (*Production Planning & Control*) pengolah alur data perbaikan. | - Autentikasi via Google SSO.<br>

<br>- Mengunggah banyak dokumen PDF sekaligus (*Batch Upload*).<br>

<br>- Memverifikasi draf hasil ekstraksi teks otomatis.<br>

<br>- Kontrol penuh manipulasi data perbaikan (CRUD *Repairs*).<br>

<br>- Mengakses riwayat proses impor berkas (*Import History*). |
| **Manager & Viewer** | Pengambil keputusan dan tim manajemen yang membutuhkan data analitik (*Read-Only*). | - Mengakses Dasbor Utama beserta komponen grafik statistik.<br>

<br>- Melakukan pencarian tingkat lanjut (*Search*) dan penyaringan (*Filter*).<br>

<br>- Mengekspor data perbaikan ke dalam bentuk laporan Excel atau PDF.<br>

<br>- *Restricted:* Diblokir penuh dari halaman impor berkas dan fungsi modifikasi data. |

---

## ⚙️ 5. Functional Feature Specification

### 5.1 Modul Autentikasi Google Workspace (SSO)

* **Mekanisme Terintegrasi:** Autentikasi menggunakan protokol OAuth 2.0. Pengguna hanya perlu melakukan satu kali klik pada tombol *"Login dengan Google"* menggunakan email resmi perusahaan.
* **Auto-Provisioning:** Pendaftaran akun baru terjadi secara otomatis saat email dengan domain resmi masuk pertama kali ke sistem, dengan peran bawaan (*default*) sebagai **Manager / Viewer**.

### 5.2 Modul Dasbor & Pemantauan Riwayat (DSS Dashboard)

* **Summary Cards:** Menampilkan metrik agregat mencakup *Total Active Projects*, *Completed Components*, *In-Repair Accumulation*, dan *Total Overdue Components*.
* **Interactive Charts:** Menyediakan grafik tren bulanan (*Monthly Repair Chart*) dan sebaran status perbaikan komponen (*Repair Status Chart*).
* **Overdue Alert Table:** Menyajikan daftar khusus komponen yang durasi pengerjaannya telah melampaui batas waktu standar agar dapat segera ditindaklanjuti.

### 5.3 Modul Impor & Ekstraksi Quotation Form (Fitur Prioritas Tertinggi)

* **Multiple PDF Upload:** Fitur seret-dan-lepas (*drag-and-drop*) untuk mengunggah beberapa dokumen PDF sekaligus. Sistem secara otomatis menolak berkas dengan format di luar PDF.
* **Automatic Parsing Engine:** Komponen *backend* membaca dokumen PDF digital secara asinkronus, mengekstrak teks mentah, dan memetakan datanya ke struktur kolom yang sesuai.
* **Preview & Verification Screen:** Data hasil pembacaan mesin disajikan terlebih dahulu dalam bentuk draf pratinjau. Admin wajib memeriksa dan memberikan konfirmasi final sebelum data disimpan secara permanen ke dalam database.

### 5.4 Modul Manajemen Data Perbaikan

* **CRUD Repairs Interface:** Memungkinkan Admin untuk memperbarui detail operasional di lapangan, menambahkan catatan (*Remarks*), serta memperbarui jumlah komponen keluar (*Qty Out*).
* **Advanced Search Engine:** Pencarian berbasis teks penuh (*Full-Text Search*) pada kolom Nomor Pekerjaan (*Job No*), Model Unit, atau Nama Pelanggan secara responsif.

### 5.5 Modul Laporan (Export Engine)

* **Tabular Data Exporter:** Mengonversi baris data perbaikan yang telah disaring berdasarkan filter tertentu menjadi file spreadsheet Microsoft Excel (.xlsx) atau dokumen cetak PDF yang rapi.

---

## 🛠️ 6. Technical Architecture & Tech Stack

Sistem bermigrasi sepenuhnya dari arsitektur monolitik PHP tradisional ke arsitektur *Decoupled JavaScript Ecosystem* guna mendukung performa tinggi dan pengembangan modular:

* **Frontend SPA Engine:** **React.js** – Bertanggung jawab atas rendering antarmuka yang reaktif, manajemen *state* aplikasi yang terpusat, dan penanganan rute sisi klien. Menggunakan library `@react-oauth/google` untuk interaksi SSO dan `Chart.js` untuk rendering komponen analitik dasbor.
* **Backend REST API Engine:** **Node.js (Express.js atau NestJS)** – Bertanggung jawab menyediakan layanan API terenkripsi, manajemen otorisasi middleware, serta pemrosesan parsing file. Menggunakan `passport-google-oauth20` untuk validasi identitas, `jsonwebtoken` untuk penerbitan token sesi internal, dan pustaka parser PDF berbasis server (seperti `pdf-parse`).
* **Database Engine:** **PostgreSQL 17** (dengan pgAdmin 4 sebagai perangkat manajemen) – Menangani penyimpanan data relasional terstruktur dengan integritas tinggi.
* **Security Protocol:** Sesi pengguna yang aman dijaga dengan menyimpan JWT internal ke dalam kuki yang dilengkapi atribut `httpOnly`, `secure`, dan `sameSite=Strict` untuk memblokir celah serangan *Cross-Site Scripting* (XSS).

---

## 📊 7. Database Schema & Data Integrity

### 7.1 Daftar Tabel Inti

Sistem menggunakan konvensi penamingan database yang konsisten: nama tabel menggunakan format *snake_case_plural*, nama kolom menggunakan format *snake_case*, *primary key* bernama `id`, dan *foreign key* menggunakan format `nama_tabel_id`.

1. **users:** Menyimpan informasi identitas profil akun Google korporat dan tingkat peran akses pengguna.
2. **repairs:** Tabel master penampung hasil konfirmasi ekstraksi dokumen Quotation Form serta pembaruan status pengerjaan komponen.
3. **import_logs:** Mencatat riwayat aktivitas impor file PDF yang dilakukan oleh staf Admin untuk kebutuhan audit internal.

### 7.2 Spesifikasi Kolom Tabel `repairs`

* `job_no` (Varchar, Primary/Unique Key - *Not Null*)
* `part_number` (Varchar - *Not Null*)
* `customer_name` (Varchar)
* `wo` (*Work Order* - Varchar)
* `an` (*Advice Note* - Varchar)
* `po` (*Purchase Order* - Varchar)
* `qty_in` (Integer)
* `qty_out` (Integer)
* `date_in` (Date - *Not Null*)
* `date_out` (Date, Nullable)
* `unit_model` (Varchar)
* `part_description` (Text)
* `soh` (*Stock on Hand* - Varchar)
* `remarks` (Text)
* `status` (Varchar)

### 7.3 Kolom Kalkulasi Otomatis (Calculated Fields)

Kolom ini tidak disimpan secara statis sebagai kolom mentah kasar, melainkan dikalkulasi secara dinamis oleh logika server:

* `repair_days`: Menghitung durasi hari pengerjaan komponen.
* `remaining_days`: Menghitung sisa batas waktu pengerjaan aman yang dialokasikan sebelum masuk masa keterlambatan.

---

## 📐 8. Business Logic & Validation Rules

### 8.1 Aturan Restriksi Domain Email (SSO)

Sistem wajib menolak proses otentikasi dan mengembalikan kode status HTTP `403 Forbidden` jika pengguna mencoba login menggunakan akun Google dengan domain publik (seperti `@gmail.com`). Domain yang diperbolehkan dikunci secara kaku melalui variabel lingkungan di sisi server:
`ALLOWED_CORPORATE_DOMAIN=domain-perusahaan.com`

### 8.2 Aturan Perhitungan Durasi Perbaikan (*Repair Days*)

Durasi pengerjaan dihitung otomatis secara *real-time* berbasis tanggal dengan rumus:


$$\text{Repair Days} = \text{Date Out} - \text{Date In}$$


Jika proses perbaikan komponen masih berjalan di workshop (*Date Out* bernilai Kosong/Null), maka rumus otomatis beralih menggunakan tanggal hari ini:


$$\text{Repair Days} = \text{Tanggal Hari Ini} - \text{Date In}$$

### 8.3 Aturan Deteksi Keterlambatan (*Overdue*)

Apabila hasil perhitungan nilai $\text{Repair Days}$ telah melampaui ambang batas standar operasional yaitu **12 Hari**, sistem secara otomatis akan mengubah label status baris komponen tersebut menjadi benderang **Overdue** dan memasukkannya ke dalam daftar tabel peringatan di dasbor manajemen.

### 8.4 Validasi Kronologis dan Penyimpanan Sementara

* **Kronologi Tanggal:** Input data atau hasil ekstraksi dinyatakan tidak sah jika nilai tanggal keluar (`Date Out`) tercatat lebih awal daripada nilai tanggal masuk (`Date In`).
* **Pembersihan Otomatis Memori:** Berkas fisik PDF Quotation Form yang diunggah oleh Admin hanya boleh dibaca sebagai *stream buffer* sementara di dalam memori server untuk kebutuhan ekstraksi teks. Berkas fisik tersebut wajib langsung dihapus secara otomatis dari direktori penampungan server begitu rangkaian proses impor selesai dijalankan demi menjaga efisiensi ruang penyimpanan cakram keras server.

---

## 🛣️ 9. UI/UX Routes & REST API Core Specification

### 9.1 Aplikasi Klien (React SPA Client-Side Routes)

* `/login` $\rightarrow$ Halaman utama otorisasi yang menyediakan tombol tunggal "Masuk dengan Akun Google".
* `/dashboard` $\rightarrow$ Dasbor visual analitik utama menampilkan diagram batang tren bulanan dan sebaran matriks status komponen (Akses: Semua Peran).
* `/imports` $\rightarrow$ Panel area seret-dan-lepas berkas *Multiple PDF Upload* (Akses Terbatas: Admin).
* `/imports/preview` $\rightarrow$ Layar pratinjau tabular penampil draf data hasil ekstraksi pembacaan PDF sebelum disimpan permanen (Akses Terbatas: Admin).
* `/imports/history` $\rightarrow$ Log audit penampil riwayat aktivitas pengunggahan dokumen (Akses Terbatas: Admin).
* `/repairs` $\rightarrow$ Tabel utama penampil direktori pencarian dan penyaringan data perbaikan komponen (Akses: Semua Peran).
* `/repairs/:id` $\rightarrow$ Halaman rincian detail komponen beserta form pembaruan data catatan operasional lapangan (Akses Edit Terbatas: Admin).
* `/admin/users` $\rightarrow$ Panel kontrol khusus pengubahan tingkat peran hak akses akun karyawan (Akses Eksklusif: Super Admin).
* `/reports` $\rightarrow$ Panel penentu parameter filter penyaringan data operasional untuk diunduh menjadi file laporan cetak Excel atau PDF (Akses: Admin & Manager).

### 9.2 API Endpoints (Node.js REST Services)

* `POST /api/v1/auth/google` $\rightarrow$ Menerima kode otorisasi dari klien React, menukarkannya ke server Google, memvalidasi domain, dan menerbitkan kuki enkripsi JWT internal.
* `GET /api/v1/auth/me` $\rightarrow$ Mengambil rincian profil data sesi dan hak akses peran milik pengguna yang sedang aktif saat ini.
* `POST /api/v1/imports/upload` $\rightarrow$ Menerima payload *multipart/form-data* berkas PDF, memproses pembacaan teks langsung di memori RAM, dan mengembalikan draf objek JSON hasil parsing.
* `POST /api/v1/imports/confirm` $\rightarrow$ Menerima konfirmasi final data draf yang telah disetujui Admin untuk disimpan ke dalam tabel `repairs` sekaligus mencatat aktivitas pengunggahan ke tabel `import_logs`.
* `GET /api/v1/repairs` $\rightarrow$ Menarik kumpulan baris data perbaikan komponen (mendukung parameter kueri url dinamis `?search=`, `?filter_status=`, dan `?page=`).
* `PUT /api/v1/repairs/:id` $\rightarrow$ Memperbarui rincian record data pengerjaan komponen tertentu di database berdasarkan ID uniknya.
* `PUT /api/v1/admin/users/:id/role` $\rightarrow$ Mengubah konfigurasi hak akses peran akun tertentu di database (Akses Terbatas: Super Admin).

---

## 🛡️ 10. Unified Error Handling Matrix

Sistem wajib memberikan respons pesan kesalahan yang seragam menggunakan kode identifikasi standar dari server ke antarmuka React untuk memudahkan diagnosis kendala teknis:

| Kategori | Kode Validasi | Pesan Kesalahan Aplikasi | Tindakan Penanganan Sistem |
| --- | --- | --- | --- |
| **Upload PDF** | `PDF001` | "File harus berformat PDF." | Menolak berkas non-PDF di antarmuka dan menghentikan proses unggah berkas. |
| **Upload PDF** | `PDF002` | "Ukuran file melebihi batas maksimum." | Membatasi ukuran berkas maksimal sesuai kebijakan server dan menampilkan pesan peringatan. |
| **Upload PDF** | `PDF003` | "PDF tidak dapat dibaca." | Memberikan notifikasi bahwa berkas PDF terindikasi korup atau berformat gambar pindaian terkunci. |
| **Parsing Teks** | `PARSE001` | "Job Number tidak ditemukan." | Menandai baris draf di layar pratinjau dengan warna merah dan mewajibkan Admin mengisi kolom secara manual. |
| **Parsing Teks** | `PARSE002` | "Part Number tidak ditemukan." | Menandai baris kolom part number yang meleset dari pembacaan Regex teks PDF untuk diisi manual. |
| **Parsing Teks** | `PARSE003` | "Tanggal tidak valid." | Menolak draf data jika format penulisan tanggal di dalam dokumen tidak sesuai standar sistem. |
| **Database** | `DB001` | "Gagal menyimpan data repair." | Membatalkan seluruh rangkaian proses transaksi kueri (*Rollback*) dan menampilkan status kegagalan koneksi. |
| **Database** | `DB002` | "Job Number sudah ada." | Mencegah terjadinya duplikasi data operasional ganda untuk Nomor Pekerjaan yang sama di tabel database. |

---

## 🧪 11. Quality Assurance & Manual Testing Plan

Pengujian keandalan aplikasi dijalankan menggunakan metode *Manual Testing* terstruktur yang mencakup skenario kritis sebagai berikut:

1. **Skenario Autentikasi Sistem:**
* *Login Success:* Memastikan pengguna dengan email berdomain resmi berhasil masuk dan diarahkan ke halaman dasbor yang sesuai hak aksesnya.
* *Login Failed:* Memastikan email dengan domain publik (seperti `@gmail.com`) diblokir penuh oleh sistem dan menampilkan halaman error `403 Forbidden`.
* *Logout Operation:* Memastikan kuki enkripsi sesi JWT internal langsung dihapus bersih dari peramban setelah pengguna menekan tombol keluar.


2. **Skenario Impor & Ekstraksi PDF:**
* *Upload Multiple PDF:* Menguji kemampuan sistem dalam memproses unggahan beberapa berkas dokumen Quotation Form sekaligus secara simultan.
* *Reject Non PDF:* Memastikan sistem menolak secara instan jika pengguna mencoba memasukkan berkas berformat gambar (.png/.jpg) atau dokumen teks (.docx).
* *Data Verification & Save:* Menguji validitas layar pratinjau draf hasil kononmisi ekstraksi teks hingga tombol simpan berhasil melakukan entri data ke database PostgreSQL.


3. **Skenario Dasbor Analitik & Laporan:**
* *Overdue Automation Display:* Memastikan baris komponen pengerjaan yang sengaja diatur masuk workshop selama lebih dari 12 hari otomatis muncul di tabel peringatan dasbor.
* *Report Export Engine:* Memastikan fitur unduh laporan menghasilkan file spreadsheet Excel (.xlsx) dan file PDF cetak yang datanya sinkron sesuai dengan parameter filter aktif.



---

## 🚀 12. Future Improvements & Product Roadmap

Untuk pengembangan sistem tingkat lanjut pada fase pasca-rilis utama, RMIS mengalokasikan rencana penambahan modul berikut:

* **Direct Email Pull Integration:** Sistem secara berkala akan memindai kotak masuk email korporat perusahaan secara otomatis, mengunduh lampiran berkas Quotation Form PDF baru tanpa mengharuskan staf Admin mengunggah berkas secara manual.
* **Hybrid OCR (Optical Character Recognition) Engine:** Mengintegrasikan pustaka pembaca gambar cerdas untuk mendukung pemindaian teks pada dokumen PDF yang berasal dari hasil pindaian mesin fotokopi fisik atau berformat gambar kaku.
* **Warehouse Inventory Synchronization:** Menghubungkan modul data perbaikan komponen langsung dengan sistem ketersediaan stok suku cadang di gudang internal untuk mempercepat estimasi penyelesaian pengerjaan.
* **Automated Notification Engine:** Menyediakan pengiriman pesan pengingat otomatis (via email atau pesan instan WhatsApp) kepada tim operasional jika suatu komponen sudah mendekati atau melampaui batas pengerjaan aman 12 hari.

---
