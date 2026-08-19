import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [row] = await db.select().from(transactions).where(eq(transactions.id, Number(id))).limit(1);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isOwner =
    session.role === "admin" ||
    (session.role === "cooperative" && row.cooperativeId === session.cooperativeId) ||
    (session.role === "vendor" && row.vendorUserId === session.id);
  if (!isOwner) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  await db.delete(transactions).where(eq(transactions.id, row.id));
  return NextResponse.json({ ok: true });
}
