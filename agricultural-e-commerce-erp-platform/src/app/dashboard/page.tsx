"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { peso, formatDate, formatDateTime, ORDER_STATUS_META } from "@/lib/utils";
import {
  AlertIcon,
  BoxIcon,
  ReceiptIcon,
  StoreIcon,
  TrendUpIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

type Stats = {
  kind: "admin" | "vendor";
  data: any;
};

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  if (error) return <p className="text-sm font-semibold text-red-700">{error}</p>;
  if (!stats) return <Skeleton />;

  return stats.kind === "admin" ? <AdminOverview data={stats.data} /> : <VendorOverview data={stats.data} />;
}

function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-leaf-900">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{sub}</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon,
  tone = "leaf",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "leaf" | "harvest" | "red" | "ink";
}) {
  const tones = {
    leaf: "bg-leaf-100 text-leaf-700",
    harvest: "bg-harvest-100 text-harvest-600",
    red: "bg-red-100 text-red-700",
    ink: "bg-cream-200 text-ink",
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">{label}</p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs font-semibold text-ink-faint">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status] ?? { label: status, className: "bg-cream-200 text-ink" };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

/* ---------------- Vendor ---------------- */

function VendorOverview({ data }: { data: any }) {
  const delta =
    data.incomeLastMonth > 0
      ? Math.round(((data.incomeThisMonth - data.incomeLastMonth) / data.incomeLastMonth) * 100)
      : null;
  const maxMonth = Math.max(...data.months.map((m: any) => Math.max(m.income, m.expense)), 1);

  return (
    <div className="space-y-6">
      <PageTitle title="Operations overview" sub="Your farm-gate sales, stock, and money in one view." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Income this month"
          value={peso(data.incomeThisMonth)}
          hint={delta === null ? "No income last month" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs last month`}
          icon={<WalletIcon size={16} />}
        />
        <Kpi
          label="Open orders"
          value={String(data.openOrders)}
          hint="Processing + confirmed"
          icon={<ReceiptIcon size={16} />}
          tone="harvest"
        />
        <Kpi label="Products listed" value={String(data.products)} hint={`${data.outOfStockCount} sold out`} icon={<BoxIcon size={16} />} />
        <Kpi
          label="Low stock alerts"
          value={String(data.lowStockCount)}
          hint="15 units or fewer"
          icon={<AlertIcon size={16} />}
          tone={data.lowStockCount > 0 ? "red" : "leaf"}
        />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Income vs expenses</h2>
          <div className="flex items-center gap-4 text-xs font-semibold text-ink-soft">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-leaf-500" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-harvest-400" /> Expenses</span>
          </div>
        </div>
        <div className="mt-5 flex h-40 items-end gap-3">
          {data.months.map((m: any) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div
                  className="w-1/3 max-w-6 rounded-t bg-leaf-500 transition-all"
                  style={{ height: `${Math.max((m.income / maxMonth) * 100, m.income > 0 ? 4 : 1)}%` }}
                  title={`Income ${peso(m.income)}`}
                />
                <div
                  className="w-1/3 max-w-6 rounded-t bg-harvest-400 transition-all"
                  style={{ height: `${Math.max((m.expense / maxMonth) * 100, m.expense > 0 ? 4 : 1)}%` }}
                  title={`Expenses ${peso(m.expense)}`}
                />
              </div>
              <span className="text-[11px] font-bold text-ink-faint">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-xs font-bold text-leaf-700 hover:underline">
              Manage all →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">No orders yet — they will appear as buyers check out.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="th">Reference</th>
                  <th className="th">Buyer</th>
                  <th className="th">Total</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {data.recentOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td className="td">
                      <span className="font-mono text-xs font-bold text-leaf-800">{o.reference}</span>
                      <span className="block text-xs text-ink-faint">{formatDate(o.createdAt)}</span>
                    </td>
                    <td className="td font-semibold">{o.buyerName}</td>
                    <td className="td font-bold">{peso(o.total)}</td>
                    <td className="td"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="border-b border-cream-200 px-5 py-3.5">
              <h2 className="font-display text-lg font-semibold">Recent transactions</h2>
            </div>
            {data.recentTransactions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-soft">No transactions recorded yet.</p>
            ) : (
              <ul className="divide-y divide-cream-100">
                {data.recentTransactions.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${t.type === "income" ? "bg-leaf-100 text-leaf-700" : "bg-red-100 text-red-700"}`}>
                      <TrendUpIcon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.category}</p>
                      <p className="truncate text-xs text-ink-faint">{t.note ?? t.id}</p>
                    </div>
                    <span className={`text-sm font-bold ${t.type === "income" ? "text-leaf-700" : "text-red-700"}`}>
                      {t.type === "income" ? "+" : "−"}{peso(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
              <h2 className="font-display text-lg font-semibold">Low stock</h2>
              <Link href="/dashboard/inventory" className="text-xs font-bold text-leaf-700 hover:underline">
                Restock →
              </Link>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-soft">All products are well stocked. Nice.</p>
            ) : (
              <ul className="divide-y divide-cream-100">
                {data.lowStock.map((p: any) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-200">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-ink-faint">{p.town}</p>
                    </div>
                    <span className={`badge ${p.stock === 0 ? "bg-red-100 text-red-800 border-red-200" : "bg-harvest-100 text-harvest-800 border-harvest-200"}`}>
                      {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Admin ---------------- */

function AdminOverview({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <PageTitle title="Platform overview" sub="Across all cooperatives, vendors, and towns in Zambales." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total sales (GMV)" value={peso(data.gmv)} icon={<WalletIcon size={16} />} />
        <Kpi label="Orders" value={String(data.orders)} hint={`${data.openOrders} open`} icon={<ReceiptIcon size={16} />} tone="harvest" />
        <Kpi label="Active listings" value={String(data.products)} hint={`${data.townsCovered} towns covered`} icon={<StoreIcon size={16} />} />
        <Kpi label="Selling organizations" value={String(data.cooperatives + data.vendors)} hint={`${data.cooperatives} co-ops · ${data.vendors} vendors`} icon={<UsersIcon size={16} />} tone="ink" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold">Latest orders, platform-wide</h2>
          <Link href="/dashboard/orders" className="text-xs font-bold text-leaf-700 hover:underline">Manage all →</Link>
        </div>
        <table className="w-full">
          <thead className="bg-cream-50">
            <tr>
              <th className="th">Reference</th>
              <th className="th">Date</th>
              <th className="th">Buyer</th>
              <th className="th">Items</th>
              <th className="th">Total</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {data.recentOrders.map((o: any) => (
              <tr key={o.id}>
                <td className="td font-mono text-xs font-bold text-leaf-800">{o.reference}</td>
                <td className="td text-xs text-ink-soft">{formatDateTime(o.createdAt)}</td>
                <td className="td font-semibold">{o.buyerName}</td>
                <td className="td text-ink-soft">{o.items.length}</td>
                <td className="td font-bold">{peso(o.total)}</td>
                <td className="td"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {data.recentOrders.length === 0 && (
              <tr><td colSpan={6} className="td py-8 text-center text-ink-soft">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-cream-200 px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold">Low-stock listings platform-wide</h2>
        </div>
        {data.lowStock.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-soft">Every active listing is well stocked.</p>
        ) : (
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {data.lowStock.map((p: any) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-cream-100 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-ink-faint">{p.town}</p>
                </div>
                <span className={`badge ${p.stock === 0 ? "bg-red-100 text-red-800 border-red-200" : "bg-harvest-100 text-harvest-800 border-harvest-200"}`}>
                  {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-cream-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-cream-200" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-cream-200" />
    </div>
  );
}
