import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationTypeEnum = pgEnum("notification_type", [
  "topup_success",             // Tourist: topup berhasil
  "booking_confirmed",         // Tourist: booking dikonfirmasi vendor
  "booking_rejected",          // Tourist: booking ditolak vendor
  "booking_cancelled_tourist", // Vendor: tourist membatalkan booking
  "refund_success",            // Tourist: refund diterima
  "new_booking",               // Vendor: booking baru masuk
  "withdraw_processed",        // Vendor: withdraw diproses
  "withdraw_rejected",         // Vendor: withdraw ditolak
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),              // FK ke usersTable.id
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read").notNull().default(0),   // 0 = belum dibaca, 1 = sudah dibaca
  meta: text("meta"),                                // JSON string untuk data tambahan
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
