import { Router } from "express";
import { db, bookingsTable, listingsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateBookingBody, UpdateBookingStatusBody } from "@workspace/api-zod";

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

// GET /api/bookings
router.get("/bookings", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { status, listingId } = req.query as Record<string, string>;
  const conditions = [eq(bookingsTable.userId, userId)];
  if (status) conditions.push(eq(bookingsTable.status, status));
  if (listingId) conditions.push(eq(bookingsTable.listingId, parseInt(listingId)));

  const bookings = await db.select().from(bookingsTable).where(and(...conditions));
  res.json(await Promise.all(bookings.map(bookingToResponse)));
});

// POST /api/bookings
router.post("/bookings", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }

  const { listingId, checkInDate, checkOutDate, guests, notes } = parsed.data;

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const nights =
    checkOutDate
      ? Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
      : 1;
  const totalPrice = listing.price * (guests ?? 1) * nights;
  const commissionRate = COMMISSION_RATES[listing.category] ?? 0.10;
  const commissionAmount = totalPrice * commissionRate;

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      listingId,
      userId,
      totalPrice,
      commissionAmount,
      guests: guests ?? 1,
      checkInDate,
      checkOutDate: checkOutDate ?? null,
      notes: notes ?? null,
    })
    .returning();

  // Increment bookingCount on listing
  await db
    .update(listingsTable)
    .set({ bookingCount: listing.bookingCount + 1 })
    .where(eq(listingsTable.id, listingId));

  res.status(201).json(await bookingToResponse(booking));
});

// GET /api/bookings/:id
router.get("/bookings/:id", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(await bookingToResponse(booking));
});

// PATCH /api/bookings/:id/status
router.patch("/bookings/:id/status", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  const parsed = UpdateBookingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(await bookingToResponse(booking));
});

export default router;
