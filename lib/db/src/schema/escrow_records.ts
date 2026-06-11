import { pgTable, serial, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const escrowStatusEnum = pgEnum("escrow_status", [
  "holding",   // dana sedang ditahan
  "released",  // dana dilepas ke vendor
  "refunded",  // dana dikembalikan ke tourist
]);

export const escrowRecordsTable = pgTable("escrow_records", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().unique(),              // FK ke bookingsTable.id — satu escrow per booking
  touristId: integer("tourist_id").notNull(),                       // FK ke usersTable.id
  vendorId: integer("vendor_id").notNull(),                         // FK ke usersTable.id
  amount: real("amount").notNull(),                                 // total dana yang ditahan (IDR)
  commissionAmount: real("commission_amount"),                      // komisi platform (diisi saat released)
  netAmount: real("net_amount"),                                    // dana bersih ke vendor (diisi saat released)
  status: escrowStatusEnum("status").notNull().default("holding"),
  heldAt: timestamp("held_at", { withTimezone: true }).notNull().defaultNow(),
  releasedAt: timestamp("released_at", { withTimezone: true }),     // waktu dana dilepas (released atau refunded)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEscrowRecordSchema = createInsertSchema(escrowRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEscrowRecord = z.infer<typeof insertEscrowRecordSchema>;
export type EscrowRecord = typeof escrowRecordsTable.$inferSelect;
