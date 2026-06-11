import { pgTable, serial, text, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const withdrawStatusEnum = pgEnum("withdraw_status", [
  "pending_withdrawal", // menunggu persetujuan admin
  "completed",          // sudah diproses dan saldo dikurangi
  "rejected",           // ditolak admin
]);

export const withdrawRequestsTable = pgTable("withdraw_requests", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),                          // FK ke usersTable.id
  amount: real("amount").notNull(),                                  // jumlah yang ditarik (IDR)
  bankName: text("bank_name").notNull(),                             // nama bank (BCA, BNI, dll)
  bankAccountNumber: text("bank_account_number").notNull(),          // nomor rekening
  bankAccountName: text("bank_account_name").notNull(),              // nama pemilik rekening
  status: withdrawStatusEnum("status").notNull().default("pending_withdrawal"),
  adminNote: text("admin_note"),                                     // catatan admin saat approval/rejection
  processedBy: integer("processed_by"),                              // FK ke usersTable.id (admin yang memproses)
  processedAt: timestamp("processed_at", { withTimezone: true }),    // waktu diproses admin
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWithdrawRequestSchema = createInsertSchema(withdrawRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWithdrawRequest = z.infer<typeof insertWithdrawRequestSchema>;
export type WithdrawRequest = typeof withdrawRequestsTable.$inferSelect;
