import { Router } from "express";
import { db, listingsTable, usersTable, bookingsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

function listingToResponse(l: typeof listingsTable.$inferSelect, vendorName?: string) {
  return {
    id: l.id,
    vendorId: l.vendorId,
    vendorName: vendorName ?? null,
    category: l.category,
    name: l.name,
    description: l.description,
    city: l.city,
    address: l.address ?? null,
    price: l.price,
    currency: l.currency,
    imageUrl: l.imageUrl ?? null,
    images: l.images ?? [],
    latitude: l.latitude ?? null,
    longitude: l.longitude ?? null,
    avgRating: l.avgRating ?? null,
    reviewCount: l.reviewCount,
    bookingCount: l.bookingCount,
    isFeatured: l.isFeatured,
    status: l.status,
    metadata: l.metadata ?? null,
    createdAt: (l.createdAt as Date).toISOString(),
    updatedAt: l.updatedAt ? (l.updatedAt as Date).toISOString() : null,
  };
}

// GET /api/discover/featured
router.get("/discover/featured", async (_req, res) => {
  const featured = await db
    .select()
    .from(listingsTable)
    .where(and(eq(listingsTable.isFeatured, true), eq(listingsTable.status, "active")))
    .orderBy(desc(listingsTable.avgRating))
    .limit(8);

  const vendorIds = [...new Set(featured.map((l) => l.vendorId))];
  const vendors =
    vendorIds.length > 0
      ? await db.select({ id: usersTable.id, name: usersTable.name, businessName: usersTable.businessName }).from(usersTable)
      : [];
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.businessName || v.name]));

  res.json(featured.map((l) => listingToResponse(l, vendorMap[l.vendorId])));
});

// GET /api/discover/trending
router.get("/discover/trending", async (req, res) => {
  const { category, limit = "8" } = req.query as Record<string, string>;
  const limitNum = Math.min(parseInt(limit) || 8, 20);

  const conditions = [eq(listingsTable.status, "active")];
  if (category) conditions.push(eq(listingsTable.category, category));

  const trending = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(desc(listingsTable.bookingCount))
    .limit(limitNum);

  const vendorIds = [...new Set(trending.map((l) => l.vendorId))];
  const vendors =
    vendorIds.length > 0
      ? await db.select({ id: usersTable.id, name: usersTable.name, businessName: usersTable.businessName }).from(usersTable)
      : [];
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.businessName || v.name]));

  res.json(trending.map((l) => listingToResponse(l, vendorMap[l.vendorId])));
});

// GET /api/discover/stats
router.get("/discover/stats", async (_req, res) => {
  const [allListings, allVendors, allBookings] = await Promise.all([
    db.select({ id: listingsTable.id, city: listingsTable.city }).from(listingsTable).where(eq(listingsTable.status, "active")),
    db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "vendor")),
    db.select({ id: bookingsTable.id }).from(bookingsTable),
  ]);

  const destinations = new Set(allListings.map((l) => l.city)).size;

  res.json({
    totalListings: allListings.length,
    totalVendors: allVendors.length,
    totalBookings: allBookings.length,
    totalDestinations: destinations,
  });
});

// GET /api/discover/categories-summary
router.get("/discover/categories-summary", async (_req, res) => {
  const all = await db
    .select({ category: listingsTable.category })
    .from(listingsTable)
    .where(eq(listingsTable.status, "active"));

  const labels: Record<string, string> = {
    transportation: "Transportasi",
    accommodation: "Penginapan",
    restaurant: "Restoran",
    tour: "Wisata & Tur",
    event: "Event Lokal",
    guide: "Guide Lokal",
    souvenir: "Souvenir",
  };

  const counts: Record<string, number> = {};
  all.forEach((l) => {
    counts[l.category] = (counts[l.category] || 0) + 1;
  });

  res.json(
    Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      label: labels[category] || category,
    }))
  );
});

export default router;
