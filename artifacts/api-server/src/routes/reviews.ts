import { Router } from "express";
import { db, reviewsTable, usersTable, listingsTable } from "@workspace/db";
import { eq, avg } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";

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

// GET /api/listings/:id/reviews
router.get("/listings/:id/reviews", async (req, res) => {
  const id = parseInt(req.params.id);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.listingId, id));

  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const users =
    userIds.length > 0
      ? await db.select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl }).from(usersTable)
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(
    reviews.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      userId: r.userId,
      userName: userMap[r.userId]?.name ?? null,
      userAvatarUrl: userMap[r.userId]?.avatarUrl ?? null,
      rating: r.rating,
      comment: r.comment ?? null,
      createdAt: (r.createdAt as Date).toISOString(),
    }))
  );
});

// POST /api/listings/:id/reviews
router.post("/listings/:id/reviews", async (req, res) => {
  const userId = getAuthUserId(req as Parameters<typeof getAuthUserId>[0]);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const listingId = parseInt(req.params.id);
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      listingId,
      userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    })
    .returning();

  // Update listing avg rating
  const [aggResult] = await db
    .select({ avg: avg(reviewsTable.rating) })
    .from(reviewsTable)
    .where(eq(reviewsTable.listingId, listingId));

  const [listing] = await db.select({ reviewCount: listingsTable.reviewCount }).from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);

  await db
    .update(listingsTable)
    .set({
      avgRating: aggResult?.avg ? parseFloat(String(aggResult.avg)) : 0,
      reviewCount: (listing?.reviewCount ?? 0) + 1,
    })
    .where(eq(listingsTable.id, listingId));

  const [user] = await db
    .select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  res.status(201).json({
    id: review.id,
    listingId: review.listingId,
    userId: review.userId,
    userName: user?.name ?? null,
    userAvatarUrl: user?.avatarUrl ?? null,
    rating: review.rating,
    comment: review.comment ?? null,
    createdAt: (review.createdAt as Date).toISOString(),
  });
});

export default router;
