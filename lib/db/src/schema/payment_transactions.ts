import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",    // menunggu konfirmasi dari gateway
  "success",    // berhasil dikonfirmasi
  "failed",     // gagal
  "expired",    // kedaluwarsa (>24 jam tanpa konfirmasi)
  "refunded",   // sudah direfund ke tourist
]);

export const paymentTransactionsTable = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),                                                   // FK ke usersTable.id
  bookingId: integer("booking_id"),                                                       // FK ke bookingsTable.id (null untuk topup)
  type: text("type").notNull(),                                                           // topup|booking_payment
  gateway: text("gateway").notNull(),                                                     // midtrans|paypal|wallet
  gatewayOrderId: text("gateway_order_id"),                                               // ID transaksi di gateway (Midtrans order_id / PayPal order_id)
  gatewayPaymentId: text("gateway_payment_id"),                                           // ID pembayaran spesifik dari gateway
  amount: real("amount").notNull(),                                                       // jumlah dalam IDR
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),                                                  // qris|bca_va|bni_va|bri_va|mandiri_va|permata_va|paypal|wallet
  gatewayResponse: text("gateway_response"),                                              // raw response JSON dari gateway (untuk audit trail)
  expiredAt: timestamp("expired_at", { withTimezone: true }),                             // waktu kedaluwarsa (24 jam dari createdAt)
  processedAt: timestamp("processed_at", { withTimezone: true }),                         // waktu konfirmasi diterima dari gateway
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactionsTable.$inferSelect;
