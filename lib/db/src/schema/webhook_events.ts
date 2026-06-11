import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
  "received",   // diterima, belum diproses
  "processed",  // berhasil diproses
  "failed",     // gagal diproses
  "duplicate",  // duplikat, diabaikan
]);

export const webhookEventsTable = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  gateway: text("gateway").notNull(),            // midtrans|paypal
  eventId: text("event_id").notNull().unique(),  // ID unik dari gateway (untuk idempotency)
  eventType: text("event_type").notNull(),       // transaction.success, PAYMENT.CAPTURE.COMPLETED, dll
  orderId: text("order_id"),                     // order ID di gateway (nullable)
  rawPayload: text("raw_payload").notNull(),     // raw JSON payload untuk audit
  status: webhookEventStatusEnum("status").notNull().default("received"),
  errorMessage: text("error_message"),          // pesan error jika status = failed
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEventsTable).omit({ id: true, createdAt: true });
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
