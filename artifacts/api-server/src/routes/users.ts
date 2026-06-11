import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
  UpdateMeBody,
} from "@workspace/api-zod";
import { createHash } from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "lampira_salt").digest("hex");
}

function userToResponse(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    avatarUrl: u.avatarUrl ?? null,
    phone: u.phone ?? null,
    language: u.language,
    vendorProfile:
      u.role === "vendor"
        ? {
            businessName: u.businessName ?? "",
            businessDescription: u.businessDescription ?? "",
            trustScore: u.trustScore ?? 100,
            isVerified: u.isVerified,
          }
        : undefined,
    createdAt: u.createdAt.toISOString(),
  };
}

// POST /api/users/register
router.post("/users/register", async (req, res) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { email, password, name, role, phone, businessName } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash: hashPassword(password),
      name,
      role: role ?? "tourist",
      phone: phone ?? null,
      businessName: businessName ?? null,
    })
    .returning();

  const token = Buffer.from(`${user.id}:${user.email}:${user.role}`).toString("base64");
  res.status(201).json({ user: userToResponse(user), token });
});

// POST /api/users/login
router.post("/users/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = Buffer.from(`${user.id}:${user.email}:${user.role}`).toString("base64");
  res.json({ user: userToResponse(user), token });
});

// GET /api/users/me
router.get("/users/me", async (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  let userId: number;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    userId = parseInt(decoded.split(":")[0]);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userToResponse(user));
});

// PATCH /api/users/me
router.patch("/users/me", async (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  let userId: number;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    userId = parseInt(decoded.split(":")[0]);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { name, phone, avatarUrl, language, businessName, businessDescription } = parsed.data;
  const [user] = await db
    .update(usersTable)
    .set({
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(language !== undefined && { language }),
      ...(businessName !== undefined && { businessName }),
      ...(businessDescription !== undefined && { businessDescription }),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userToResponse(user));
});

export default router;
