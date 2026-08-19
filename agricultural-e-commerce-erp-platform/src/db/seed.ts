import "dotenv/config";
import { db } from "./index";
import {
  cooperatives,
  users,
  products,
  orders,
  orderItems,
  inventoryMovements,
  transactions,
  suppliers,
  sessions,
} from "./schema";
import { hashPassword } from "../lib/password";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const dateStr = (n: number) => daysAgo(n).toISOString().slice(0, 10);

const IMG = {
  copra: "https://images.pexels.com/photos/15717698/pexels-photo-15717698.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  corn: "https://images.pexels.com/photos/37903951/pexels-photo-37903951.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  palay: "https://images.pexels.com/photos/724384/pexels-photo-724384.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  banana: "https://images.pexels.com/photos/36937769/pexels-photo-36937769.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mango: "https://images.pexels.com/photos/16882401/pexels-photo-16882401.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  pineapple: "https://images.pexels.com/photos/30521864/pexels-photo-30521864.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  talong: "https://images.pexels.com/photos/7543154/pexels-photo-7543154.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tomato: "https://images.pexels.com/photos/5644971/pexels-photo-5644971.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  camote: "https://images.pexels.com/photos/5425893/pexels-photo-5425893.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  gabi: "https://images.pexels.com/photos/12932209/pexels-photo-12932209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  butong: "https://images.pexels.com/photos/1353866/pexels-photo-1353866.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  basket: "https://images.pexels.com/photos/35642004/pexels-photo-35642004.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

async function main() {
  console.log("Clearing tables…");
  await db.delete(sessions);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(inventoryMovements);
  await db.delete(transactions);
  await db.delete(orderItems);
  await db.delete(products);
  await db.delete(suppliers);
  await db.delete(users);
  await db.delete(cooperatives);

  console.log("Seeding cooperatives…");
  const [coopBanagan] = await db.insert(cooperatives).values({
    name: "Banagan Corn Growers Cooperative",
    town: "San Antonio",
    description: "312 member corn and copra growers in San Antonio, Zambales.",
    contactPerson: "Ramon Ocampo",
    phone: "0917 555 0101",
  }).returning();
  const [coopTuburan] = await db.insert(cooperatives).values({
    name: "Tuburan Palay Growers Cooperative",
    town: "Sluice",
    description: "Upland and lowland palay growers of Sluice and Calasiao.",
    contactPerson: "Ligaya Ramos",
    phone: "0918 555 0102",
  }).returning();
  const [coopCabanlanan] = await db.insert(cooperatives).values({
    name: "Cabanlanan Fruit Growers Cooperative",
    town: "Cabanlanan",
    description: "Mango, pineapple, and fruit-tree growers around Cabanlanan.",
    contactPerson: "Etta Villanueva",
    phone: "0920 555 0103",
  }).returning();

  console.log("Seeding users…");
  const pw = hashPassword("demo123");
  const pwAdmin = hashPassword("admin123");
  const [uAdmin] = await db.insert(users).values({
    name: "Maria Santos",
    email: "admin@agrizambales.gov.ph",
    passwordHash: pwAdmin,
    role: "admin",
    town: "Iba",
    phone: "0917 555 0000",
  }).returning();
  const [uBanagan] = await db.insert(users).values({
    name: "Ramon Ocampo",
    email: "ops@banagancoop.ph",
    passwordHash: pw,
    role: "cooperative",
    cooperativeId: coopBanagan.id,
    town: "San Antonio",
    phone: "0917 555 0101",
  }).returning();
  const [uTuburan] = await db.insert(users).values({
    name: "Ligaya Ramos",
    email: "ops@tuburancoop.ph",
    passwordHash: pw,
    role: "cooperative",
    cooperativeId: coopTuburan.id,
    town: "Sluice",
    phone: "0918 555 0102",
  }).returning();
  const [uCabanlanan] = await db.insert(users).values({
    name: "Etta Villanueva",
    email: "ops@cabanlanangrowers.ph",
    passwordHash: pw,
    role: "cooperative",
    cooperativeId: coopCabanlanan.id,
    town: "Cabanlanan",
    phone: "0920 555 0103",
  }).returning();
  const [uMalvarras] = await db.insert(users).values({
    name: "Joel Malvarras",
    email: "joel@malvarrasfarm.ph",
    passwordHash: pw,
    role: "vendor",
    town: "Malvarras",
    phone: "0921 555 0201",
  }).returning();
  const [uReyes] = await db.insert(users).values({
    name: "Nena Reyes",
    email: "nena@tubodfarm.ph",
    passwordHash: pw,
    role: "vendor",
    town: "Don Manuel",
    phone: "0922 555 0202",
  }).returning();
  const [uBuyer] = await db.insert(users).values({
    name: "Paolo Cruz",
    email: "buyer@demo.ph",
    passwordHash: pw,
    role: "buyer",
    town: "Iba",
    phone: "0917 555 0301",
  }).returning();

  console.log("Seeding products…");
  const productDefs = [
    { name: "Dried Copra (Grade A)", category: "Coconut Products", pricePerUnit: 18, unit: "kg", stock: 240, town: "San Antonio", imageUrl: IMG.copra, cooperativeId: coopBanagan.id, vendorUserId: null, featured: true, description: "Sun-dried copra from 25-year-old coconut stands. 50 kg sacks." },
    { name: "Yellow Corn (for milling)", category: "Grains", pricePerUnit: 45, unit: "kg", stock: 480, town: "San Antonio", imageUrl: IMG.corn, cooperativeId: coopBanagan.id, vendorUserId: null, featured: true, description: "Culled, machine-harvested corn. Bulk orders mill-ready." },
    { name: "Palay (unmilled rice)", category: "Grains", pricePerUnit: 42, unit: "kg", stock: 850, town: "Sluice", imageUrl: IMG.palay, cooperativeId: coopTuburan.id, vendorUserId: null, featured: true, description: "Dinorado upland palay. Milling and bagging available at the Sluice gate." },
    { name: "Saba Banana", category: "Fruits", pricePerUnit: 120, unit: "bunch", stock: 60, town: "Malvarras", imageUrl: IMG.banana, cooperativeId: null, vendorUserId: uMalvarras.id, featured: true, description: "Cooking-grade saba, 12–14 fingers per bunch, hand-harvested to order." },
    { name: "Carabao Mango", category: "Fruits", pricePerUnit: 65, unit: "kg", stock: 120, town: "Don Manuel", imageUrl: IMG.mango, cooperativeId: null, vendorUserId: uReyes.id, featured: true, description: "Tree-ripened carabao mangoes. Sweet, thin-skinned, crate-packed." },
    { name: "Sugar Pineapple", category: "Fruits", pricePerUnit: 45, unit: "pc", stock: 90, town: "Cabanlanan", imageUrl: IMG.pineapple, cooperativeId: coopCabanlanan.id, vendorUserId: null, featured: false, description: "Long candy pineapples from Cabanlanan lowlands." },
    { name: "Jiló Eggplant", category: "Vegetables", pricePerUnit: 55, unit: "kg", stock: 40, town: "Malvarras", imageUrl: IMG.talong, cooperativeId: null, vendorUserId: uMalvarras.id, featured: false, description: "Green jiló, the Zambales table favorite. Picked morning of delivery." },
    { name: "Roma Tomato", category: "Vegetables", pricePerUnit: 70, unit: "kg", stock: 6, town: "Don Manuel", imageUrl: IMG.tomato, cooperativeId: null, vendorUserId: uReyes.id, featured: false, description: "Firm Roma tomatoes for ketchup and salads. Small seasonal lot." },
    { name: "Camote (orange-flesh sweet potato)", category: "Root Crops", pricePerUnit: 48, unit: "kg", stock: 150, town: "Cabanlanan", imageUrl: IMG.camote, cooperativeId: coopCabanlanan.id, vendorUserId: null, featured: false, description: "Culled and graded camote. Great for turon and steaming." },
    { name: "Cassava (for sago)", category: "Root Crops", pricePerUnit: 15, unit: "kg", stock: 300, town: "Malvarras", imageUrl: IMG.gabi, cooperativeId: null, vendorUserId: uMalvarras.id, featured: false, description: "Fresh peeler-ready cassava for sago and animal feed." },
    { name: "Butong (fresh sweet corn)", category: "Vegetables", pricePerUnit: 12, unit: "pc", stock: 0, town: "Sluice", imageUrl: IMG.butong, cooperativeId: coopTuburan.id, vendorUserId: null, featured: false, description: "In-husk sweet corn. Weekly lots — check back every Thursday." },
    { name: "Farm-gate Fruit Gift Basket", category: "Processed Goods", pricePerUnit: 350, unit: "box", stock: 18, town: "Don Manuel", imageUrl: IMG.basket, cooperativeId: null, vendorUserId: uReyes.id, featured: false, description: "Seasonal mix of mango, banana, pineapple, and camote. Gift-wrap on request." },
  ];
  const prodByName = new Map<string, (typeof productDefs)[number] & { id: number }>();
  for (const def of productDefs) {
    const [row] = await db.insert(products).values({ ...def }).returning();
    prodByName.set(def.name, { ...def, id: row.id });
  }

  console.log("Seeding initial stock movements…");
  for (const [name, def] of prodByName) {
    if (def.stock > 0) {
      await db.insert(inventoryMovements).values({
        productId: def.id,
        type: "restock",
        delta: def.stock,
        note: `Opening stock for ${name}`,
        userId: (def.cooperativeId ? uBanagan.id : uMalvarras.id),
        createdAt: daysAgo(30),
      });
    }
  }

  console.log("Seeding orders…");
  type OrderSeed = {
    ref: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string;
    address?: string;
    userId?: number;
    daysAgo: number;
    status: string;
    items: { name: string; qty: number }[];
  };
  const orderSeeds: OrderSeed[] = [
    { ref: "ZA-8K2M4Q", buyerName: "Paolo Cruz", buyerEmail: "buyer@demo.ph", buyerPhone: "0917 555 0301", address: "Brgy. Poblacion, Iba City", userId: uBuyer.id, daysAgo: 0, status: "processing", items: [{ name: "Saba Banana", qty: 2 }, { name: "Roma Tomato", qty: 2 }] },
    { ref: "ZA-3P7W1N", buyerName: "Aldo Mercado", buyerEmail: "aldo.mercado@gmail.com", buyerPhone: "0917 555 0410", address: "Brgy. Banaba, Iba City", daysAgo: 1, status: "confirmed", items: [{ name: "Yellow Corn (for milling)", qty: 40 }] },
    { ref: "ZA-9T4B6C", buyerName: "Kristine Uy", buyerEmail: "kristine.uy@yahoo.com", daysAgo: 3, status: "completed", items: [{ name: "Dried Copra (Grade A)", qty: 10 }, { name: "Cassava (for sago)", qty: 20 }] },
    { ref: "ZA-5D8X2H", buyerName: "Miguel Tan", buyerEmail: "mtan.foods@gmail.com", address: "Olongapo City", daysAgo: 8, status: "completed", items: [{ name: "Carabao Mango", qty: 10 }] },
    { ref: "ZA-2R6F9J", buyerName: "Sandra Lim", buyerEmail: "sandra.lim@gmail.com", address: "Brgy. Tuburan, Sluice", daysAgo: 2, status: "processing", items: [{ name: "Palay (unmilled rice)", qty: 25 }] },
    { ref: "ZA-7H3Q8V", buyerName: "Rosa de la Peña", buyerEmail: "rosadp@ph.net", daysAgo: 15, status: "completed", items: [{ name: "Yellow Corn (for milling)", qty: 60 }, { name: "Dried Copra (Grade A)", qty: 5 }] },
    { ref: "ZA-1M5K4T", buyerName: "Carlo Reyes", buyerEmail: "carlo.reyes@gmail.com", daysAgo: 20, status: "cancelled", items: [{ name: "Camote (orange-flesh sweet potato)", qty: 15 }] },
    { ref: "ZA-4C9L7A", buyerName: "Beatriz Ong", buyerEmail: "bong.provision@gmail.com", address: "Brgy. Rizal, Iba City", daysAgo: 35, status: "completed", items: [{ name: "Carabao Mango", qty: 20 }, { name: "Sugar Pineapple", qty: 12 }] },
  ];

  for (const s of orderSeeds) {
    let total = 0;
    const itemRows = s.items.map((i) => {
      const p = prodByName.get(i.name)!;
      total += p.pricePerUnit * i.qty;
      return {
        name: p.name,
        unit: p.unit,
        price: p.pricePerUnit,
        qty: i.qty,
        subtotal: p.pricePerUnit * i.qty,
        productId: p.id,
        cooperativeId: p.cooperativeId,
        vendorUserId: p.vendorUserId,
        town: p.town,
      };
    });
    const [order] = await db.insert(orders).values({
      reference: s.ref,
      userId: s.userId ?? null,
      buyerName: s.buyerName,
      buyerEmail: s.buyerEmail,
      buyerPhone: s.buyerPhone ?? null,
      address: s.address ?? null,
      note: null,
      total,
      status: s.status,
      createdAt: daysAgo(s.daysAgo),
    }).returning();

    for (const item of itemRows) {
      await db.insert(orderItems).values({ ...item, orderId: order.id });
    }

    if (s.status === "completed") {
      for (const item of itemRows) {
        if (item.cooperativeId === null && item.vendorUserId === null) continue;
        await db.insert(transactions).values({
          cooperativeId: item.cooperativeId,
          vendorUserId: item.vendorUserId,
          type: "income",
          category: "Sales",
          amount: item.subtotal,
          note: `Order ${s.ref} — ${item.name} × ${item.qty}`,
          txDate: dateStr(s.daysAgo),
        });
      }
      for (const item of itemRows) {
        await db.insert(inventoryMovements).values({
          productId: item.productId!,
          type: "sale",
          delta: -item.qty,
          note: `Order ${s.ref} — sold ${item.qty} ${item.unit} to ${s.buyerName}`,
          createdAt: daysAgo(s.daysAgo),
        });
      }
    }
  }

  console.log("Seeding ledger entries…");
  const ledger: {
    cooperativeId: number | null;
    vendorUserId: number | null;
    type: "income" | "expense";
    category: string;
    amount: number;
    note: string;
    daysAgo: number;
  }[] = [
    { cooperativeId: coopBanagan.id, vendorUserId: null, type: "expense", category: "Fertilizer & seed", amount: 4850, note: "Urea and NPK for the next corn rotation", daysAgo: 5 },
    { cooperativeId: coopBanagan.id, vendorUserId: null, type: "expense", category: "Packaging", amount: 1200, note: "50 kg sacks, 200 pcs", daysAgo: 6 },
    { cooperativeId: null, vendorUserId: uMalvarras.id, type: "expense", category: "Fuel & transport", amount: 950, note: "Diesel — Iba delivery run", daysAgo: 2 },
    { cooperativeId: null, vendorUserId: uReyes.id, type: "expense", category: "Wages & labor", amount: 2500, note: "Harvest crew, 3 days", daysAgo: 12 },
    { cooperativeId: null, vendorUserId: uReyes.id, type: "expense", category: "Fuel & transport", amount: 600, note: "Tuk-tuk for Olongapo drop", daysAgo: 10 },
    { cooperativeId: coopBanagan.id, vendorUserId: null, type: "income", category: "Sales", amount: 5400, note: "Bulk corn sale — Iba mill", daysAgo: 45 },
    { cooperativeId: coopBanagan.id, vendorUserId: null, type: "income", category: "Sales", amount: 3150, note: "Copra buyer pickup", daysAgo: 70 },
    { cooperativeId: coopTuburan.id, vendorUserId: null, type: "income", category: "Sales", amount: 2730, note: "Palay lot — rice mill", daysAgo: 40 },
    { cooperativeId: coopTuburan.id, vendorUserId: null, type: "expense", category: "Equipment", amount: 1800, note: "Husker blade replacement", daysAgo: 50 },
  ];
  for (const t of ledger) {
    await db.insert(transactions).values({ ...t, txDate: dateStr(t.daysAgo) });
  }

  console.log("Seeding suppliers…");
  const supplierDefs = [
    { cooperativeId: coopBanagan.id, vendorUserId: null, name: "Zambales Agro-Inputs Inc.", contactPerson: "Ben Avila", phone: "0917 555 0501", supplies: "Urea, NPK, corn seed, 50 kg sacks", town: "Iba" },
    { cooperativeId: coopBanagan.id, vendorUserId: null, name: "San Antonio Sacks & Rope", contactPerson: "Fe Garcia", phone: "0920 555 0502", supplies: "Sacks, twine, tarpaulin", town: "San Antonio" },
    { cooperativeId: coopTuburan.id, vendorUserId: null, name: "Sluice Rice Mill Services", contactPerson: "Tato Buenaventura", phone: "0918 555 0503", supplies: "Milling, husker repair, rice bags", town: "Sluice" },
    { cooperativeId: coopCabanlanan.id, vendorUserId: null, name: "Cabanlanan Packaging Supply", contactPerson: "Ruth Domingo", phone: "0920 555 0504", supplies: "Crates, netting, gift boxes", town: "Cabanlanan" },
    { cooperativeId: null, vendorUserId: uMalvarras.id, name: "Malvarras Farm Mechanization", contactPerson: "Alvin Cruz", phone: "0921 555 0505", supplies: "Repair, fuel, harvesters", town: "Malvarras" },
    { cooperativeId: null, vendorUserId: uReyes.id, name: "Tubod Vegetable Society Suppliers", contactPerson: "Lita Fernandez", phone: "0922 555 0506", supplies: "Seedlings, mulch, drip kits", town: "Don Manuel" },
  ];
  for (const s of supplierDefs) await db.insert(suppliers).values(s);

  console.log("Seed complete.");
  console.log("Demo logins:");
  console.log("  admin   admin@agrizambales.gov.ph / admin123");
  console.log("  coop    ops@banagancoop.ph        / demo123");
  console.log("  vendor  joel@malvarrasfarm.ph     / demo123");
  console.log("  buyer   buyer@demo.ph             / demo123");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
