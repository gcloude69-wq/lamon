import { Router } from "express";
import { db, listingsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, or, desc } from "drizzle-orm";
import { CreateListingBody, UpdateListingBody } from "@workspace/api-zod";

const router = Router();

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

// GET /api/listings
router.get("/listings", async (req, res) => {
  const { category, city, search, minPrice, maxPrice, page = "1", limit = "12" } = req.query as Record<string, string>;

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 12, 50);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(listingsTable.status, "active")];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (city) conditions.push(ilike(listingsTable.city, `%${city}%`));
  if (search) {
    conditions.push(
      or(
        ilike(listingsTable.name, `%${search}%`),
        ilike(listingsTable.description, `%${search}%`),
      )!
    );
  }
  if (minPrice) conditions.push(gte(listingsTable.price, parseFloat(minPrice)));
  if (maxPrice) conditions.push(lte(listingsTable.price, parseFloat(maxPrice)));

  const all = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(desc(listingsTable.bookingCount))
    .limit(limitNum)
    .offset(offset);

  const total = all.length < limitNum && offset === 0
    ? all.length
    : (await db.select().from(listingsTable).where(and(...conditions))).length;

  // Fetch vendor names
  const vendorIds = [...new Set(all.map((l) => l.vendorId))];
  const vendors =
    vendorIds.length > 0
      ? await db.select({ id: usersTable.id, name: usersTable.name, businessName: usersTable.businessName }).from(usersTable)
      : [];
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.businessName || v.name]));

  res.json({
    data: all.map((l) => listingToResponse(l, vendorMap[l.vendorId])),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

// POST /api/listings
router.post("/listings", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }

  const { category, name, description, city, address, price, currency, imageUrl, images, latitude, longitude, metadata } =
    parsed.data;

  const [listing] = await db
    .insert(listingsTable)
    .values({
      vendorId: userId,
      category,
      name,
      description,
      city,
      address: address ?? null,
      price,
      currency: currency ?? "IDR",
      imageUrl: imageUrl ?? null,
      images: images ?? [],
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      metadata: metadata ?? null,
    })
    .returning();

  res.status(201).json(listingToResponse(listing));
});

// GET /api/listings/:id
router.get("/listings/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const [vendor] = await db
    .select({ name: usersTable.name, businessName: usersTable.businessName })
    .from(usersTable)
    .where(eq(usersTable.id, listing.vendorId))
    .limit(1);

  res.json(listingToResponse(listing, vendor?.businessName || vendor?.name));
});

// PATCH /api/listings/:id
router.patch("/listings/:id", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { name, description, city, address, price, imageUrl, images, latitude, longitude, status, metadata } = parsed.data;

  const [listing] = await db
    .update(listingsTable)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(city !== undefined && { city }),
      ...(address !== undefined && { address }),
      ...(price !== undefined && { price }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(images !== undefined && { images }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(status !== undefined && { status }),
      ...(metadata !== undefined && { metadata }),
    })
    .where(and(eq(listingsTable.id, id), eq(listingsTable.vendorId, userId)))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found or unauthorized" });
    return;
  }
  res.json(listingToResponse(listing));
});

// DELETE /api/listings/:id
router.delete("/listings/:id", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  await db.delete(listingsTable).where(and(eq(listingsTable.id, id), eq(listingsTable.vendorId, userId)));
  res.status(204).send();
});

export default router;
