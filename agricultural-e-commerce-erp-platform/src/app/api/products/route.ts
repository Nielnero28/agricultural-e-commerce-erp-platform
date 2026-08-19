import { NextResponse } from "next/server";
import { desc, eq, and, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, cooperatives, users, inventoryMovements } from "@/db/schema";
import { getSessionUser, canManage } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const town = url.searchParams.get("town");
  const featured = url.searchParams.get("featured") === "1";
  const mine = url.searchParams.get("mine") === "1";

  const session = await getSessionUser();
  const where: any[] = [];
  if (!mine) where.push(eq(products.status, "active"));

  if (featured) where.push(eq(products.featured, true));
  if (category) where.push(eq(products.category, category));
  if (town) where.push(eq(products.town, town));
  if (q) {
    const pat = `%${q}%`;
    where.push(
      or(like(products.name, pat), like(products.description, pat), like(products.town, pat))
    );
  }
  if (mine) {
    if (!session) return NextResponse.json({ products: [] });
    if (session.role === "cooperative" && session.cooperativeId) {
      where.push(eq(products.cooperativeId, session.cooperativeId));
    } else if (session.role === "vendor") {
      where.push(eq(products.vendorUserId, session.id));
    } else if (session.role === "buyer") {
      where.push(sql`1=0`);
    } // admin sees all
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      description: products.description,
      pricePerUnit: products.pricePerUnit,
      unit: products.unit,
      stock: products.stock,
      town: products.town,
      imageUrl: products.imageUrl,
      status: products.status,
      featured: products.featured,
      createdAt: products.createdAt,
      cooperativeId: products.cooperativeId,
      cooperativeName: cooperatives.name,
      vendorUserId: products.vendorUserId,
      vendorName: users.name,
    })
    .from(products)
    .leftJoin(cooperatives, eq(products.cooperativeId, cooperatives.id))
    .leftJoin(users, eq(products.vendorUserId, users.id))
    .where(and(...where))
    .orderBy(desc(products.createdAt));

  return NextResponse.json({ products: rows });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!canManage(session)) {
    return NextResponse.json({ error: "Sign in as a vendor or cooperative to add products." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const pricePerUnit = Math.round(Number(body.pricePerUnit));
  const unit = String(body.unit ?? "kg").trim() || "kg";
  const stock = Math.max(0, Math.round(Number(body.stock ?? 0)));
  const town = String(body.town ?? "").trim();
  const description = String(body.description ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim() || null;
  const featured = !!body.featured;

  if (!name || !category || !Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
    return NextResponse.json(
      { error: "Product name, category, and a positive price are required." },
      { status: 400 }
    );
  }
  if (!town) {
    return NextResponse.json({ error: "Select the town of origin." }, { status: 400 });
  }

  const [product] = await db
    .insert(products)
    .values({
      name,
      category,
      description: description || null,
      pricePerUnit,
      unit,
      stock,
      town,
      imageUrl,
      featured,
      cooperativeId: session?.role === "cooperative" ? session.cooperativeId : null,
      vendorUserId: session?.role === "vendor" ? session.id : null,
    })
    .returning();

  if (stock > 0) {
    await db.insert(inventoryMovements).values({
      productId: product.id,
      type: "restock",
      delta: stock,
      note: `Initial stock for ${name}`,
      userId: session?.id ?? null,
    });
  }

  return NextResponse.json({ product }, { status: 201 });
}
