import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { suppliers, cooperatives, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ suppliers: [] });
  const where: any[] = [];
  if (session.role === "cooperative" && session.cooperativeId) {
    where.push(eq(suppliers.cooperativeId, session.cooperativeId));
  } else if (session.role === "vendor") {
    where.push(eq(suppliers.vendorUserId, session.id));
  }
  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      contactPerson: suppliers.contactPerson,
      phone: suppliers.phone,
      supplies: suppliers.supplies,
      town: suppliers.town,
      createdAt: suppliers.createdAt,
      ownerName: sql<string | null>`coalesce(${cooperatives.name}, ${users.name})`,
    })
    .from(suppliers)
    .leftJoin(cooperatives, eq(suppliers.cooperativeId, cooperatives.id))
    .leftJoin(users, eq(suppliers.vendorUserId, users.id))
    .where(and(...where))
    .orderBy(desc(suppliers.createdAt));
  return NextResponse.json({ suppliers: rows });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !["admin", "cooperative", "vendor"].includes(session.role)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Supplier name is required." }, { status: 400 });

  const [row] = await db
    .insert(suppliers)
    .values({
      cooperativeId: session.role === "cooperative" ? session.cooperativeId : null,
      vendorUserId: session.role === "vendor" ? session.id : null,
      name,
      contactPerson: String(body.contactPerson ?? "").trim() || null,
      phone: String(body.phone ?? "").trim() || null,
      supplies: String(body.supplies ?? "").trim() || null,
      town: String(body.town ?? "").trim() || null,
    })
    .returning();
  return NextResponse.json({ supplier: row }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const isOwner =
    session.role === "admin" ||
    (session.role === "cooperative" && row.cooperativeId === session.cooperativeId) ||
    (session.role === "vendor" && row.vendorUserId === session.id);
  if (!isOwner) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  await db.delete(suppliers).where(eq(suppliers.id, row.id));
  return NextResponse.json({ ok: true });
}
