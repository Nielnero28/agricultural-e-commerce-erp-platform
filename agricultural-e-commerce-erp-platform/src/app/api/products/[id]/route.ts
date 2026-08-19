import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, inventoryMovements } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

async function loadWithAccess(id: number) {
  const session = await getSessionUser();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return { error: NextResponse.json({ error: "Product not found." }, { status: 404 }) };
  const isOwner =
    session &&
    ((session.role === "cooperative" && product.cooperativeId === session.cooperativeId) ||
      (session.role === "vendor" && product.vendorUserId === session.id) ||
      session.role === "admin");
  if (!isOwner) return { error: NextResponse.json({ error: "You do not have access to this product." }, { status: 403 }) };
  return { session, product };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { session, product, error } = await loadWithAccess(Number(id));
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.category !== undefined) patch.category = String(body.category).trim();
  if (body.description !== undefined) patch.description = String(body.description).trim() || null;
  if (body.unit !== undefined) patch.unit = String(body.unit).trim();
  if (body.town !== undefined) patch.town = String(body.town).trim();
  if (body.imageUrl !== undefined) patch.imageUrl = String(body.imageUrl).trim() || null;
  if (body.featured !== undefined) patch.featured = !!body.featured;
  if (body.status !== undefined && ["active", "inactive"].includes(body.status)) {
    patch.status = body.status;
  }
  if (body.pricePerUnit !== undefined) {
    const p = Math.round(Number(body.pricePerUnit));
    if (!Number.isFinite(p) || p <= 0) {
      return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
    }
    patch.pricePerUnit = p;
  }
  if (body.stock !== undefined) {
    const s = Math.round(Number(body.stock));
    if (!Number.isFinite(s) || s < 0) {
      return NextResponse.json({ error: "Stock cannot be negative." }, { status: 400 });
    }
    patch.stock = s;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const [updated] = await db.update(products).set(patch).where(eq(products.id, product.id)).returning();

  if (patch.stock !== undefined && patch.stock !== product.stock) {
    await db.insert(inventoryMovements).values({
      productId: product.id,
      type: "adjustment",
      delta: patch.stock - product.stock,
      note: body.stockNote ? String(body.stockNote) : "Stock updated in product editor",
      userId: session?.id ?? null,
    });
  }

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { error } = await loadWithAccess(Number(id));
  if (error) return error;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
