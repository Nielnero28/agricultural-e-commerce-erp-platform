import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, cooperatives } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  getSessionUser,
  sessionCookieOptions,
  type SessionUser,
} from "@/lib/auth";

function publicUser(u: {
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

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "logout") {
    const store = (await import("next/headers")).cookies;
    const c = await store();
    await destroySession(c.get(SESSION_COOKIE)?.value);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  if (action === "login") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        cooperativeId: users.cooperativeId,
        town: users.town,
        phone: users.phone,
        coopName: cooperatives.name,
      })
      .from(users)
      .leftJoin(cooperatives, eq(users.cooperativeId, cooperatives.id))
      .where(eq(users.email, email))
      .limit(1);
    const row = rows[0];
    if (!row || !verifyPassword(password, row.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const user = publicUser({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      cooperativeId: row.cooperativeId,
      town: row.town,
      phone: row.phone,
      cooperativeName: row.coopName,
    });
    const token = await createSession(user.id);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  if (action === "register") {
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = ["admin", "cooperative", "vendor", "buyer"].includes(body.role)
      ? String(body.role)
      : "buyer";
    const town = String(body.town ?? "").trim() || null;
    const phone = String(body.phone ?? "").trim() || null;

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Name, email, and a password of at least 6 characters are required." },
        { status: 400 }
      );
    }
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    let cooperativeId: number | null = null;
    if (role === "cooperative") {
      const coopName = String(body.coopName ?? "").trim();
      if (!coopName) {
        return NextResponse.json(
          { error: "Please provide your cooperative's registered name." },
          { status: 400 }
        );
      }
      const [coop] = await db
        .insert(cooperatives)
        .values({ name: coopName, town: town ?? "Balanga", contactPerson: name, phone })
        .returning({ id: cooperatives.id });
      cooperativeId = coop.id;
    }

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: hashPassword(password),
        role,
        cooperativeId,
        town,
        phone,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        cooperativeId: users.cooperativeId,
        town: users.town,
        phone: users.phone,
      });
    const token = await createSession(user.id);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
