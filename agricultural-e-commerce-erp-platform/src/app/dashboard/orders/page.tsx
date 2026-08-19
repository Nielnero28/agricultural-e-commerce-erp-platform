"use client";

import { useCallback, useEffect, useState } from "react";
import { peso, formatDateTime, ORDER_STATUS_META } from "@/lib/utils";
import { CheckIcon, MapPinIcon, ReceiptIcon, XIcon } from "@/components/icons";

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
  buyerPhone: string | null;
  address: string | null;
  note: string | null;
  total: number;
  status: string;
  createdAt: string;
  items: Item[];
};

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(order: Order, status: string) {
    const key = `${order.id}-${status}`;
    setBusy(key);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-leaf-900">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Move orders through the pipeline. Completing an order posts its income to your
          finance ledger automatically.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-ink-faint">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <ReceiptIcon size={32} className="text-ink-faint" />
            <h3 className="mt-3 font-display text-xl font-semibold">No orders yet</h3>
            <p className="mt-1 max-w-sm text-sm text-ink-soft">
              Orders that include your products will appear here for processing.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cream-50">
              <tr>
                <th className="th">Order</th>
                <th className="th">Buyer</th>
                <th className="th">Items</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {orders.map((o) => {
                const meta = ORDER_STATUS_META[o.status] ?? { label: o.status, className: "" };
                const open = expanded === o.id;
                return (
                  <FragmentRow
                    key={o.id}
                    order={o}
                    open={open}
                    onToggle={() => setExpanded(open ? null : o.id)}
                    busy={busy}
                    onAction={(s) => void transition(o, s)}
                    metaLabel={meta.label}
                    metaClass={meta.className}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FragmentRow({
  order: o,
  open,
  onToggle,
  busy,
  onAction,
  metaLabel,
  metaClass,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  busy: string | null;
  onAction: (s: string) => void;
  metaLabel: string;
  metaClass: string;
}) {
  return (
    <>
      <tr className="cursor-pointer hover:bg-cream-50/60" onClick={onToggle}>
        <td className="td">
          <span className="font-mono text-xs font-bold text-leaf-800">{o.reference}</span>
          <span className="block text-xs text-ink-faint">{formatDateTime(o.createdAt)}</span>
        </td>
        <td className="td">
          <p className="font-semibold">{o.buyerName}</p>
          <p className="text-xs text-ink-faint">{o.buyerPhone ?? o.buyerEmail}</p>
        </td>
        <td className="td text-ink-soft">{o.items.length}</td>
        <td className="td font-bold">{peso(o.total)}</td>
        <td className="td"><span className={`badge ${metaClass}`}>{metaLabel}</span></td>
        <td className="td" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-1.5">
            {o.status === "processing" && (
              <>
                <button
                  onClick={() => onAction("confirmed")}
                  disabled={busy === `${o.id}-confirmed`}
                  className="btn-primary px-3! py-1!.5 text-xs!"
                >
                  <CheckIcon size={13} /> Confirm
                </button>
                <button
                  onClick={() => onAction("cancelled")}
                  disabled={busy === `${o.id}-cancelled`}
                  className="btn !border border-red-300! bg-white! px-3! py-1!.5 text-xs! text-red-700 hover:bg-red-50!"
                >
                  <XIcon size={13} /> Cancel
                </button>
              </>
            )}
            {o.status === "confirmed" && (
              <>
                <button
                  onClick={() => onAction("completed")}
                  disabled={busy === `${o.id}-completed`}
                  className="btn-primary px-3! py-1!.5 text-xs!"
                >
                  <CheckIcon size={13} /> Mark completed
                </button>
                <button
                  onClick={() => onAction("cancelled")}
                  disabled={busy === `${o.id}-cancelled`}
                  className="btn !border border-red-300! bg-white! px-3! py-1!.5 text-xs! text-red-700 hover:bg-red-50!"
                >
                  <XIcon size={13} /> Cancel
                </button>
              </>
            )}
            {["completed", "cancelled"].includes(o.status) && (
              <span className="text-xs font-semibold text-ink-faint">
                {o.status === "completed" ? "Income posted" : "Stock restored"}
              </span>
            )}
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-cream-50/70">
          <td colSpan={6} className="px-5 py-4">
            <ul className="space-y-1.5">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-2 text-sm">
                  <MapPinIcon size={14} className="shrink-0 text-ink-faint" />
                  <span className="font-semibold">{i.name}</span>
                  <span className="text-ink-faint">× {i.qty} {i.unit} @ {peso(i.price)}</span>
                  {i.town && <span className="text-xs text-ink-faint">· {i.town}</span>}
                  <span className="ml-auto font-semibold">{peso(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">
              <span className="font-bold">Delivery:</span> {o.address ?? "—"}
              {o.note && <span className="italic"> · Note: “{o.note}”</span>}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
