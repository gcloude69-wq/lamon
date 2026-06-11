# Implementation Plan: Payment, Wallet & Booking (payment-wallet-booking)

## Overview

Implementasi sistem pembayaran lengkap untuk Lampira — mencakup wallet digital, topup via Midtrans & PayPal, alur escrow, penarikan saldo vendor, notifikasi in-app, dan webhook handler. Semua kode ditulis dalam TypeScript menggunakan Drizzle ORM (PostgreSQL) dalam monorepo pnpm.

## Tasks

- [x] 1. Persiapan skema database dan migrasi
  - [x] 1.1 Update skema `bookingsTable` di `lib/db/src/schema/bookings.ts`
    - Tambahkan kolom `paymentMethod` (text, nullable)
    - Ubah tipe kolom `status` menggunakan `pgEnum` baru `bookingStatusEnum` dengan nilai: `pending`, `pending_payment`, `paid`, `confirmed`, `completed`, `cancelled`
    - Perbarui type `Booking` dan `insertBookingSchema` untuk merefleksikan perubahan
    - _Requirement: 4.4, 4.5_

  - [x] 1.2 Buat skema `walletsTable` di `lib/db/src/schema/wallets.ts`
    - Definisikan tabel dengan kolom: `id`, `userId` (unique FK), `balance`, `lockedBalance`, `version`, `currency`, `createdAt`, `updatedAt`
    - Export type `Wallet` dan `insertWalletSchema`
    - _Requirement: 1.1, 8.1_

  - [x] 1.3 Buat skema `walletTransactionsTable` di `lib/db/src/schema/wallet_transactions.ts`
    - Definisikan `walletTransactionTypeEnum`: `topup`, `payment`, `refund`, `earning`, `withdraw`
    - Definisikan tabel dengan semua kolom termasuk `grossAmount`, `commissionAmount`, `netAmount`, `bookingId`, `paymentTransactionId`
    - Export type `WalletTransaction` dan `insertWalletTransactionSchema`
    - _Requirement: 1.3, 7.5, 8.3_

  - [x] 1.4 Buat skema `paymentTransactionsTable` di `lib/db/src/schema/payment_transactions.ts`
    - Definisikan `paymentStatusEnum`: `pending`, `success`, `failed`, `expired`, `refunded`
    - Definisikan tabel dengan semua kolom termasuk `gatewayOrderId`, `gatewayPaymentId`, `gatewayResponse`, `expiredAt`, `processedAt`
    - Export type `PaymentTransaction` dan `insertPaymentTransactionSchema`
    - _Requirement: 13.3_

  - [x] 1.5 Buat skema `escrowRecordsTable` di `lib/db/src/schema/escrow_records.ts`
    - Definisikan `escrowStatusEnum`: `holding`, `released`, `refunded`
    - Definisikan tabel dengan kolom: `id`, `bookingId` (unique FK), `touristId`, `vendorId`, `amount`, `commissionAmount`, `netAmount`, `status`, `heldAt`, `releasedAt`, `createdAt`, `updatedAt`
    - Export type `EscrowRecord` dan `insertEscrowRecordSchema`
    - _Requirement: 5.1, 5.4_

  - [x] 1.6 Buat skema `withdrawRequestsTable` di `lib/db/src/schema/withdraw_requests.ts`
    - Definisikan `withdrawStatusEnum`: `pending_withdrawal`, `completed`, `rejected`
    - Definisikan tabel dengan kolom: `id`, `vendorId`, `amount`, `bankName`, `bankAccountNumber`, `bankAccountName`, `status`, `adminNote`, `processedBy`, `processedAt`, `createdAt`, `updatedAt`
    - Export type `WithdrawRequest` dan `insertWithdrawRequestSchema`
    - _Requirement: 9.1_

  - [x] 1.7 Buat skema `notificationsTable` di `lib/db/src/schema/notifications.ts`
    - Definisikan `notificationTypeEnum` dengan semua 8 tipe notifikasi
    - Definisikan tabel dengan kolom: `id`, `userId`, `type`, `message`, `isRead` (integer default 0), `meta` (text/JSON), `createdAt`, `updatedAt`
    - Export type `Notification` dan `insertNotificationSchema`
    - _Requirement: 11.4_

  - [x] 1.8 Buat skema `webhookEventsTable` di `lib/db/src/schema/webhook_events.ts`
    - Definisikan `webhookEventStatusEnum`: `received`, `processed`, `failed`, `duplicate`
    - Definisikan tabel dengan kolom: `id`, `gateway`, `eventId` (unique), `eventType`, `orderId`, `rawPayload`, `status`, `errorMessage`, `processedAt`, `createdAt`
    - Export type `WebhookEvent` dan `insertWebhookEventSchema`
    - _Requirement: 12.5_

  - [x] 1.9 Export semua skema baru dari barrel `lib/db/src/schema/index.ts`
    - Tambahkan export untuk: `wallets`, `wallet_transactions`, `payment_transactions`, `escrow_records`, `withdraw_requests`, `notifications`, `webhook_events`
    - _Requirement: 1.1, 8.1_

  - [x] 1.10 Tulis unit test untuk validasi skema Drizzle
    - Uji bahwa `insertWalletSchema` menolak input tidak valid (balance negatif, userId null)
    - Uji bahwa `bookingStatusEnum` memiliki semua 6 nilai yang benar
    - _Requirement: 1.1, 4.4_

- [ ] 2. WalletService — operasi saldo dasar
  - [-] 2.1 Implementasi `createWallet` dan `getWalletByUserId` di `lib/services/wallet/wallet.service.ts`
    - Buat interface `WalletService` sesuai desain
    - Implementasi `createWallet(userId)`: insert ke `walletsTable` dengan saldo 0, versi 0
    - Implementasi `getWalletByUserId(userId)`: query dengan Drizzle, throw 404 jika tidak ditemukan
    - _Requirement: 1.1, 1.2, 8.1, 8.2_

  - [~] 2.2 Implementasi `creditBalance` dengan optimistic locking di `wallet.service.ts`
    - Loop retry maksimal 3 kali dengan backoff
    - UPDATE wallet dengan `WHERE version = :currentVersion`, increment version
    - Insert `walletTransactionsTable` setelah UPDATE berhasil
    - Throw `Error("Wallet update failed after 3 attempts")` setelah habis retry
    - _Requirement: 1.4, 13.1, 13.2_

  - [~] 2.3 Tulis property test untuk `creditBalance` (Property 4)
    - **Property 4: Topup berhasil menambah saldo tepat sebesar jumlah yang dikonfirmasi**
    - **Validates: Requirements 2.4, 3.3**
    - Gunakan `fast-check` untuk generate jumlah topup acak (1 – 10.000.000)
    - Assert `balanceAfter = balanceBefore + amount` setelah setiap credit
    - _File: `lib/services/wallet/wallet.service.test.ts`_

  - [~] 2.4 Implementasi `debitBalance` dengan optimistic locking di `wallet.service.ts`
    - Cek `balance >= amount`, throw `InsufficientBalanceError` dengan `deficit` jika tidak cukup
    - UPDATE wallet dengan `WHERE version = :currentVersion` dan `balance = balance - amount`
    - Insert `walletTransactionsTable` setelah UPDATE berhasil
    - _Requirement: 1.4, 4.2, 4.3, 13.1, 13.2_

  - [~] 2.5 Tulis property test untuk `debitBalance` (Property 2 & 9)
    - **Property 2: Saldo wallet tidak pernah negatif**
    - **Validates: Requirements 1.4, 8.4**
    - **Property 9: Pembayaran booking ditolak jika saldo tidak mencukupi**
    - **Validates: Requirements 4.2**
    - Generate urutan operasi credit/debit acak, assert `balance >= 0` setelah setiap operasi
    - Assert debit ditolak ketika `balance < amount` dan saldo tidak berubah
    - _File: `lib/services/wallet/wallet.service.test.ts`_

  - [~] 2.6 Implementasi `lockBalance`, `unlockBalance`, `deductLockedBalance` di `wallet.service.ts`
    - `lockBalance`: UPDATE `lockedBalance += amount`, `balance -= amount` secara atomik
    - `unlockBalance`: UPDATE `lockedBalance -= amount`, `balance += amount` secara atomik
    - `deductLockedBalance`: UPDATE `lockedBalance -= amount` saat withdraw dikonfirmasi
    - Semua operasi menggunakan optimistic locking yang sama
    - _Requirement: 9.3, 9.4, 9.5_

  - [~] 2.7 Tulis property test untuk `lockBalance` dan `unlockBalance` (Property 16 & 17)
    - **Property 16: Saldo terkunci sama dengan jumlah withdraw aktif**
    - **Validates: Requirements 9.3**
    - **Property 17: Withdraw yang dikonfirmasi mengurangi saldo tepat**
    - **Validates: Requirements 9.4**
    - Assert `lockedBalance` bertambah tepat W setelah `lockBalance(W)`
    - Assert `lockedBalance` kembali normal dan saldo berkurang setelah `deductLockedBalance(W)`
    - _File: `lib/services/wallet/wallet.service.test.ts`_

  - [~] 2.8 Implementasi `getTransactionHistory` dengan pagination di `wallet.service.ts`
    - Query `walletTransactionsTable` dengan `WHERE walletId = :id` ORDER BY `createdAt DESC`
    - Implementasi pagination dengan `limit` dan `offset`
    - Return `{ data, total }`
    - _Requirement: 1.3, 8.3_

  - [~] 2.9 Tulis property test untuk konsistensi riwayat mutasi (Property 3)
    - **Property 3: Riwayat mutasi mencatat semua transaksi**
    - **Validates: Requirements 1.3, 7.5, 8.3**
    - Generate N transaksi acak, assert ada tepat N entri di `wallet_transactions`
    - Assert `balanceBefore + amount = balanceAfter` untuk setiap entri kredit
    - Assert `balanceBefore - abs(amount) = balanceAfter` untuk setiap entri debit
    - _File: `lib/services/wallet/wallet.service.test.ts`_

- [~] 3. Checkpoint — Verifikasi WalletService
  - Pastikan semua unit test dan property test WalletService lulus.
  - Pastikan skema wallet dapat di-generate migrasi Drizzle tanpa error.
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum melanjutkan.

- [ ] 4. NotificationService
  - [-] 4.1 Implementasi `NotificationService` di `lib/services/notification/notification.service.ts`
    - Buat interface `NotificationService` sesuai desain
    - Implementasi `createNotification(userId, type, message, meta)`: insert ke `notificationsTable`
    - Implementasi `getNotifications(userId, page, limit)`: query ORDER BY `createdAt DESC`, return `{ data, total, unreadCount }`
    - Implementasi `markAsRead(notificationId, userId)`: UPDATE `isRead = 1` dengan validasi ownership
    - Implementasi `markAllAsRead(userId)`: UPDATE semua `isRead = 1` WHERE `userId = :userId`
    - Implementasi `getUnreadCount(userId)`: COUNT WHERE `isRead = 0 AND userId = :userId`
    - _Requirement: 11.1 – 11.8_

  - [~] 4.2 Tulis property test untuk NotificationService (Property 18, 19, 20)
    - **Property 18: Notifikasi memiliki semua atribut wajib**
    - **Validates: Requirements 11.4**
    - **Property 19: Daftar notifikasi diurutkan dari yang terbaru**
    - **Validates: Requirements 11.5**
    - **Property 20: Badge counter sama dengan jumlah notifikasi belum dibaca**
    - **Validates: Requirements 11.7, 11.8**
    - Generate N notifikasi dengan timestamp acak, assert urutan descending
    - Assert badge counter == jumlah notifikasi dengan `isRead = 0`
    - Assert badge counter == 0 setelah `markAllAsRead`
    - _File: `lib/services/notification/notification.service.test.ts`_

  - [~] 4.3 Tulis unit test untuk NotificationService
    - Test `markAsRead` gagal dengan 403 jika notifikasi bukan milik user
    - Test `getNotifications` dengan pagination (page 1 dan page 2)
    - Test `createNotification` mengisi semua field wajib dengan benar
    - _File: `lib/services/notification/notification.service.test.ts`_

- [ ] 5. EscrowService
  - [ ] 5.1 Implementasi `EscrowService` dan konstanta komisi di `lib/services/escrow/escrow.service.ts`
    - Definisikan `COMMISSION_RATES` sesuai tabel di desain
    - Implementasi `calculateCommission(totalPrice, category)`: return `{ commissionAmount, netAmount }` dengan `Math.round`
    - Implementasi `holdFunds(bookingId, amount, source)`: insert `escrowRecordsTable` dengan status `holding`
    - Implementasi `getEscrowByBookingId(bookingId)`: query escrow record
    - _Requirement: 5.1, 7.2, 7.3_

  - [~] 5.2 Tulis property test untuk kalkulasi komisi (Property 12)
    - **Property 12: Tarif komisi tepat per kategori**
    - **Validates: Requirements 7.2, 7.3**
    - Generate pasangan (totalPrice, category) acak
    - Assert `commissionAmount = Math.round(totalPrice * COMMISSION_RATES[category])`
    - Assert `commissionAmount + netAmount = totalPrice`
    - _File: `lib/services/escrow/escrow.service.test.ts`_

  - [~] 5.3 Implementasi `releaseFundsToVendor` secara atomik di `escrow.service.ts`
    - Bungkus dalam satu `db.transaction`: hitung komisi, credit wallet vendor (`earning`), update escrow status ke `released`, update `bookingsTable.commissionAmount`
    - Return `EscrowReleaseResult` dengan detail gross, komisi, net
    - _Requirement: 7.2, 7.3, 7.4, 7.5_

  - [~] 5.4 Tulis property test untuk `releaseFundsToVendor` (Property 13)
    - **Property 13: Vendor menerima dana bersih setelah booking selesai**
    - **Validates: Requirements 7.4**
    - Generate booking dengan totalPrice dan kategori acak
    - Assert saldo vendor bertambah tepat `totalPrice - commissionAmount`
    - Assert status escrow menjadi `released`
    - _File: `lib/services/escrow/escrow.service.test.ts`_

  - [~] 5.5 Implementasi `releaseFundsToTourist` secara atomik di `escrow.service.ts`
    - Bungkus dalam satu `db.transaction`: credit wallet tourist (`refund`), update escrow status ke `refunded`
    - _Requirement: 6.4, 10.2_

  - [~] 5.6 Tulis property test untuk `releaseFundsToTourist` (Property 14)
    - **Property 14: Refund mengembalikan saldo penuh ke tourist**
    - **Validates: Requirements 6.4, 10.2**
    - Generate booking dengan totalPrice acak
    - Assert saldo tourist bertambah tepat `totalPrice` setelah refund
    - Assert status escrow menjadi `refunded`
    - _File: `lib/services/escrow/escrow.service.test.ts`_

- [~] 6. Checkpoint — Verifikasi EscrowService dan NotificationService
  - Pastikan semua unit test dan property test EscrowService lulus.
  - Pastikan semua unit test dan property test NotificationService lulus.
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum melanjutkan.

- [ ] 7. MidtransGateway
  - [~] 7.1 Implementasi `MidtransGateway` di `lib/gateways/midtrans/midtrans.gateway.ts`
    - Buat interface `MidtransGateway` sesuai desain
    - Implementasi `createTopupTransaction(orderId, amount, paymentMethod, customerDetails)`: POST ke Midtrans Snap API `/snap/v1/transactions`, return `MidtransSnapResponse`
    - Implementasi `createBookingTransaction(orderId, amount, paymentMethod, bookingDetails, customerDetails)`: POST ke Snap API dengan item details booking
    - Baca `MIDTRANS_SERVER_KEY` dan `MIDTRANS_BASE_URL` dari environment variable
    - _Requirement: 2.1, 2.2_

  - [~] 7.2 Implementasi `verifyWebhookSignature` dan `getTransactionStatus` di `midtrans.gateway.ts`
    - `verifyWebhookSignature`: implementasi SHA512(`orderId + statusCode + grossAmount + serverKey`) menggunakan `node:crypto`, gunakan `timingSafeEqual`
    - `getTransactionStatus`: GET ke Midtrans Core API `/v2/{orderId}/status`
    - _Requirement: 2.3, 12.1, 12.2_

  - [~] 7.3 Tulis integration test untuk MidtransGateway (mocked HTTP)
    - Mock `fetch` / HTTP client menggunakan test double
    - Test `createTopupTransaction` mengirim payload yang benar ke Midtrans
    - Test `verifyWebhookSignature` mengembalikan `true` untuk signature valid dan `false` untuk tidak valid
    - _File: `lib/gateways/midtrans/midtrans.gateway.test.ts`_

- [ ] 8. PayPalGateway
  - [~] 8.1 Implementasi `PayPalGateway` di `lib/gateways/paypal/paypal.gateway.ts`
    - Buat interface `PayPalGateway` sesuai desain
    - Implementasi `getAccessToken()`: POST ke PayPal OAuth endpoint dengan client_credentials, cache token sampai expired
    - Implementasi `createOrder(amountUSD, amountIDR, referenceId, returnUrl, cancelUrl)`: POST ke `/v2/checkout/orders`
    - Implementasi `captureOrder(orderId)`: POST ke `/v2/checkout/orders/{id}/capture`
    - Baca `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL` dari environment variable
    - _Requirement: 3.1, 3.2_

  - [~] 8.2 Implementasi `verifyWebhook` di `paypal.gateway.ts`
    - POST ke PayPal Webhook Verification API `/v1/notifications/verify-webhook-signature`
    - Kirim semua header PayPal (`paypal-transmission-id`, `paypal-transmission-time`, dll) beserta `webhook_id`
    - Return `true` jika `verification_status === "SUCCESS"`
    - _Requirement: 12.3, 12.4_

  - [~] 8.3 Tulis integration test untuk PayPalGateway (mocked HTTP)
    - Mock HTTP calls ke PayPal API
    - Test `createOrder` mengembalikan `approval_url` yang benar
    - Test `captureOrder` berhasil dan gagal
    - Test `verifyWebhook` mengembalikan `false` untuk payload tidak valid
    - _File: `lib/gateways/paypal/paypal.gateway.test.ts`_

- [ ] 9. PaymentService — Topup
  - [~] 9.1 Implementasi `initiateMidtransTopup` di `lib/services/payment/payment.service.ts`
    - Buat interface `PaymentService` sesuai desain
    - Insert `paymentTransactionsTable` dengan status `pending`, `type = "topup"`, `gateway = "midtrans"`, `expiredAt = now + 24 jam`
    - Panggil `midtransGateway.createTopupTransaction` dan simpan `gatewayOrderId`
    - Return `{ transactionId, paymentUrl, orderId, expiresAt }`
    - _Requirement: 2.1_

  - [~] 9.2 Implementasi `initiatePayPalTopup` dan `capturePayPalTopup` di `payment.service.ts`
    - `initiatePayPalTopup`: Insert `paymentTransactionsTable` status `pending`, panggil `paypalGateway.createOrder`, return `{ approvalUrl, paypalOrderId }`
    - `capturePayPalTopup`: Panggil `paypalGateway.captureOrder`, update `paymentTransactionsTable` status `success`, panggil `walletService.creditBalance`, panggil `notificationService.createNotification(userId, "topup_success", ...)`
    - _Requirement: 3.1, 3.2, 3.3, 3.4_

  - [~] 9.3 Implementasi `expireStaleTransactions` di `payment.service.ts`
    - UPDATE `paymentTransactionsTable` SET `status = "expired"` WHERE `status = "pending" AND expiredAt < NOW()`
    - Untuk booking payment yang expired: update booking status ke `cancelled`
    - _Requirement: 2.7, 5.5_

  - [~] 9.4 Tulis unit test untuk PaymentService — Topup
    - Test `initiateMidtransTopup` membuat `paymentTransaction` dengan status `pending`
    - Test `capturePayPalTopup` memanggil `creditBalance` dengan jumlah yang benar
    - Test `expireStaleTransactions` mengubah status transaksi lama menjadi `expired`
    - _File: `lib/services/payment/payment.service.test.ts`_

- [ ] 10. PaymentService — Pembayaran Booking & Withdraw
  - [~] 10.1 Implementasi `payBookingWithWallet` di `payment.service.ts`
    - Validasi booking milik user dan status `pending`
    - Panggil `walletService.debitBalance`; jika `InsufficientBalanceError`, throw dengan `deficit`
    - Update booking status ke `paid`, simpan `paymentMethod = "wallet"`
    - Panggil `escrowService.holdFunds(bookingId, totalPrice, "wallet")`
    - Panggil `notificationService.createNotification(vendorId, "new_booking", ...)`
    - Semua dalam satu `db.transaction`
    - _Requirement: 4.2, 4.3, 4.5, 5.1, 5.3_

  - [~] 10.2 Implementasi `initiateBookingPaymentMidtrans` dan `initiateBookingPaymentPayPal` di `payment.service.ts`
    - Update booking status ke `pending_payment`, simpan `paymentMethod`
    - Insert `paymentTransactionsTable` dengan type `booking_payment`
    - Panggil gateway yang sesuai, return URL pembayaran
    - _Requirement: 4.4, 4.5_

  - [~] 10.3 Implementasi `refundToWallet` di `payment.service.ts`
    - Panggil `escrowService.releaseFundsToTourist(bookingId)`
    - Update `paymentTransactionsTable` status ke `refunded`
    - _Requirement: 6.4, 10.2_

  - [~] 10.4 Implementasi `createWithdrawRequest` dan `processWithdrawRequest` di `payment.service.ts`
    - `createWithdrawRequest`: validasi `amount <= balance - lockedBalance`, panggil `walletService.lockBalance`, insert `withdrawRequestsTable` status `pending_withdrawal`
    - `processWithdrawRequest`: untuk `approve`: panggil `walletService.deductLockedBalance`, update status `completed`, notifikasi vendor; untuk `reject`: panggil `walletService.unlockBalance`, update status `rejected`, notifikasi vendor
    - _Requirement: 9.1 – 9.5_

  - [~] 10.5 Tulis property test untuk withdraw (Property 15)
    - **Property 15: Withdraw ditolak jika jumlah melebihi saldo tersedia**
    - **Validates: Requirements 9.2**
    - Generate pasangan (balance, withdrawAmount) dengan `withdrawAmount > balance`
    - Assert `createWithdrawRequest` melempar error dan saldo tidak berubah
    - _File: `lib/services/payment/payment.service.test.ts`_

  - [~] 10.6 Tulis unit test untuk PaymentService — Booking & Withdraw
    - Test pembayaran wallet berhasil: saldo terpotong, status booking `paid`, escrow `holding`
    - Test pembayaran wallet gagal karena saldo kurang: response 422 dengan deficit
    - Test admin approve withdraw: saldo berkurang, lockedBalance kembali normal
    - Test admin reject withdraw: lockedBalance dilepas, saldo tidak berubah
    - _File: `lib/services/payment/payment.service.test.ts`_

- [ ] 11. WebhookHandler
  - [~] 11.1 Implementasi `handleMidtransWebhook` di `lib/webhooks/webhook.handler.ts`
    - Buat interface `WebhookHandler` sesuai desain
    - Verifikasi signature menggunakan `midtransGateway.verifyWebhookSignature`; throw HTTP 400 jika tidak valid
    - Cek idempotency di `webhookEventsTable` menggunakan `eventId = "midtrans-{transaction_id}"`
    - Insert webhook event dengan status `received`
    - Dalam `db.transaction`: update `paymentTransactionsTable`, update booking status, panggil `escrowService.holdFunds`, panggil `notificationService.createNotification`
    - Update webhook event status ke `processed` atau `failed`
    - _Requirement: 2.3, 2.4, 12.1, 12.2, 12.5, 12.6_

  - [~] 11.2 Implementasi `handlePayPalWebhook` di `webhook.handler.ts`
    - Verifikasi webhook menggunakan `paypalGateway.verifyWebhook`; throw HTTP 400 jika tidak valid
    - Cek idempotency menggunakan `event_id` dari header PayPal sebagai `eventId`
    - Proses event `PAYMENT.CAPTURE.COMPLETED`: update payment transaction, booking, escrow, notifikasi
    - _Requirement: 3.1, 12.3, 12.4, 12.5, 12.6_

  - [~] 11.3 Tulis property test untuk idempotency webhook (Property 11)
    - **Property 11: Webhook idempoten**
    - **Validates: Requirements 12.5**
    - Kirim webhook yang sama dua kali, assert hanya satu perubahan terjadi pada saldo/status
    - Assert tidak ada `walletTransaction` duplikat
    - _File: `lib/webhooks/webhook.handler.test.ts`_

  - [~] 11.4 Tulis property test untuk verifikasi webhook (Property 6)
    - **Property 6: Webhook diverifikasi sebelum diproses**
    - **Validates: Requirements 2.3, 12.1, 12.2, 12.4**
    - Generate payload webhook dengan signature tidak valid (modifikasi satu karakter)
    - Assert handler melempar HTTP 400 dan tidak ada data yang berubah
    - _File: `lib/webhooks/webhook.handler.test.ts`_

  - [~] 11.5 Tulis integration test untuk alur webhook end-to-end
    - Test topup Midtrans: webhook berhasil → saldo bertambah → notifikasi dibuat
    - Test booking payment PayPal: webhook berhasil → escrow holding → notifikasi vendor
    - Test webhook duplikat (kirim dua kali): hanya satu perubahan data
    - _File: `lib/webhooks/webhook.handler.test.ts`_

- [~] 12. Checkpoint — Verifikasi Services dan Gateways
  - Pastikan semua unit test dan integration test untuk PaymentService, MidtransGateway, PayPalGateway, dan WebhookHandler lulus.
  - Pastikan property test untuk Property 1–17 lulus.
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum melanjutkan.

- [ ] 13. Property Test — Wallet Baru dan Audit Trail
  - [~] 13.1 Tulis property test untuk pembuatan wallet saat registrasi (Property 1)
    - **Property 1: Wallet dibuat dengan saldo nol untuk setiap user baru**
    - **Validates: Requirements 1.1, 8.1**
    - Generate data user (tourist dan vendor) secara acak
    - Assert wallet dibuat dengan `balance = 0`, `lockedBalance = 0`, `version = 0`
    - Assert tepat satu wallet per user (unique constraint)
    - _File: `lib/services/wallet/wallet.service.test.ts`_

  - [~] 13.2 Tulis property test untuk audit trail transaksi keuangan (Property 21)
    - **Property 21: Setiap transaksi keuangan memiliki audit trail lengkap**
    - **Validates: Requirements 13.3**
    - Setelah setiap operasi pembayaran berhasil/gagal, assert record di `payment_transactions` memiliki `status`, `gatewayOrderId`, dan `processedAt` yang tidak null
    - _File: `lib/services/payment/payment.service.test.ts`_

- [ ] 14. API Endpoints — Wallet dan Topup
  - [~] 14.1 Implementasi endpoint `GET /wallet` dan `GET /wallet/history` di route handler
    - `GET /wallet`: panggil `walletService.getWalletByUserId(userId)`, return saldo dan info wallet
    - `GET /wallet/history`: panggil `walletService.getTransactionHistory(userId, page, limit)`, support query param `page` dan `limit`
    - Tambahkan middleware autentikasi (user harus login)
    - _Requirement: 1.2, 1.3, 8.2, 8.3_

  - [~] 14.2 Implementasi endpoint `POST /wallet/topup/midtrans` di route handler
    - Validasi body: `amount` (positif, integer), `paymentMethod` (enum Midtrans)
    - Panggil `paymentService.initiateMidtransTopup(userId, amount, paymentMethod)`
    - Return `201` dengan `{ transactionId, paymentUrl, orderId, expiresAt }`
    - _Requirement: 2.1, 2.2_

  - [~] 14.3 Implementasi endpoint `POST /wallet/topup/paypal` dan `POST /wallet/topup/paypal/capture`
    - `POST /wallet/topup/paypal`: validasi `amountIDR`, panggil `paymentService.initiatePayPalTopup`, return `{ approvalUrl, paypalOrderId }`
    - `POST /wallet/topup/paypal/capture`: validasi `paypalOrderId`, panggil `paymentService.capturePayPalTopup`, return `{ success: true }`
    - _Requirement: 3.1, 3.2, 3.3_

- [ ] 15. API Endpoints — Pembayaran Booking dan Withdraw
  - [~] 15.1 Implementasi endpoint `POST /bookings/{id}/pay` di route handler
    - Validasi body: `paymentMethod` (`wallet` | `midtrans` | `paypal`), dan `method` opsional untuk Midtrans
    - Route ke `paymentService.payBookingWithWallet`, `initiateBookingPaymentMidtrans`, atau `initiateBookingPaymentPayPal` sesuai pilihan
    - Return 422 dengan `{ error, currentBalance, requiredAmount, deficit }` jika saldo tidak cukup
    - _Requirement: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [~] 15.2 Implementasi endpoint `GET /bookings/{id}/payment-status` di route handler
    - Query `paymentTransactionsTable` berdasarkan `bookingId`, return status dan detail pembayaran terakhir
    - _Requirement: 13.3_

  - [~] 15.3 Implementasi endpoint `POST /withdraw`, `GET /withdraw`, `GET /withdraw/{id}` (vendor)
    - `POST /withdraw`: validasi body `{ amount, bankName, bankAccountNumber, bankAccountName }`, panggil `paymentService.createWithdrawRequest`
    - `GET /withdraw`: panggil query `withdrawRequestsTable` WHERE `vendorId = userId`
    - `GET /withdraw/{id}`: query satu record, validasi ownership
    - _Requirement: 9.1, 9.2, 9.3_

  - [~] 15.4 Implementasi endpoint `GET /admin/withdraw` dan `PATCH /admin/withdraw/{id}` (admin)
    - `GET /admin/withdraw`: query semua `withdrawRequestsTable` dengan pagination, hanya admin
    - `PATCH /admin/withdraw/{id}`: validasi body `{ action: "approve" | "reject", adminNote? }`, panggil `paymentService.processWithdrawRequest`
    - Tambahkan middleware otorisasi: hanya user dengan role `admin`
    - _Requirement: 9.4, 9.5_

- [ ] 16. API Endpoints — Notifikasi
  - [~] 16.1 Implementasi endpoint `GET /notifications` dan `GET /notifications/unread-count`
    - `GET /notifications`: panggil `notificationService.getNotifications(userId, page, limit)`, return `{ data, total, unreadCount }`
    - `GET /notifications/unread-count`: panggil `notificationService.getUnreadCount(userId)`, return `{ count }`
    - _Requirement: 11.5, 11.7_

  - [~] 16.2 Implementasi endpoint `PATCH /notifications/{id}/read` dan `PATCH /notifications/read-all`
    - `PATCH /notifications/{id}/read`: panggil `notificationService.markAsRead(notificationId, userId)`, return notifikasi yang diperbarui
    - `PATCH /notifications/read-all`: panggil `notificationService.markAllAsRead(userId)`, return `{ success: true }`
    - _Requirement: 11.6, 11.8_

- [ ] 17. API Endpoints — Webhook
  - [~] 17.1 Implementasi endpoint `POST /webhooks/midtrans`
    - Parse raw body sebagai JSON (jangan gunakan body parser yang mengubah encoding)
    - Ekstrak `signature_key` dari payload, panggil `webhookHandler.handleMidtransWebhook`
    - Return HTTP 200 jika berhasil, HTTP 400 jika signature tidak valid
    - _Requirement: 12.1, 12.2, 12.5, 12.6_

  - [~] 17.2 Implementasi endpoint `POST /webhooks/paypal`
    - Simpan raw body sebagai string (untuk verifikasi signature PayPal)
    - Teruskan semua header PayPal ke `webhookHandler.handlePayPalWebhook`
    - Return HTTP 200 jika berhasil, HTTP 400 jika signature tidak valid
    - _Requirement: 12.3, 12.4, 12.5, 12.6_

- [ ] 18. Update OpenAPI Specification
  - [~] 18.1 Tambahkan tags baru dan skema komponen di `lib/api-spec/openapi.yaml`
    - Tambahkan tags: `wallet`, `payments`, `withdraw`, `notifications`, `webhooks`
    - Tambahkan skema: `Wallet`, `WalletTransaction`, `WalletHistory`, `TopupMidtransInput`, `TopupMidtransResponse`, `TopupPayPalInput`, `TopupPayPalResponse`, `PayPalCaptureInput`
    - Tambahkan skema: `BookingPayInput`, `BookingPayResponse`, `PaymentStatus`
    - Tambahkan skema: `WithdrawInput`, `WithdrawRequest`, `WithdrawList`, `AdminWithdrawAction`
    - Tambahkan skema: `Notification`, `NotificationList`, `UnreadCountResponse`
    - Update skema `Booking` dengan field `paymentMethod` dan enum status baru (`pending_payment`, `paid`)
    - _Requirement: 4.1, 4.4_

  - [~] 18.2 Tambahkan semua 17 endpoint baru ke `openapi.yaml`
    - Wallet: `GET /wallet`, `GET /wallet/history`
    - Topup: `POST /wallet/topup/midtrans`, `POST /wallet/topup/paypal`, `POST /wallet/topup/paypal/capture`
    - Booking payment: `POST /bookings/{id}/pay`, `GET /bookings/{id}/payment-status`
    - Withdraw vendor: `POST /withdraw`, `GET /withdraw`, `GET /withdraw/{id}`
    - Admin withdraw: `GET /admin/withdraw`, `PATCH /admin/withdraw/{id}`
    - Notifikasi: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`
    - Webhooks: `POST /webhooks/midtrans`, `POST /webhooks/paypal`
    - Sertakan response schema 200/201, 400, 403, 422 untuk setiap endpoint
    - _Requirement: semua requirement_

- [ ] 19. Integrasi — Pembuatan Wallet Otomatis saat Registrasi
  - [~] 19.1 Update handler registrasi user untuk memanggil `walletService.createWallet`
    - Setelah insert user berhasil, panggil `walletService.createWallet(newUser.id)` dalam transaction yang sama
    - Berlaku untuk role `tourist` dan `vendor`
    - _Requirement: 1.1, 8.1_

  - [~] 19.2 Tulis property test untuk pembuatan wallet otomatis (Property 1)
    - **Property 1: Wallet dibuat dengan saldo nol untuk setiap user baru**
    - **Validates: Requirements 1.1, 8.1**
    - Generate data registrasi user acak (tourist dan vendor)
    - Assert satu wallet per user, `balance = 0`, `lockedBalance = 0`
    - _File: `lib/services/wallet/wallet.service.test.ts`_

- [ ] 20. Integrasi — Alur Penyelesaian Booking (Completed & Cancelled)
  - [~] 20.1 Update handler `PATCH /bookings/{id}/status` untuk memicu escrow release atau refund
    - Ketika status berubah ke `completed`: panggil `escrowService.releaseFundsToVendor(bookingId)`
    - Ketika status berubah ke `confirmed`: panggil `notificationService.createNotification(touristId, "booking_confirmed", ...)`
    - Ketika vendor mengubah status ke `cancelled` (penolakan): panggil `paymentService.refundToWallet(bookingId)`, lalu `notificationService.createNotification(touristId, "booking_rejected", ...)`
    - Semua dalam satu `db.transaction`
    - _Requirement: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1_

  - [~] 20.2 Update handler pembatalan booking oleh tourist di `PATCH /bookings/{id}/status`
    - Ketika tourist mengubah status ke `cancelled` (dari `paid` atau `confirmed`): segera notifikasi vendor (`booking_cancelled_tourist`), lalu panggil `paymentService.refundToWallet(bookingId)`, lalu notifikasi tourist (`refund_success`)
    - _Requirement: 10.1, 10.2, 10.3, 10.4_

  - [~] 20.3 Tulis unit test untuk alur status booking
    - Test transisi valid: `pending` → `paid`, `paid` → `confirmed`, `confirmed` → `completed`
    - Test `completed` memicu escrow release dan notifikasi vendor
    - Test `cancelled` oleh vendor memicu refund dan notifikasi tourist
    - Test `cancelled` oleh tourist memicu notifikasi vendor segera sebelum refund
    - _File: `lib/services/payment/payment.service.test.ts`_

- [~] 21. Checkpoint Final — Semua Tests Harus Lulus
  - Jalankan seluruh test suite: `pnpm test --run`
  - Pastikan semua 21 property test lulus (Property 1 – Property 21)
  - Pastikan OpenAPI spec valid (tidak ada referensi skema yang hilang)
  - Pastikan semua endpoint baru dapat diakses dan mengembalikan response yang benar
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum dianggap selesai.

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Setiap property test menggunakan `fast-check` dengan `numRuns: 100`
- Semua operasi keuangan harus dibungkus dalam `db.transaction` untuk atomisitas
- Optimistic locking pada wallet menggunakan kolom `version` dengan maksimal 3 retry
- Webhook handler harus selalu mengembalikan HTTP 200 untuk webhook valid (termasuk duplikat)
- Webhook duplikat dikembalikan 200 tanpa pemrosesan ulang (idempoten)
- Environment variable yang dibutuhkan: `MIDTRANS_SERVER_KEY`, `MIDTRANS_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`, `PAYPAL_WEBHOOK_ID`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"] },
    { "id": 1, "tasks": ["1.9", "1.10"] },
    { "id": 2, "tasks": ["2.1", "4.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "2.5", "4.2", "4.3"] },
    { "id": 5, "tasks": ["2.6", "5.2", "5.3"] },
    { "id": 6, "tasks": ["2.7", "2.8", "5.4", "5.5"] },
    { "id": 7, "tasks": ["2.9", "5.6", "7.1", "8.1"] },
    { "id": 8, "tasks": ["7.2", "7.3", "8.2", "8.3"] },
    { "id": 9, "tasks": ["9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3", "9.4", "10.1", "10.2"] },
    { "id": 11, "tasks": ["10.3", "10.4", "10.5", "10.6"] },
    { "id": 12, "tasks": ["11.1", "11.2", "13.1", "13.2"] },
    { "id": 13, "tasks": ["11.3", "11.4", "11.5"] },
    { "id": 14, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 15, "tasks": ["15.1", "15.2", "15.3", "15.4"] },
    { "id": 16, "tasks": ["16.1", "16.2", "17.1", "17.2"] },
    { "id": 17, "tasks": ["18.1"] },
    { "id": 18, "tasks": ["18.2", "19.1"] },
    { "id": 19, "tasks": ["19.2", "20.1"] },
    { "id": 20, "tasks": ["20.2", "20.3"] }
  ]
}
```
