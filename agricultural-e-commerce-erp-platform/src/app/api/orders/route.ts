import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products, inventoryMovements } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fetchOrdersWithItems, ownedItemsWhere } from "@/lib/orders";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const session = await getSessionUser();

  if (scope === "mine") {
    if (!session) return NextResponse.json({ error: "Sign in to view your orders." }, { status: 401 });
    const list = await fetchOrdersWithItems(eq(orders.userId, session.id));
    return NextResponse.json({ orders: list });
  }

  if (email) {
    const list = await fetchOrdersWithItems(eq(orders.buyerEmail, email));
    return NextResponse.json({ orders: list });
  }

  if (!session) {
    return NextResponse.json({ error: "Sign in to view orders." }, { status: 401 });
  }

  if (session.role === "admin") {
    const list = await fetchOrdersWithItems(undefined, 100);
    return NextResponse.json({ orders: list });
  }
  if (session.role === "cooperative" || session.role === "vendor") {
    const list = await fetchOrdersWithItems(
      ownedItemsWhere(
        session.role === "cooperative" ? session.cooperativeId : null,
        session.role === "vendor" ? session.id : null
      ),
      100
    );
    return NextResponse.json({ orders: list });
  }
  const list = await fetchOrdersWithItems(eq(orders.userId, session.id));
  return NextResponse.json({ orders: list });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  const body = await req.json().catch(() => ({}));
  const items: { productId: number; qty: number }[] = Array.isArray(body.items) ? body.items : [];
  const buyerName = String(body.buyerName ?? "").trim();
  const buyerEmail = String(body.buyerEmail ?? "").trim().toLowerCase();
  const buyerPhone = String(body.buyerPhone ?? "").trim() || null;
  const address = String(body.address ?? "").trim() || null;
  const note = String(body.note ?? "").trim() || null;

  if (!buyerName || !buyerEmail || !/.+@.+\..+/.test(buyerEmail)) {
    return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const productIds = items.map((i) => Number(i.productId)).filter((n) => Number.isFinite(n) && n > 0);
  const prods = await db.select().from(products).where(inArray(products.id, productIds));
  const prodMap = new Map(prods.map((p) => [p.id, p]));

  let total = 0;
  const resolved: { product: (typeof prods)[number]; qty: number }[] = [];
  for (const item of items) {
    const product = prodMap.get(Number(item.productId));
    const qty = Math.max(1, Math.round(Number(item.qty)));
    if (!product) return NextResponse.json({ error: "An item in your cart no longer exists." }, { status: 400 });
    if (product.status !== "active") {
      return NextResponse.json({ error: `${product.name} is no longer available.` }, { status: 400 });
    }
    if (product.stock < qty) {
      return NextResponse.json(
        { error: `Only ${product.stock} ${product.unit} of ${product.name} left in stock.` },
        { status: 400 }
      );
    }
    total += product.pricePerUnit * qty;
    resolved.push({ product, qty });
  }

  // Prevent double-selling when the same product appears twice
  const seen = new Map<number, number>();
  for (const r of resolved) seen.set(r.product.id, (seen.get(r.product.id) ?? 0) + r.qty);
  for (const r of resolved) {
    if ((seen.get(r.product.id) ?? 0) > r.product.stock) {
      return NextResponse.json({ error: `Not enough stock of ${r.product.name}.` }, { status: 400 });
    }
  }

  const reference =
    "ZA-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

  const [order] = await db
    .insert(orders)
    .values({
      reference,
      userId: session?.id ?? null,
      buyerName,
      buyerEmail,
      buyerPhone,
      address,
      note,
      total,
      status: "processing",
    })
    .returning();

  const itemRows = resolved.map((r) => ({
    orderId: order.id,
    productId: r.product.id,
    name: r.product.name,
    unit: r.product.unit,
    price: r.product.pricePerUnit,
    qty: r.qty,
    subtotal: r.product.pricePerUnit * r.qty,
    cooperativeId: r.product.cooperativeId,
    vendorUserId: r.product.vendorUserId,
    town: r.product.town,
  }));
  await db.insert(orderItems).values(itemRows);

  for (const r of resolved) {
    await db.update(products).set({ stock: sql`${products.stock} - ${r.qty}` }).where(eq(products.id, r.product.id));
    await db.insert(inventoryMovements).values({
      productId: r.product.id,
      type: "sale",
      delta: -r.qty,
      note: `Order ${reference} — sold ${r.qty} ${r.product.unit} to ${buyerName}`,
      userId: session?.id ?? null,
    });
  }

  const [full] = await fetchOrdersWithItems(eq(orders.id, order.id));
  return NextResponse.json({ order: full }, { status: 201 });
}
