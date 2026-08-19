import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products, inventoryMovements, transactions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fetchOrdersWithItems } from "@/lib/orders";

const TRANSITIONS: Record<string, string[]> = {
  processing: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const ownsItem = items.some(
    (i) =>
      (session.role === "cooperative" && i.cooperativeId === session.cooperativeId) ||
      (session.role === "vendor" && i.vendorUserId === session.id) ||
      session.role === "admin"
  );
  const isOwner = order.userId === session.id;
  if (!ownsItem && !isOwner) {
    return NextResponse.json({ error: "You do not have access to this order." }, { status: 403 });
  }
  // Buyers may only cancel orders still in processing
  if (!ownsItem && !(session.role === "buyer" && order.status === "processing")) {
    return NextResponse.json({ error: "You do not have access to this order." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const next = String(body.status ?? "");
  if (!TRANSITIONS[order.status]?.includes(next)) {
    return NextResponse.json(
      { error: `Cannot move order from "${order.status}" to "${next}".` },
      { status: 400 }
    );
  }

  await db.update(orders).set({ status: next }).where(eq(orders.id, order.id));

  if (next === "completed") {
    for (const item of items) {
      if (item.cooperativeId === null && item.vendorUserId === null) continue;
      await db.insert(transactions).values({
        cooperativeId: item.cooperativeId,
        vendorUserId: item.vendorUserId,
        type: "income",
        category: "Sales",
        amount: item.subtotal,
        note: `Order ${order.reference} — ${item.name} × ${item.qty}`,
        txDate: sql`CURRENT_DATE`,
      });
    }
  }

  if (next === "cancelled") {
    for (const item of items) {
      if (!item.productId) continue;
      const [prod] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!prod) continue;
      await db.update(products).set({ stock: sql`${products.stock} + ${item.qty}` }).where(eq(products.id, prod.id));
      await db.insert(inventoryMovements).values({
        productId: prod.id,
        type: "return",
        delta: item.qty,
        note: `Order ${order.reference} cancelled — ${item.qty} ${item.unit} returned to stock`,
        userId: session.id,
      });
    }
  }

  const [updated] = await fetchOrdersWithItems(eq(orders.id, order.id));
  return NextResponse.json({ order: updated });
}
