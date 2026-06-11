import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletsTable = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),                                          // FK ke usersTable.id — satu wallet per user
  balance: real("balance").notNull().default(0),                                          // saldo tersedia (IDR)
  lockedBalance: real("locked_balance").notNull().default(0),                             // saldo terkunci untuk withdraw aktif
  version: integer("version").notNull().default(0),                                       // optimistic locking counter
  currency: text("currency").notNull().default("IDR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWalletSchema = createInsertSchema(walletsTable, {
  // Balance tidak boleh negatif — Requirement 1.4, 8.4
  balance: (schema) => schema.min(0, "Saldo wallet tidak boleh negatif"),
  lockedBalance: (schema) => schema.min(0, "Saldo terkunci tidak boleh negatif"),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
