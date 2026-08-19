import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

export type OrderWithItems = {
  id: number;
  reference: string;
  userId: number | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  address: string | null;
  note: string | null;
  total: number;
  status: string;
  createdAt: Date;
  items: {
    id: number;
    productId: number | null;
    name: string;
    unit: string;
    price: number;
    qty: number;
    subtotal: number;
    cooperativeId: number | null;
    vendorUserId: number | null;
    town: string | null;
  }[];
};

export async function fetchOrdersWithItems(where?: any, limit = 60): Promise<OrderWithItems[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));
  return rows.map((r) => ({
    ...r,
    items: items.filter((i) => i.orderId === r.id),
  }));
}

/** WHERE clause matching orders that contain at least one item owned by the given scope. */
export function ownedItemsWhere(cooperativeId: number | null, vendorUserId: number | null) {
  if (cooperativeId && vendorUserId) {
    return sql`EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = orders.id
        AND (oi.cooperative_id = ${cooperativeId} OR oi.vendor_user_id = ${vendorUserId})
    )`;
  }
  if (cooperativeId) {
    return sql`EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = orders.id AND oi.cooperative_id = ${cooperativeId}
    )`;
  }
  return sql`EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = orders.id AND oi.vendor_user_id = ${vendorUserId}
  )`;
}
