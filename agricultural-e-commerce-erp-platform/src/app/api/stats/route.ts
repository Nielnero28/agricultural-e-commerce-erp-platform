import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  products,
  cooperatives,
  users,
  transactions,
  orders,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fetchOrdersWithItems, ownedItemsWhere } from "@/lib/orders";

function monthStart(offset = 0): string {
  const d = new Date();
  const m = new Date(d.getFullYear(), d.getMonth() - offset, 1);
  return m.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  if (session.role === "admin") {
    const [prod] = await db.select({ n: count() }).from(products);
    const [coops] = await db.select({ n: count() }).from(cooperatives);
    const [vendors] = await db.select({ n: count() }).from(users).where(eq(users.role, "vendor"));
    const [coopUsers] = await db.select({ n: count() }).from(users).where(eq(users.role, "cooperative"));
    const [buyers] = await db.select({ n: count() }).from(users).where(eq(users.role, "buyer"));
    const [orderCount] = await db.select({ n: count() }).from(orders);
    const [gmv] = await db
      .select({ v: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(neqCancelled());
    const [openOrders] = await db
      .select({ n: count() })
      .from(orders)
      .where(inArray(orders.status, ["processing", "confirmed"]));
    const [towns] = await db
      .select({ n: count(sql`distinct ${products.town}`) })
      .from(products)
      .where(eq(products.status, "active"));
    const recentOrders = await fetchOrdersWithItems(undefined, 6);
    const lowStock = await db
      .select({ id: products.id, name: products.name, stock: products.stock, town: products.town, imageUrl: products.imageUrl })
      .from(products)
      .where(and(eq(products.status, "active"), sql`${products.stock} <= 15`))
      .orderBy(products.stock)
      .limit(6);

    return NextResponse.json({
      kind: "admin",
      data: {
        products: prod.n,
        cooperatives: coops.n,
        vendors: vendors.n,
        cooperativeUsers: coopUsers.n,
        buyers: buyers.n,
        orders: orderCount.n,
        gmv: gmv.v,
        openOrders: openOrders.n,
        townsCovered: towns.n,
        recentOrders,
        lowStock,
      },
    });
  }

  // vendor / cooperative scope
  const tScope =
    session.role === "cooperative" && session.cooperativeId
      ? eq(transactions.cooperativeId, session.cooperativeId)
      : session.role === "vendor"
        ? eq(transactions.vendorUserId, session.id)
        : sql`1=0`;
  const pScope =
    session.role === "cooperative" && session.cooperativeId
      ? eq(products.cooperativeId, session.cooperativeId)
      : session.role === "vendor"
        ? eq(products.vendorUserId, session.id)
        : sql`1=0`;

  const m0 = monthStart(0);
  const m1 = monthStart(1);
  const m5 = monthStart(5);

  const [incomeThisMonth] = await db
    .select({ v: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(tScope, eq(transactions.type, "income"), gte(transactions.txDate, m0)));
  const [incomeLastMonth] = await db
    .select({ v: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        tScope,
        eq(transactions.type, "income"),
        gte(transactions.txDate, m1),
        lt(transactions.txDate, m0)
      )
    );
  const [expenseThisMonth] = await db
    .select({ v: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(tScope, eq(transactions.type, "expense"), gte(transactions.txDate, m0)));

  const productRows = await db
    .select({ id: products.id, name: products.name, stock: products.stock, town: products.town, imageUrl: products.imageUrl, category: products.category })
    .from(products)
    .where(pScope)
    .orderBy(desc(products.id));

  const [openOrders] = await db
    .select({ n: count() })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ["processing", "confirmed"]),
        ownedItemsWhere(
          session.role === "cooperative" ? session.cooperativeId : null,
          session.role === "vendor" ? session.id : null
        )
      )
    );

  const recentOrders = await fetchOrdersWithItems(
    ownedItemsWhere(
      session.role === "cooperative" ? session.cooperativeId : null,
      session.role === "vendor" ? session.id : null
    ),
    5
  );
  const recentTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      category: transactions.category,
      amount: transactions.amount,
      note: transactions.note,
      txDate: transactions.txDate,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(and(tScope, gte(transactions.txDate, m5)))
    .orderBy(desc(transactions.createdAt), desc(transactions.id))
    .limit(8);

  // 6-month income/expense series
  const seriesRows = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      txDate: transactions.txDate,
    })
    .from(transactions)
    .where(and(tScope, gte(transactions.txDate, m5)))
    .limit(2000);

  const months: { label: string; income: number; expense: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = monthStart(i);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString().slice(0, 10);
    const label = new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString("en-PH", { month: "short" });
    let income = 0;
    let expense = 0;
    for (const r of seriesRows) {
      if (!r.txDate) continue;
      if (r.txDate >= start && r.txDate < end) {
        if (r.type === "income") income += r.amount;
        else expense += r.amount;
      }
    }
    months.push({ label, income, expense });
  }

  return NextResponse.json({
    kind: "vendor",
    data: {
      incomeThisMonth: incomeThisMonth.v,
      incomeLastMonth: incomeLastMonth.v,
      expenseThisMonth: expenseThisMonth.v,
      products: productRows.length,
      lowStockCount: productRows.filter((p) => p.stock > 0 && p.stock <= 15).length,
      outOfStockCount: productRows.filter((p) => p.stock === 0).length,
      openOrders: openOrders.n,
      recentOrders,
      recentTransactions,
      lowStock: productRows.filter((p) => p.stock <= 15).sort((a, b) => a.stock - b.stock).slice(0, 6),
      months,
    },
  });
}

function neqCancelled() {
  return sql`${orders.status} <> 'cancelled'`;
}
