import { Router } from "express";
import { db, listingsTable, bookingsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sum } from "drizzle-orm";

const router = Router();

const COMMISSION_RATES: Record<string, number> = {
  transportation: 0.12,
  accommodation: 0.10,
  restaurant: 0.05,
  tour: 0.15,
  event: 0.10,
  guide: 0.10,
  souvenir: 0.05,
};

function getAuthUserId(req: { headers: Record<string, string | string[] | undefined> }): number | null {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString();
    return parseInt(decoded.split(":")[0]);
  } catch {
    return null;
  }
}

function listingToResponse(l: typeof listingsTable.$inferSelect) {
  return {
    id: l.id,
    vendorId: l.vendorId,
    vendorName: null,
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

async function bookingToResponse(b: typeof bookingsTable.$inferSelect) {
  const [listing] = await db
    .select({ name: listingsTable.name, imageUrl: listingsTable.imageUrl, category: listingsTable.category })
    .from(listingsTable)
    .where(eq(listingsTable.id, b.listingId))
    .limit(1);
  const [user] = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, b.userId))
    .limit(1);

  return {
    id: b.id,
    listingId: b.listingId,
    listingName: listing?.name ?? null,
    listingImageUrl: listing?.imageUrl ?? null,
    listingCategory: listing?.category ?? null,
    userId: b.userId,
    userName: user?.name ?? null,
    userEmail: user?.email ?? null,
    status: b.status,
    totalPrice: b.totalPrice,
    commissionAmount: b.commissionAmount ?? null,
    guests: b.guests,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate ?? null,
    notes: b.notes ?? null,
    createdAt: (b.createdAt as Date).toISOString(),
  };
}

// GET /api/vendor/listings
router.get("/vendor/listings", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const listings = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, userId));
  res.json(listings.map(listingToResponse));
});

// GET /api/vendor/bookings
router.get("/vendor/bookings", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { status } = req.query as Record<string, string>;

  // Get all vendor listings
  const listings = await db.select({ id: listingsTable.id }).from(listingsTable).where(eq(listingsTable.vendorId, userId));
  const listingIds = listings.map((l) => l.id);

  if (listingIds.length === 0) {
    res.json([]);
    return;
  }

  const allBookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  const filtered = allBookings.filter(
    (b) => listingIds.includes(b.listingId) && (!status || b.status === status)
  );

  res.json(await Promise.all(filtered.map(bookingToResponse)));
});

// GET /api/vendor/dashboard
router.get("/vendor/dashboard", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const listings = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, userId));
  const listingIds = listings.map((l) => l.id);

  const [vendor] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (listingIds.length === 0) {
    res.json({
      totalListings: 0,
      totalBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      netRevenue: 0,
      avgRating: 0,
      trustScore: vendor?.trustScore ?? 100,
      recentBookings: [],
      bookingsByStatus: [],
      monthlyRevenue: [],
    });
    return;
  }

  const allBookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  const myBookings = allBookings.filter((b) => listingIds.includes(b.listingId));

  const totalRevenue = myBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.totalPrice, 0);
  const totalCommission = myBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.commissionAmount ?? 0), 0);
  const pendingBookings = myBookings.filter((b) => b.status === "pending").length;

  const avgRating = listings.length > 0
    ? listings.reduce((s, l) => s + (l.avgRating ?? 0), 0) / listings.length
    : 0;

  const recentBookings = myBookings.slice(0, 5);

  const statusCounts: Record<string, number> = {};
  myBookings.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  // Monthly revenue for last 6 months
  const monthlyMap: Record<string, { revenue: number; bookings: number }> = {};
  myBookings.filter(b => b.status !== 'cancelled').forEach((b) => {
    const d = b.createdAt as Date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, bookings: 0 };
    monthlyMap[key].revenue += b.totalPrice;
    monthlyMap[key].bookings += 1;
  });

  const monthlyRevenue = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({ month, ...data }));

  res.json({
    totalListings: listings.length,
    totalBookings: myBookings.length,
    pendingBookings,
    totalRevenue,
    netRevenue: totalRevenue - totalCommission,
    avgRating: Math.round(avgRating * 10) / 10,
    trustScore: vendor?.trustScore ?? 100,
    recentBookings: await Promise.all(recentBookings.map(bookingToResponse)),
    bookingsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    monthlyRevenue,
  });
});

// GET /api/vendor/earnings
router.get("/vendor/earnings", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const listings = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, userId));
  const listingIds = listings.map((l) => l.id);

  if (listingIds.length === 0) {
    res.json({ grossRevenue: 0, totalCommission: 0, netRevenue: 0, byCategory: [] });
    return;
  }

  const allBookings = await db.select().from(bookingsTable);
  const myBookings = allBookings.filter(
    (b) => listingIds.includes(b.listingId) && b.status !== "cancelled"
  );

  const listingCategoryMap = Object.fromEntries(listings.map((l) => [l.id, l.category]));

  const byCategory: Record<string, { gross: number; commission: number }> = {};
  myBookings.forEach((b) => {
    const cat = listingCategoryMap[b.listingId] ?? "other";
    if (!byCategory[cat]) byCategory[cat] = { gross: 0, commission: 0 };
    byCategory[cat].gross += b.totalPrice;
    byCategory[cat].commission += b.commissionAmount ?? 0;
  });

  const grossRevenue = myBookings.reduce((s, b) => s + b.totalPrice, 0);
  const totalCommission = myBookings.reduce((s, b) => s + (b.commissionAmount ?? 0), 0);

  res.json({
    grossRevenue,
    totalCommission,
    netRevenue: grossRevenue - totalCommission,
    byCategory: Object.entries(byCategory).map(([category, data]) => ({
      category,
      gross: data.gross,
      commission: data.commission,
      net: data.gross - data.commission,
      commissionRate: COMMISSION_RATES[category] ?? 0.10,
    })),
  });
});

export default router;
