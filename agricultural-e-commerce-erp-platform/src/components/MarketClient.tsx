"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, TOWNS, UNITS, peso } from "@/lib/utils";
import {
  ArrowRightIcon,
  CartIcon,
  CheckIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  StoreIcon,
  TruckIcon,
  XIcon,
} from "@/components/icons";

type Product = {
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
  vendorName: string | null;
};

type UserLite = { name: string; email: string; phone: string | null; town: string | null; role: string } | null;

type CartItem = { product: Product; qty: number };

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", note: "" };

export default function MarketClient({ products, user }: { products: Product[]; user: UserLite }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [town, setTown] = useState("");
  const [sort, setSort] = useState("newest");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ reference: string; total: number; email: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("az_cart");
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    if (user) {
      setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || (user.phone ?? "") }));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("az_cart", JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchesQ = !q || (p.name + " " + p.town + " " + (p.description ?? "")).toLowerCase().includes(q.toLowerCase());
      const matchesCat = !category || p.category === category;
      const matchesTown = !town || p.town === town;
      return matchesQ && matchesCat && matchesTown;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "stock") list = [...list].sort((a, b) => b.stock - a.stock);
    return list;
  }, [products, q, category, town, sort]);

  const cartItems: CartItem[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((p) => p.id === Number(id));
          return product ? { product, qty: Math.min(qty, Math.max(product.stock, 0)) } : null;
        })
        .filter((x): x is CartItem => x !== null && x.qty > 0),
    [cart, products]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.product.pricePerUnit * i.qty, 0);

  const setQty = (id: number, qty: number, max = Infinity) => {
    setCart((c) => {
      const next = { ...c };
      const clamped = Math.max(0, Math.min(qty, max));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      return next;
    });
  };

  async function placeOrder() {
    setError("");
    if (!form.name.trim() || !/.+@.+\..+/.test(form.email)) {
      setError("Please provide your name and a valid email for the delivery receipt.");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((i) => ({ productId: i.product.id, qty: i.qty })),
          buyerName: form.name.trim(),
          buyerEmail: form.email.trim(),
          buyerPhone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong placing the order.");
        return;
      }
      setPlaced({ reference: data.order.reference, total: data.order.total, email: form.email.trim() });
      setCart({});
      setForm(EMPTY_FORM);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPlacing(false);
    }
  }

  const sellerLabel = (p: Product) => p.vendorName ?? "Independent vendor";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-harvest-600 uppercase">Farm-gate market</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-leaf-900 sm:text-4xl">
            Today&apos;s harvest from Zambales
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Every listing is from a registered cooperative or farm vendor. Payment on
            delivery or at the coop gate — no middlemen.
          </p>
        </div>
        <button onClick={() => setCartOpen(true)} className="btn-primary relative">
          <CartIcon size={17} /> Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-harvest-500 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <SearchIcon size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search corn, copra, talong…"
            className="input pl-9!"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={town} onChange={(e) => setTown(e.target.value)} className="input">
          <option value="">All towns</option>
          {TOWNS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
          <option value="stock">Most stock</option>
        </select>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink-soft">
        {filtered.length} listing{filtered.length === 1 ? "" : "s"}
        {town && <> in <span className="text-leaf-800">{town}</span></>}
        {category && <> · {category}</>}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-cream-100 text-ink-faint">
            <SearchIcon size={22} />
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold">No produce matches</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-soft">
            Try a different town or category — harvests rotate with the season.
          </p>
          <button
            className="btn-outline mt-5"
            onClick={() => {
              setQ("");
              setCategory("");
              setTown("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const inCart = cart[p.id] ?? 0;
            const out = p.stock === 0;
            return (
              <article key={p.id} className="card group flex flex-col overflow-hidden">
                <div className="relative h-44 overflow-hidden bg-cream-200">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-faint">
                      <StoreIcon size={34} />
                    </div>
                  )}
                  <span className="badge absolute top-3 left-3 border-transparent bg-white/90 text-leaf-800">{p.category}</span>
                  {out ? (
                    <span className="badge absolute right-3 bottom-3 border-transparent bg-ink/80 text-cream-100">Sold out</span>
                  ) : p.stock <= 10 ? (
                    <span className="badge absolute right-3 bottom-3 border-transparent bg-harvest-500/95 text-white">
                      Only {p.stock} left
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-lg leading-snug font-semibold">{p.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink-faint">
                    <MapPinIcon size={13} /> {p.town} · {sellerLabel(p)}
                  </p>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">{p.description}</p>
                  )}
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <p>
                      <span className="font-display text-xl font-semibold text-leaf-800">{peso(p.pricePerUnit)}</span>
                      <span className="text-xs font-semibold text-ink-faint"> / {p.unit}</span>
                    </p>
                    {out ? (
                      <span className="text-xs font-bold text-ink-faint">Restocking…</span>
                    ) : inCart === 0 ? (
                      <button onClick={() => setQty(p.id, 1, p.stock)} className="btn-primary px-3!.5 py-2!">
                        <PlusIcon size={15} /> Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 rounded-lg border border-leaf-300 bg-leaf-50">
                        <button onClick={() => setQty(p.id, inCart - 1)} className="px-2 py-1.5 text-leaf-800 hover:bg-leaf-100 rounded-l-lg">
                          <MinusIcon size={14} />
                        </button>
                        <span className="min-w-6 text-center text-sm font-bold text-leaf-900">{inCart}</span>
                        <button onClick={() => setQty(p.id, inCart + 1, p.stock)} className="px-2 py-1.5 text-leaf-800 hover:bg-leaf-100 rounded-r-lg">
                          <PlusIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delivery note */}
      <div className="card mt-8 flex items-start gap-3 p-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
          <TruckIcon size={16} />
        </span>
        <p className="text-sm text-ink-soft">
          <span className="font-bold text-ink">Pickup &amp; delivery:</span> orders are consolidated
          at the vendor&apos;s farm gate. Delivery within Iba and neighbouring towns is arranged
          by the cooperative at checkout; out-of-town buyers can coordinate via the order reference.
        </p>
      </div>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setCartOpen(false)} />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
              <h2 className="font-display text-xl font-semibold">Your cart</h2>
              <button onClick={() => setCartOpen(false)} className="btn-ghost p-2!">
                <XIcon size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <CartIcon size={34} className="text-ink-faint" />
                  <p className="mt-3 font-semibold text-ink-soft">Your cart is empty.</p>
                  <p className="text-sm text-ink-faint">Add produce from the market to get started.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cartItems.map((i) => (
                    <li key={i.product.id} className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                        {i.product.imageUrl && (
                          <img src={i.product.imageUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{i.product.name}</p>
                        <p className="text-xs text-ink-faint">
                          {peso(i.product.pricePerUnit)} / {i.product.unit} · {i.product.town}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button onClick={() => setQty(i.product.id, i.qty - 1)} className="rounded border border-cream-300 p-1 hover:bg-cream-100">
                            <MinusIcon size={13} />
                          </button>
                          <span className="min-w-7 text-center text-sm font-bold">{i.qty}</span>
                          <button onClick={() => setQty(i.product.id, i.qty + 1, i.product.stock)} className="rounded border border-cream-300 p-1 hover:bg-cream-100">
                            <PlusIcon size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{peso(i.product.pricePerUnit * i.qty)}</p>
                        <button
                          onClick={() => setQty(i.product.id, 0)}
                          className="mt-1 text-xs font-semibold text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-cream-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-soft">Subtotal</span>
                <span className="font-display text-2xl font-semibold text-leaf-800">{peso(cartTotal)}</span>
              </div>
              <button
                disabled={cartItems.length === 0}
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
                className="btn-primary mt-3 w-full py-3!"
              >
                Checkout <ArrowRightIcon size={16} />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={() => !placing && setCheckoutOpen(false)} />
          <div className="card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            {placed ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                  <CheckIcon size={26} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">Order placed!</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  Your reference is{" "}
                  <span className="rounded bg-leaf-50 px-2 py-0.5 font-mono text-sm font-bold text-leaf-800">
                    {placed.reference}
                  </span>{" "}
                  · total {peso(placed.total)}
                </p>
                <p className="mt-2 max-w-sm text-xs text-ink-faint">
                  The vendor has been notified and will confirm pickup or delivery within 24 hours.
                  Save your reference to track the order.
                </p>
                <div className="mt-6 flex gap-3">
                  <LinkLike href={`/orders?email=${encodeURIComponent(placed.email)}`} onClick={() => setCheckoutOpen(false)} className="btn-primary">
                    Track my order
                  </LinkLike>
                  <button onClick={() => setCheckoutOpen(false)} className="btn-outline">
                    Keep shopping
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">Checkout</h3>
                  <button onClick={() => setCheckoutOpen(false)} className="btn-ghost p-2!" disabled={placing}>
                    <XIcon size={18} />
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {cartItems.length} item{cartItems.length === 1 ? "" : "s"} · {peso(cartTotal)}
                </p>
                <div className="mt-5 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="co-name">Full name</label>
                      <input id="co-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Dela Cruz" />
                    </div>
                    <div>
                      <label className="label" htmlFor="co-email">Email</label>
                      <input id="co-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="co-phone">Mobile</label>
                      <input id="co-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0917 555 0123" />
                    </div>
                    <div>
                      <label className="label" htmlFor="co-town">Pickup / delivery town</label>
                      <select id="co-town" className="input">
                        <option value="">Choose town</option>
                        {TOWNS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="co-addr">Address / barangay</label>
                    <input id="co-addr" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Brgy. Poblacion, Iba City" />
                  </div>
                  <div>
                    <label className="label" htmlFor="co-note">Note to vendor (optional)</label>
                    <textarea id="co-note" rows={2} className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Preferred pickup time, ripeness, packaging…" />
                  </div>
                </div>
                {error && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                    {error}
                  </p>
                )}
                <button onClick={placeOrder} disabled={placing} className="btn-primary mt-5 w-full py-3!">
                  {placing ? "Placing order…" : `Place order · ${peso(cartTotal)}`}
                </button>
                <p className="mt-3 text-center text-xs text-ink-faint">
                  Payment on delivery or at the coop gate. No online payment is taken.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LinkLike({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
