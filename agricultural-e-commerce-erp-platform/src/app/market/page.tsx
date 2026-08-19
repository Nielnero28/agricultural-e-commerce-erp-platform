import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, cooperatives, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  pricePerUnit: number;
  unit: string;
  stock: number;
  town: string;
  imageUrl: string | null;
  featured: boolean;
  cooperativeName: string | null;
  vendorName: string | null;
};

export default async function MarketPage() {
  const user = await getSessionUser();
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
      featured: products.featured,
      cooperativeName: cooperatives.name,
      vendorName: users.name,
    })
    .from(products)
    .leftJoin(cooperatives, eq(products.cooperativeId, cooperatives.id))
    .leftJoin(users, eq(products.vendorUserId, users.id))
    .where(eq(products.status, "active"))
    .orderBy(desc(products.id));

  const productsData: ProductRow[] = rows.map((r) => ({
    ...r,
    vendorName: r.cooperativeName ?? r.vendorName,
  }));

  return (
    <MarketClient
      products={productsData}
      user={
        user
          ? { name: user.name, email: user.email, phone: user.phone, town: user.town, role: user.role }
          : null
      }
    />
  );
}
