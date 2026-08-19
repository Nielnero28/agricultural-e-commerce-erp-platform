"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { peso, formatDate, ORDER_STATUS_META } from "@/lib/utils";
import { MapPinIcon, ReceiptIcon, SearchIcon, XIcon } from "@/components/icons";

type Item = {
  id: number;
  name: string;
  unit: string;
  price: number;
  qty: number;
  subtotal: number;
  town: string | null;
};
type Order = {
  id: number;
  reference: string;
  buyerName: string;
  buyerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  address: string | null;
  note: string | null;
  items: Item[];
};

export default function MyOrdersPage() {
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [searched, setSearched] = useState(!!initialEmail);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!email.trim()) return;
    const res = await fetch(`/api/orders?email=${encodeURIComponent(email.trim())}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
  }, [email]);

  useEffect(() => {
    if (searched) void load();
  }, [searched, load]);

  async function cancel(order: Order) {
    if (!confirmCancel[order.id]) {
      confirmCancel[order.id] = true;
      setTimeout(() => {
        confirmCancel[order.id] = false;
        setConfirming((c) => ({ ...c, [order.id]: false }));
      }, 3000);
      return;
    }
    setBusy(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) void load();
    } finally {
      setBusy(null);
      confirmCancel[order.id] = false;
      setConfirming((c) => ({ ...c, [order.id]: false }));
    }
  }
  const confirmCancel: Record<number, boolean> = {};
  const [confirming, setConfirming] = useState<Record<number, boolean>>({});

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold tracking-[0.16em] text-harvest-600 uppercase">Order tracking</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-leaf-900 sm:text-4xl">
        Track your farm-gate orders
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Enter the email you used at checkout. Orders are managed by the vendor — the
        reference number and status stay in sync.
      </p>

      <form
        className="card mt-6 flex gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
      >
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
          <input
            className="input pl-9!"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">
          Find orders
        </button>
      </form>

      {searched && !orders && (
        <p className="mt-6 text-sm text-ink-soft">Searching…</p>
      )}

      {orders && orders.length === 0 && (
        <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
          <ReceiptIcon size={32} className="text-ink-faint" />
          <h3 className="mt-3 font-display text-xl font-semibold">No orders found</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Nothing is on record for that email. Check the address or{" "}
            <Link href="/market" className="font-bold text-leaf-700 hover:underline">
              place your first order
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders?.map((o) => {
          const meta = ORDER_STATUS_META[o.status] ?? { label: o.status, className: "bg-cream-200 text-ink" };
          const open = expanded === o.id;
          return (
            <div key={o.id} className="card overflow-hidden">
              <button
                className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left"
                onClick={() => setExpanded(open ? null : o.id)}
              >
                <span className="rounded-lg bg-leaf-50 px-2.5 py-1.5 font-mono text-sm font-bold text-leaf-800">
                  {o.reference}
                </span>
                <span className="text-sm font-semibold">{formatDate(o.createdAt)}</span>
                <span className="badge border-cream-300 bg-cream-100 text-ink-soft">
                  {o.items.length} item{o.items.length === 1 ? "" : "s"}
                </span>
                <span className={`badge ${meta.className}`}>{meta.label}</span>
                <span className="ml-auto font-display text-lg font-semibold text-leaf-800">{peso(o.total)}</span>
              </button>
              {open && (
                <div className="border-t border-cream-200 bg-cream-50/60 px-5 py-4">
                  <ul className="space-y-2">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex items-center gap-2 text-sm">
                        <MapPinIcon size={14} className="shrink-0 text-ink-faint" />
                        <span className="font-semibold">{i.name}</span>
                        <span className="text-ink-faint">
                          × {i.qty} {i.unit} @ {peso(i.price)}
                        </span>
                        {i.town && <span className="text-xs text-ink-faint">· {i.town}</span>}
                        <span className="ml-auto font-semibold">{peso(i.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                    <span className="font-semibold text-ink">Buyer: {o.buyerName}</span>
                    {o.address && <span>· {o.address}</span>}
                    {o.note && <span className="italic">· “{o.note}”</span>}
                  </div>
                  {o.status === "processing" && (
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => void cancel(o)}
                        disabled={busy === o.id}
                        className={`btn px-3!.5 py-1!.5 text-xs ${
                          confirming[o.id] ? "bg-red-700 text-white" : "border border-red-300 bg-white text-red-700 hover:bg-red-50"
                        }`}
                      >
                        <XIcon size={13} />
                        {busy === o.id ? "Cancelling…" : confirming[o.id] ? "Click again to confirm" : "Cancel order"}
                      </button>
                      <span className="text-xs text-ink-faint">Cancelling returns the items to the vendor&apos;s stock.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
