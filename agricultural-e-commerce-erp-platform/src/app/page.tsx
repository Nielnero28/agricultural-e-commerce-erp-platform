import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, cooperatives, users, orders } from "@/db/schema";
import { peso, TOWNS } from "@/lib/utils";
import {
  ArrowRightIcon,
  BoxIcon,
  CheckIcon,
  MapPinIcon,
  ReceiptIcon,
  SproutIcon,
  TrendUpIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

const HERO_IMG =
  "https://images.pexels.com/photos/34059975/pexels-photo-34059975.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

export default async function Home() {
  const [prodCount, coopCount, vendorCount, orderCount, gmv, towns] = await Promise.all([
    db.select({ n: count() }).from(products).where(eq(products.status, "active")).then((r) => r[0]),
    db.select({ n: count() }).from(cooperatives).then((r) => r[0]),
    db.select({ n: count() }).from(users).where(eq(users.role, "vendor")).then((r) => r[0]),
    db.select({ n: count() }).from(orders).then((r) => r[0]),
    db.select({ v: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).then((r) => r[0]),
    db.select({ n: count(sql`distinct ${products.town}`) }).from(products).where(eq(products.status, "active")).then((r) => r[0]),
  ]);

  const featured = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      pricePerUnit: products.pricePerUnit,
      unit: products.unit,
      stock: products.stock,
      town: products.town,
      imageUrl: products.imageUrl,
      cooperativeName: sql<string | null>`NULL`,
    })
    .from(products)
    .where(andFeatured())
    .orderBy(desc(products.id))
    .limit(4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cream-200 bg-gradient-to-b from-leaf-50 via-cream-50 to-cream-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-leaf-300 bg-leaf-100 px-3 py-1 text-xs font-bold text-leaf-800">
              <SproutIcon size={14} /> Cooperative-led · Farm-gate fresh
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-leaf-900 sm:text-5xl lg:text-[3.4rem]">
              Zambales harvest,
              <br />
              sold and managed
              <br />
              <span className="text-harvest-500">in one platform.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              AgriZambales pairs a farm-gate produce market with the back office every
              cooperative and small farm vendor actually needs — inventory, order
              pipeline, supplier records, and a finance ledger, wired together.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/market" className="btn-primary px-6! py-3! text-base!">
                Browse the market <ArrowRightIcon size={18} />
              </Link>
              <Link href="/register" className="btn-outline px-6! py-3! text-base!">
                Register your cooperative
              </Link>
            </div>
            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-cream-300 pt-6">
              <div>
                <dt className="text-xs font-bold tracking-wide text-ink-faint uppercase">Live listings</dt>
                <dd className="font-display text-2xl font-semibold text-leaf-800">{prodCount.n}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-ink-faint uppercase">Towns covered</dt>
                <dd className="font-display text-2xl font-semibold text-leaf-800">{towns.n}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-ink-faint uppercase">Orders processed</dt>
                <dd className="font-display text-2xl font-semibold text-leaf-800">{orderCount.n}</dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border-4 border-white shadow-xl">
              <img
                src={HERO_IMG}
                alt="Aerial view of coconut plantations in Zambales"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 shadow-lg sm:left-8">
              <span className="flex size-9 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
                <CheckIcon size={18} />
              </span>
              <div>
                <p className="text-sm font-bold">Order ZA-8K2M4Q confirmed</p>
                <p className="text-xs text-ink-soft">40 kg yellow corn · Banagan Growers Co-op, San Antonio</p>
              </div>
            </div>
            <div className="absolute -top-4 right-4 flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 shadow-lg">
              <span className="flex size-7 items-center justify-center rounded-lg bg-harvest-100 text-harvest-600">
                <TrendUpIcon size={15} />
              </span>
              <p className="text-xs font-bold">
                Month-to-date sales <span className="text-leaf-700">{peso(gmv.v)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured produce */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-harvest-600 uppercase">This week at the farm gate</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-leaf-900">
              Fresh from the listings
            </h2>
          </div>
          <Link href="/market" className="btn-ghost">
            View all produce <ArrowRightIcon size={15} />
          </Link>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <Link
              key={p.id}
              href="/market"
              className="card group overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative h-40 overflow-hidden bg-cream-200">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : null}
                <span className="badge absolute top-3 left-3 border-transparent bg-white/90 text-leaf-800">
                  {p.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-ink">{p.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink-faint">
                  <MapPinIcon size={13} /> {p.town}, Zambales
                </p>
                <p className="mt-3 text-sm">
                  <span className="font-display text-xl font-semibold text-leaf-800">{peso(p.pricePerUnit)}</span>
                  <span className="text-ink-faint"> / {p.unit}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-cream-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-harvest-600 uppercase">How it works</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-leaf-900">
                From planting to payout, without the paper trail
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
                Buyers in Iba, Olongapo and across the province order straight from the
                farm gate. The selling side runs its whole operation — stock, orders,
                suppliers, and money — from one dashboard.
              </p>
              <div className="mt-8 overflow-hidden rounded-xl border border-cream-200">
                <img
                  src="https://images.pexels.com/photos/15717701/pexels-photo-15717701.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
                  alt="Coconut plantation aerial, Zambales"
                  className="h-44 w-full object-cover"
                />
              </div>
            </div>
            <ol className="space-y-6">
              {[
                {
                  n: "01",
                  icon: <StoreMark />,
                  title: "List the harvest",
                  body: "Cooperatives and individual vendors publish produce with price, unit, and live stock. Every restock and sale is recorded automatically.",
                },
                {
                  n: "02",
                  icon: <TruckIcon size={19} />,
                  title: "Buyers order online",
                  body: "Shop by town or category, check out with a pickup or delivery address, and track the order reference from processing to delivery.",
                },
                {
                  n: "03",
                  icon: <WalletIcon size={19} />,
                  title: "The back office runs itself",
                  body: "Completing an order posts the income to the ledger. Low stock flags, supplier records, and expense entries keep the books audit-ready.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-leaf-700 text-cream-50">
                      {s.icon}
                    </span>
                    <span className="mt-2 w-px flex-1 bg-cream-300" />
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-bold text-harvest-600">STEP {s.n}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-ink">{s.title}</h3>
                    <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-soft">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ERP modules */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-harvest-600 uppercase">Built-in ERP modules</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-leaf-900">
              The cooperative&apos;s office, digitized
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
              Small farm organizations lose money to loose ends. AgriZambales keeps the
              loose ends tied — the same dashboard a buyer-facing store, an accountant,
              and a warehouse chief would each ask for.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Stock movements logged for every sale, restock, and adjustment",
                "Order pipeline with processing → confirmed → completed states",
                "Income posted automatically when an order completes",
                "Expense entries, supplier directory, and town-level sourcing",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                    <CheckIcon size={12} />
                  </span>
                  <span className="text-ink-soft">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: <BoxIcon size={20} />, name: "Inventory", desc: "Live stock per lot, low-stock alerts, movement history." },
              { icon: <ReceiptIcon size={20} />, name: "Orders", desc: "Full pipeline: processing, confirmed, completed, cancelled." },
              { icon: <WalletIcon size={20} />, name: "Finance", desc: "Auto-posted sales income plus recorded expenses." },
              { icon: <UsersIcon size={20} />, name: "Suppliers", desc: "Seed, fertilizer, and packaging partners by town." },
            ].map((m) => (
              <div key={m.name} className="card p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">{m.icon}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{m.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="border-y border-cream-200 bg-leaf-800 text-cream-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-harvest-300 uppercase">Coverage</p>
              <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight">
                Selected towns of Zambales, one farm gate at a time
              </h2>
            </div>
            <p className="max-w-sm text-sm text-cream-100/70">
              Pilot coverage is expanding across the province&apos;s 20 municipalities and
              the City of Iba.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {TOWNS.map((t) => (
              <span key={t} className="rounded-full border border-cream-50/20 bg-cream-50/10 px-3.5 py-1.5 text-sm font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-leaf-900 px-8 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-cream-50 sm:text-3xl">
              Ready to move your harvest online?
            </h2>
            <p className="mt-2 max-w-lg text-sm text-cream-100/70">
              Cooperatives and individual vendors: create an account, list your first
              lot in under five minutes, and start taking orders today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="btn-accent px-6! py-3!">
              Get started free
            </Link>
            <Link href="/login" className="btn border border-cream-50/30 text-cream-50 hover:bg-cream-50/10">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function andFeatured() {
  return sql`${products.status} = 'active'`;
}

function StoreMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M2 7h20" />
    </svg>
  );
}
