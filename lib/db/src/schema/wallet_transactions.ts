import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", [
  "topup",    // penambahan saldo dari topup
  "payment",  // pengurangan saldo untuk pembayaran booking
  "refund",   // penambahan saldo dari refund
  "earning",  // penambahan saldo vendor dari booking completed
  "withdraw", // pengurangan saldo untuk withdraw
]);

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),                      // FK ke walletsTable.id
  type: walletTransactionTypeEnum("type").notNull(),
  amount: real("amount").notNull(),                              // positif = kredit, negatif = debit
  balanceBefore: real("balance_before").notNull(),               // saldo sebelum transaksi
  balanceAfter: real("balance_after").notNull(),                 // saldo sesudah transaksi
  // Untuk earning: detail komisi
  grossAmount: real("gross_amount"),                             // total harga booking (sebelum komisi)
  commissionAmount: real("commission_amount"),                   // jumlah komisi yang dipotong
  netAmount: real("net_amount"),                                 // jumlah yang diterima vendor (setelah komisi)
  // Referensi ke entitas terkait
  bookingId: integer("booking_id"),                              // FK ke bookingsTable.id (nullable)
  paymentTransactionId: integer("payment_transaction_id"),       // FK ke payment_transactions.id (nullable)
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({ id: true, createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
