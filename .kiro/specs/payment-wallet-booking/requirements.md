# Requirements Document

## Introduction

Fitur ini menambahkan sistem pembayaran lengkap ke Lampira — marketplace wisata Lampung. Saat ini sistem booking sudah berjalan tetapi belum memiliki mekanisme pembayaran. Fitur ini mencakup:

- **Wallet (Dompet Digital)**: Setiap tourist dan vendor memiliki saldo di platform.
- **Topup & Withdraw**: Tourist dapat mengisi saldo melalui Midtrans atau PayPal; vendor dapat menarik saldo ke rekening bank.
- **Alur Pembayaran Booking**: Pembayaran dari tourist ditahan (escrow) hingga servis selesai, lalu dilepas ke vendor dikurangi komisi platform.
- **Notifikasi In-App**: Pemberitahuan real-time untuk tourist dan vendor pada setiap tahap transaksi dan booking.
- **Payment Gateway**: Midtrans (QRIS, Virtual Account) dan PayPal (Orders API), dengan webhook otomatis.

---

## Glossary

- **Tourist**: Pengguna dengan role `tourist` yang memesan layanan wisata.
- **Vendor**: Pengguna dengan role `vendor` yang menyediakan layanan wisata.
- **Admin**: Pengguna dengan role `admin` yang mengelola platform.
- **Wallet**: Saldo digital milik Tourist atau Vendor di dalam platform Lampira.
- **Escrow**: Mekanisme penahanan dana pembayaran di platform sebelum dilepas ke Vendor.
- **Topup**: Proses penambahan saldo Wallet oleh Tourist menggunakan metode pembayaran eksternal.
- **Withdraw**: Proses penarikan saldo Wallet oleh Vendor ke rekening bank eksternal.
- **Komisi**: Potongan persentase dari nilai booking yang menjadi pendapatan platform, dipotong saat dana dilepas ke Vendor.
- **Midtrans**: Payment gateway Indonesia yang mendukung QRIS dan Virtual Account Bank.
- **PayPal**: Payment gateway internasional menggunakan Orders API (create order → capture payment).
- **Webhook**: Notifikasi HTTP callback dari Midtrans atau PayPal ke server Lampira untuk konfirmasi status pembayaran secara otomatis.
- **Booking_System**: Komponen yang mengelola siklus hidup pemesanan.
- **Payment_Service**: Komponen yang mengelola transaksi pembayaran, topup, dan withdraw.
- **Wallet_Service**: Komponen yang mengelola saldo dan mutasi Wallet.
- **Notification_Service**: Komponen yang membuat dan mengirimkan notifikasi in-app.
- **Escrow_Service**: Komponen yang mengelola penahanan dan pelepasan dana.
- **Midtrans_Gateway**: Komponen integrasi dengan Midtrans API.
- **PayPal_Gateway**: Komponen integrasi dengan PayPal Orders API.
- **Webhook_Handler**: Komponen yang menerima dan memproses callback dari payment gateway.
- **Virtual Account**: Nomor rekening virtual sementara yang dibuat oleh bank untuk satu transaksi spesifik.
- **Pending_Payment**: Status booking setelah tourist memilih metode bayar dan memulai pembayaran, tetapi konfirmasi belum diterima.
- **Paid**: Status booking setelah pembayaran dikonfirmasi oleh payment gateway atau saldo wallet berhasil dipotong.
- **Confirmed**: Status booking setelah vendor menerima dan mengkonfirmasi booking yang sudah `paid`.
- **Completed**: Status booking setelah servis selesai dilaksanakan dan ditandai oleh tourist atau vendor.
- **Cancelled**: Status booking setelah dibatalkan oleh tourist atau ditolak oleh vendor.
- **Refund**: Pengembalian dana ke Wallet Tourist akibat pembatalan atau penolakan booking.

---

## Requirements

### Requirement 1: Wallet Tourist

**User Story:** Sebagai tourist, saya ingin memiliki dompet digital (wallet) di Lampira, sehingga saya dapat menyimpan saldo dan menggunakannya untuk membayar booking dengan cepat tanpa perlu memasukkan data pembayaran setiap saat.

#### Acceptance Criteria

1. THE Wallet_Service SHALL membuat satu Wallet dengan saldo awal 0 secara otomatis untuk setiap akun Tourist baru yang berhasil terdaftar.
2. WHEN Tourist mengakses halaman wallet, THE Wallet_Service SHALL menampilkan saldo Wallet saat ini dalam satuan Rupiah (IDR).
3. WHEN Tourist mengakses halaman wallet, THE Wallet_Service SHALL menampilkan riwayat mutasi Wallet yang mencakup tanggal, jenis transaksi (topup, pembayaran, refund), jumlah, dan saldo akhir setelah transaksi.
4. THE Wallet_Service SHALL memastikan saldo Wallet Tourist tidak pernah bernilai negatif.

---

### Requirement 2: Topup Wallet Tourist via Midtrans

**User Story:** Sebagai tourist, saya ingin mengisi saldo wallet saya melalui QRIS atau transfer bank (Virtual Account), sehingga saya dapat menggunakan saldo tersebut untuk membayar booking.

#### Acceptance Criteria

1. WHEN Tourist memilih topup via Midtrans dan memasukkan jumlah topup, THE Midtrans_Gateway SHALL membuat transaksi Midtrans dan mengembalikan URL atau kode pembayaran kepada Tourist.
2. THE Midtrans_Gateway SHALL mendukung metode pembayaran QRIS, Virtual Account BCA, Virtual Account BNI, Virtual Account BRI, Virtual Account Mandiri, dan Virtual Account Permata untuk topup.
3. WHEN Midtrans mengirimkan webhook konfirmasi pembayaran berhasil, THE Webhook_Handler SHALL memverifikasi keaslian webhook menggunakan signature key Midtrans.
4. WHEN webhook Midtrans terverifikasi dan status pembayaran adalah berhasil, THE Wallet_Service SHALL menambah saldo Wallet Tourist sebesar jumlah topup yang dikonfirmasi.
5. WHEN saldo Wallet Tourist berhasil ditambah, THE Notification_Service SHALL membuat notifikasi "Topup berhasil sebesar [jumlah]" untuk Tourist yang bersangkutan.
6. IF Midtrans mengirimkan webhook dengan status pembayaran gagal atau kedaluwarsa, THEN THE Payment_Service SHALL menandai transaksi topup tersebut sebagai gagal dan THE Wallet_Service SHALL memastikan saldo Wallet Tourist tidak berubah akibat transaksi yang gagal tersebut, meskipun saldo Wallet Tourist telah berubah akibat transaksi lain selama proses berlangsung.
7. IF Tourist tidak menyelesaikan pembayaran dalam 24 jam setelah transaksi topup dibuat, THEN THE Payment_Service SHALL menandai transaksi topup tersebut sebagai kedaluwarsa.

---

### Requirement 3: Topup Wallet Tourist via PayPal

**User Story:** Sebagai tourist internasional, saya ingin mengisi saldo wallet saya melalui PayPal, sehingga saya dapat bertransaksi di Lampira menggunakan mata uang dan metode pembayaran yang saya miliki.

#### Acceptance Criteria

1. WHEN Tourist memilih topup via PayPal dan memasukkan jumlah topup dalam IDR, THE PayPal_Gateway SHALL membuat PayPal Order menggunakan PayPal Orders API dan mengembalikan URL persetujuan PayPal kepada Tourist.
2. WHEN Tourist menyetujui pembayaran di halaman PayPal dan kembali ke Lampira, THE PayPal_Gateway SHALL melakukan capture terhadap PayPal Order yang telah disetujui.
3. WHEN PayPal Order berhasil di-capture, THE Wallet_Service SHALL menambah saldo Wallet Tourist sebesar jumlah topup yang dikonfirmasi dalam IDR.
4. WHEN saldo Wallet Tourist berhasil ditambah melalui PayPal, THE Notification_Service SHALL membuat notifikasi "Topup berhasil sebesar [jumlah]" untuk Tourist yang bersangkutan.
5. IF PayPal Order gagal di-capture atau Tourist membatalkan persetujuan, THEN THE Payment_Service SHALL menandai transaksi topup tersebut sebagai gagal dan THE Wallet_Service SHALL memastikan saldo Wallet Tourist tidak berubah akibat transaksi yang gagal tersebut.

---

### Requirement 4: Alur Pembayaran Booking — Inisiasi

**User Story:** Sebagai tourist, saya ingin memilih metode pembayaran saat memesan layanan wisata, sehingga saya dapat menyelesaikan booking dengan cara yang paling nyaman bagi saya.

#### Acceptance Criteria

1. WHEN Tourist mengklik "Pesan" pada sebuah listing, THE Booking_System SHALL menampilkan pilihan metode pembayaran: (1) Saldo Wallet, (2) Midtrans (QRIS / Virtual Account), (3) PayPal.
2. WHEN Tourist memilih "Saldo Wallet" dan saldo Wallet Tourist kurang dari total harga booking, THE Booking_System SHALL menolak inisiasi pembayaran dan menampilkan pesan bahwa saldo tidak mencukupi beserta selisih kekurangan saldo.
3. WHEN Tourist memilih "Saldo Wallet" dan saldo Wallet Tourist mencukupi, THE Wallet_Service SHALL memotong saldo Wallet Tourist sebesar total harga booking dan THE Booking_System SHALL mengubah status booking menjadi `paid`.
4. WHEN Tourist memilih "Midtrans" atau "PayPal", THE Booking_System SHALL mengubah status booking menjadi `pending_payment` dan menginisiasi transaksi melalui gateway yang dipilih.
5. WHEN Tourist memilih metode pembayaran, THE Booking_System SHALL menyimpan metode pembayaran yang dipilih pada data booking.

---

### Requirement 5: Alur Pembayaran Booking — Konfirmasi & Escrow

**User Story:** Sebagai platform Lampira, saya ingin menahan dana pembayaran booking dalam escrow hingga servis selesai, sehingga tourist terlindungi dari penipuan dan vendor terjamin menerima pembayaran setelah memberikan layanan.

#### Acceptance Criteria

1. WHEN pembayaran booking via Midtrans dikonfirmasi oleh webhook Midtrans, THE Escrow_Service SHALL menahan dana sebesar total harga booking dan THE Booking_System SHALL mengubah status booking dari `pending_payment` menjadi `paid`.
2. WHEN pembayaran booking via PayPal dikonfirmasi setelah PayPal Order berhasil di-capture, THE Escrow_Service SHALL menahan dana sebesar total harga booking dan THE Booking_System SHALL mengubah status booking dari `pending_payment` menjadi `paid`.
3. WHEN status booking berubah menjadi `paid`, THE Notification_Service SHALL membuat notifikasi "Ada booking baru dari [nama tourist] untuk [nama listing]" untuk Vendor pemilik listing yang bersangkutan.
4. THE Escrow_Service SHALL memastikan dana dalam escrow tidak dapat diakses oleh Vendor sebelum status booking menjadi `completed`.
5. IF pembayaran booking tidak dikonfirmasi dalam 24 jam setelah status `pending_payment`, THEN THE Booking_System SHALL mengubah status booking menjadi `cancelled` dan THE Payment_Service SHALL memulai proses refund ke Wallet Tourist.

---

### Requirement 6: Konfirmasi & Penolakan Booking oleh Vendor

**User Story:** Sebagai vendor, saya ingin dapat menerima atau menolak booking yang masuk, sehingga saya dapat mengelola ketersediaan layanan saya secara aktif.

#### Acceptance Criteria

1. WHEN Vendor mengkonfirmasi booking yang berstatus `paid`, THE Booking_System SHALL mengubah status booking menjadi `confirmed`.
2. WHEN status booking berubah menjadi `confirmed`, THE Notification_Service SHALL membuat notifikasi "Booking Anda untuk [nama listing] telah dikonfirmasi oleh vendor" untuk Tourist yang bersangkutan.
3. WHEN Vendor menolak booking yang berstatus `paid`, THE Booking_System SHALL mengubah status booking menjadi `cancelled`.
4. WHEN status booking berubah menjadi `cancelled` akibat penolakan Vendor, THE Escrow_Service SHALL melepaskan dana dari escrow dan THE Wallet_Service SHALL menambah saldo Wallet Tourist sebesar total harga booking yang telah dibayar.
5. WHEN refund berhasil dikreditkan ke Wallet Tourist, THE Notification_Service SHALL membuat notifikasi "Booking Anda untuk [nama listing] ditolak oleh vendor. Dana sebesar [jumlah] telah dikembalikan ke wallet Anda" untuk Tourist yang bersangkutan.

---

### Requirement 7: Penyelesaian Booking & Pelepasan Dana ke Vendor

**User Story:** Sebagai platform Lampira, saya ingin melepas dana ke wallet vendor setelah servis selesai dilaksanakan dan dipotong komisi, sehingga vendor mendapatkan pendapatan bersih dari setiap booking yang berhasil.

#### Acceptance Criteria

1. WHEN Tourist atau Vendor menandai booking yang berstatus `confirmed` sebagai selesai, THE Booking_System SHALL mengubah status booking menjadi `completed`.
2. WHEN status booking berubah menjadi `completed`, THE Escrow_Service SHALL menghitung komisi platform berdasarkan kategori listing sesuai tabel tarif komisi yang berlaku.
3. THE Escrow_Service SHALL menggunakan tarif komisi berikut saat pelepasan dana: transportation 12%, accommodation 10%, restaurant 5%, tour 15%, event 10%, guide 10%, souvenir 5%.
4. WHEN komisi dihitung, THE Wallet_Service SHALL menambah saldo Wallet Vendor sebesar (total harga booking dikurangi jumlah komisi platform).
5. WHEN saldo Vendor berhasil ditambah, THE Wallet_Service SHALL mencatat mutasi dengan rincian: jumlah bruto, jumlah komisi yang dipotong, jumlah neto yang diterima, dan referensi nomor booking.

---

### Requirement 8: Wallet Vendor

**User Story:** Sebagai vendor, saya ingin memiliki dompet digital di Lampira yang menampung pendapatan saya, sehingga saya dapat memantau penghasilan dan melakukan penarikan dana ke rekening bank saya.

#### Acceptance Criteria

1. THE Wallet_Service SHALL membuat satu Wallet dengan saldo awal 0 secara otomatis untuk setiap akun Vendor baru yang berhasil terdaftar.
2. WHEN Vendor mengakses halaman wallet, THE Wallet_Service SHALL menampilkan saldo Wallet saat ini dalam satuan Rupiah (IDR).
3. WHEN Vendor mengakses halaman wallet, THE Wallet_Service SHALL menampilkan riwayat mutasi Wallet yang mencakup tanggal, jenis transaksi (earning, withdraw), jumlah bruto, komisi yang dipotong, jumlah neto, dan saldo akhir setelah transaksi.
4. THE Wallet_Service SHALL memastikan saldo Wallet Vendor tidak pernah bernilai negatif.

---

### Requirement 9: Withdraw Saldo Vendor

**User Story:** Sebagai vendor, saya ingin mengajukan penarikan saldo wallet saya ke rekening bank saya, sehingga saya dapat menggunakan pendapatan dari Lampira di luar platform.

#### Acceptance Criteria

1. WHEN Vendor mengajukan permintaan withdraw dengan memasukkan jumlah, nama bank, nomor rekening, dan nama pemilik rekening, THE Payment_Service SHALL membuat permintaan withdraw dengan status `pending_withdrawal`.
2. IF jumlah withdraw yang diajukan melebihi saldo Wallet Vendor saat ini, THEN THE Payment_Service SHALL menolak permintaan withdraw dan menampilkan pesan bahwa saldo tidak mencukupi.
3. WHEN permintaan withdraw dibuat dengan status `pending_withdrawal`, THE Wallet_Service SHALL memblokir saldo sebesar jumlah withdraw sehingga tidak dapat digunakan untuk transaksi lain selama proses berlangsung.
4. WHEN Admin memproses dan mengkonfirmasi permintaan withdraw, THE Payment_Service SHALL mengubah status withdraw menjadi `completed` dan THE Wallet_Service SHALL mengurangi saldo Wallet Vendor sebesar jumlah withdraw.
5. IF Admin menolak permintaan withdraw, THEN THE Payment_Service SHALL mengubah status withdraw menjadi `rejected` dan THE Wallet_Service SHALL melepaskan blokir saldo Vendor.

---

### Requirement 10: Pembatalan Booking oleh Tourist

**User Story:** Sebagai tourist, saya ingin dapat membatalkan booking yang telah saya buat, sehingga saya mendapatkan kepastian mengenai dana yang telah saya bayarkan.

#### Acceptance Criteria

1. WHEN Tourist membatalkan booking yang berstatus `paid` atau `confirmed`, THE Booking_System SHALL mengubah status booking menjadi `cancelled`.
2. WHEN booking dibatalkan oleh Tourist dan status booking sebelumnya adalah `paid` atau `confirmed`, THE Escrow_Service SHALL melepaskan dana dari escrow dan THE Wallet_Service SHALL menambah saldo Wallet Tourist sebesar total harga booking yang telah dibayar.
3. WHEN refund berhasil dikreditkan ke Wallet Tourist akibat pembatalan oleh Tourist, THE Notification_Service SHALL membuat notifikasi "Booking Anda untuk [nama listing] telah dibatalkan. Dana sebesar [jumlah] telah dikembalikan ke wallet Anda" untuk Tourist yang bersangkutan.
4. WHEN Tourist mengajukan pembatalan booking yang berstatus `paid` atau `confirmed`, THE Notification_Service SHALL segera membuat notifikasi "Booking dari [nama tourist] untuk [nama listing] telah dibatalkan" untuk Vendor yang bersangkutan, tanpa menunggu proses refund selesai.

---

### Requirement 11: Notifikasi In-App

**User Story:** Sebagai pengguna Lampira (tourist maupun vendor), saya ingin menerima notifikasi di dalam aplikasi untuk setiap kejadian penting terkait booking dan pembayaran saya, sehingga saya selalu mendapat informasi terkini tanpa harus memeriksa email.

#### Acceptance Criteria

1. THE Notification_Service SHALL membuat notifikasi in-app untuk Tourist pada kejadian berikut: booking dikonfirmasi oleh vendor, booking ditolak oleh vendor, topup berhasil, refund berhasil diterima di wallet — dan THE Notification_Service SHALL memvalidasi bahwa event pemicu benar-benar terjadi sebelum notifikasi dibuat.
2. THE Notification_Service SHALL membuat notifikasi in-app untuk Vendor pada kejadian berikut: booking baru masuk (status `paid`), booking dibatalkan oleh tourist — dan THE Notification_Service SHALL memvalidasi bahwa event pemicu benar-benar terjadi sebelum notifikasi dibuat.
3. IF THE Notification_Service gagal membuat notifikasi akibat gangguan teknis, THEN THE Notification_Service SHALL melakukan mekanisme retry otomatis dan mencatat kegagalan tersebut untuk memastikan notifikasi terkait event booking kritis pada akhirnya tersampaikan kepada pengguna.
4. THE Notification_Service SHALL menyimpan setiap notifikasi dengan atribut: ID pengguna penerima, tipe notifikasi, pesan teks, status baca (dibaca/belum dibaca), dan waktu pembuatan.
5. WHEN pengguna mengakses daftar notifikasi, THE Notification_Service SHALL mengembalikan daftar notifikasi milik pengguna tersebut diurutkan dari yang paling baru.
6. WHEN pengguna menandai notifikasi sebagai dibaca, THE Notification_Service SHALL memperbarui status notifikasi tersebut menjadi dibaca.
7. THE Notification_Service SHALL menyediakan jumlah notifikasi yang belum dibaca (badge counter) untuk ditampilkan di navbar dan dashboard pengguna.
8. WHEN pengguna menandai semua notifikasi sebagai dibaca, THE Notification_Service SHALL memperbarui status semua notifikasi milik pengguna tersebut menjadi dibaca dan badge counter SHALL menampilkan nilai 0.

---

### Requirement 12: Webhook Handler

**User Story:** Sebagai platform Lampira, saya ingin memproses konfirmasi pembayaran dari Midtrans dan PayPal secara otomatis melalui webhook, sehingga status booking dan wallet diperbarui tanpa memerlukan intervensi manual.

#### Acceptance Criteria

1. WHEN Midtrans mengirimkan webhook ke endpoint Lampira, THE Webhook_Handler SHALL memverifikasi keaslian request dengan membandingkan signature dari header webhook menggunakan Midtrans server key.
2. IF signature webhook Midtrans tidak valid, THEN THE Webhook_Handler SHALL menolak request dengan HTTP status 400, mencatat kejadian keamanan tersebut dalam log sistem, dan tidak memproses perubahan data apapun.
3. WHEN PayPal mengirimkan webhook ke endpoint Lampira, THE Webhook_Handler SHALL memverifikasi keaslian webhook menggunakan PayPal Webhook verification API.
4. IF signature webhook PayPal tidak valid, THEN THE Webhook_Handler SHALL menolak request dengan HTTP status 400, mencatat kejadian keamanan tersebut dalam log sistem, dan tidak memproses perubahan data apapun.
5. THE Webhook_Handler SHALL memproses setiap webhook secara idempoten sehingga pemrosesan webhook yang sama lebih dari satu kali tidak menghasilkan perubahan duplikat pada saldo atau status booking.
6. WHEN Webhook_Handler berhasil memproses sebuah webhook, THE Webhook_Handler SHALL mengembalikan HTTP status 200 kepada payment gateway pengirim.

---

### Requirement 13: Keamanan Transaksi

**User Story:** Sebagai platform Lampira, saya ingin memastikan semua operasi keuangan aman dan konsisten, sehingga tidak ada dana yang hilang, terduplikasi, atau dimanipulasi.

#### Acceptance Criteria

1. THE Payment_Service SHALL memastikan setiap mutasi saldo Wallet (penambahan dan pengurangan) dieksekusi dalam satu transaksi database yang bersifat atomik.
2. THE Wallet_Service SHALL memastikan operasi baca dan tulis saldo menggunakan mekanisme penguncian (locking) atau optimistic concurrency untuk mencegah kondisi balapan (race condition) saat dua proses memperbarui saldo secara bersamaan.
3. THE Payment_Service SHALL mencatat setiap transaksi keuangan dengan status akhir (berhasil atau gagal), referensi ID dari payment gateway, dan waktu pemrosesan untuk keperluan audit.
4. WHEN Admin mengakses laporan transaksi, THE Payment_Service SHALL menampilkan seluruh riwayat transaksi beserta detail audit trail.
