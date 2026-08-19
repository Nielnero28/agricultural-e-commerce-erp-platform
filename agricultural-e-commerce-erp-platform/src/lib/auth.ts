import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { eq, and, type Column, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions, cooperatives } from "@/db/schema";

export const SESSION_COOKIE = "za_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  cooperativeId: number | null;
  cooperativeName: string | null;
  town: string | null;
  phone: string | null;
};

function toSessionUser(u: {
  id: number;
  name: string;
  email: string;
  role: string;
  cooperativeId: number | null;
  town: string | null;
  phone: string | null;
  cooperativeName?: string | null;
}): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    cooperativeId: u.cooperativeId,
    cooperativeName: u.cooperativeName ?? null,
    town: u.town,
    phone: u.phone,
  };
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      cooperativeId: users.cooperativeId,
      town: users.town,
      phone: users.phone,
      coopName: cooperatives.name,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(cooperatives, eq(users.cooperativeId, cooperatives.id))
    .where(eq(sessions.token, token));
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }
  return toSessionUser({ ...row, cooperativeName: row.coopName ?? null });
}

export function canManage(u: SessionUser | null): boolean {
  return !!u && ["admin", "cooperative", "vendor"].includes(u.role);
}

export function isVendorLike(u: SessionUser | null): boolean {
  return !!u && ["cooperative", "vendor"].includes(u.role);
}

/** Ownership scope for products/finance rows of the given user. Pass the table's column refs. */
export function ownershipWhere(
  table: { cooperativeId: Column; vendorUserId: Column },
  u: SessionUser
) {
  if (u.role === "admin") return undefined;
  const conds: SQL[] = [];
  if (u.role === "cooperative" && u.cooperativeId) {
    conds.push(eq(table.cooperativeId, u.cooperativeId));
  }
  if (u.role === "vendor") {
    conds.push(eq(table.vendorUserId, u.id));
  }
  return conds.length ? and(...conds) : undefined;
}
