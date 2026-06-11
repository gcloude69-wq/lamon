import { pgTable, serial, text, timestamp, boolean, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  category: text("category").notNull(), // transportation|accommodation|restaurant|tour|event|guide|souvenir
  name: text("name").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("IDR"),
  imageUrl: text("image_url"),
  images: text("images").array().notNull().default([]),
  latitude: real("latitude"),
  longitude: real("longitude"),
  avgRating: real("avg_rating").default(0),
  reviewCount: integer("review_count").notNull().default(0),
  bookingCount: integer("booking_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  status: text("status").notNull().default("active"), // active|inactive|pending_review
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
