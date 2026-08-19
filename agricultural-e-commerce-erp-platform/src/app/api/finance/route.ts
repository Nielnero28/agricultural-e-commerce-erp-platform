import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions, cooperatives, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ transactions: [] });

  const where: any[] = [];
  if (session.role === "admin") {
    // all
  } else if (session.role === "cooperative" && session.cooperativeId) {
    where.push(eq(transactions.cooperativeId, session.cooperativeId));
  } else if (session.role === "vendor") {
    where.push(eq(transactions.vendorUserId, session.id));
  } else {
    return NextResponse.json({ transactions: [] });
  }

  const rows = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      category: transactions.category,
      amount: transactions.amount,
      note: transactions.note,
      txDate: transactions.txDate,
      createdAt: transactions.createdAt,
      sourceName: sql<string>`coalesce(${cooperatives.name}, ${users.name})`,
    })
    .from(transactions)
    .leftJoin(cooperatives, eq(transactions.cooperativeId, cooperatives.id))
    .leftJoin(users, eq(transactions.vendorUserId, users.id))
    .where(and(...where))
    .orderBy(desc(transactions.createdAt), desc(transactions.id))
    .limit(120);

  return NextResponse.json({ transactions: rows });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !["admin", "cooperative", "vendor"].includes(session.role)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const type = body.type === "expense" ? "expense" : "income";
  const category = String(body.category ?? "").trim() || (type === "income" ? "Other income" : "Other expense");
  const amount = Math.round(Number(body.amount));
  const note = String(body.note ?? "").trim() || null;
  const date = body.date ? String(body.date) : undefined;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }

  const [row] = await db
    .insert(transactions)
    .values({
      cooperativeId: session.role === "cooperative" ? session.cooperativeId : null,
      vendorUserId: session.role === "vendor" ? session.id : null,
      type,
      category,
      amount,
      note,
      txDate: date ? sql`${date}` : sql`CURRENT_DATE`,
    })
    .returning();

  return NextResponse.json({ transaction: row }, { status: 201 });
}
