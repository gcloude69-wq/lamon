import { pgTable, serial, text, timestamp, real, integer, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",          // booking dibuat, belum ada pembayaran
  "pending_payment",  // pembayaran via gateway dimulai, menunggu konfirmasi
  "paid",             // pembayaran dikonfirmasi, menunggu konfirmasi vendor
  "confirmed",        // vendor telah mengkonfirmasi
  "completed",        // servis selesai
  "cancelled",        // dibatalkan (oleh tourist, vendor, atau timeout)
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  userId: integer("user_id").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  totalPrice: real("total_price").notNull(),
  commissionAmount: real("commission_amount"),
  guests: integer("guests").notNull().default(1),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }),
  notes: text("notes"),
  paymentMethod: text("payment_method"), // wallet|midtrans|paypal
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
