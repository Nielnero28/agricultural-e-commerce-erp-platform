import { NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryMovements, products } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ movements: [] });
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");

  const where: any[] = [];
  if (productId) {
    where.push(eq(inventoryMovements.productId, Number(productId)));
  } else if (session.role === "cooperative" && session.cooperativeId) {
    where.push(eq(products.cooperativeId, session.cooperativeId));
  } else if (session.role === "vendor") {
    where.push(eq(products.vendorUserId, session.id));
  }

  const rows = await db
    .select({
      id: inventoryMovements.id,
      productId: inventoryMovements.productId,
      productName: products.name,
      type: inventoryMovements.type,
      delta: inventoryMovements.delta,
      note: inventoryMovements.note,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .where(and(...where))
    .orderBy(desc(inventoryMovements.createdAt), desc(inventoryMovements.id))
    .limit(40);

  return NextResponse.json({ movements: rows });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !["admin", "cooperative", "vendor"].includes(session.role)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const productId = Number(body.productId);
  const delta = Math.round(Number(body.delta));
  const note = String(body.note ?? "").trim();
  const type = ["restock", "adjustment", "return"].includes(body.type) ? body.type : "adjustment";

  if (!Number.isFinite(productId) || !Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: "A non-zero quantity change is required." }, { status: 400 });
  }

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const isOwner =
    session.role === "admin" ||
    (session.role === "cooperative" && product.cooperativeId === session.cooperativeId) ||
    (session.role === "vendor" && product.vendorUserId === session.id);
  if (!isOwner) return NextResponse.json({ error: "You do not manage this product." }, { status: 403 });

  const newStock = product.stock + delta;
  if (newStock < 0) {
    return NextResponse.json({ error: `Cannot go below zero — current stock is ${product.stock}.` }, { status: 400 });
  }

  await db.update(products).set({ stock: newStock }).where(eq(products.id, product.id));
  await db.insert(inventoryMovements).values({
    productId: product.id,
    type: type === "adjustment" && delta > 0 ? "restock" : type,
    delta,
    note: note || (delta > 0 ? `Received ${delta} ${product.unit}` : `Removed ${-delta} ${product.unit}`),
    userId: session.id,
  });

  return NextResponse.json({ ok: true, newStock });
}
