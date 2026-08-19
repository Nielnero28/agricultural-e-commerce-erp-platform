"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { peso, formatDate } from "@/lib/utils";
import { PlusIcon, TrashIcon, TrendUpIcon, WalletIcon } from "@/components/icons";
import { Modal, ModalFooter } from "@/app/dashboard/inventory/page";

type Tx = {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string | null;
  txDate: string | null;
  createdAt: string;
  sourceName: string | null;
};

const INCOME_CATS = ["Sales", "Service income", "Other income"];
const EXPENSE_CATS = ["Fertilizer & seed", "Packaging", "Fuel & transport", "Wages & labor", "Equipment", "Other expense"];

const EMPTY = { type: "expense" as "income" | "expense", category: EXPENSE_CATS[0], amount: "", date: new Date().toISOString().slice(0, 10), note: "" };

export default function FinancePage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/finance");
    const data = await res.json();
    setTxs(data.transactions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const monthKey = new Date().toISOString().slice(0, 7);
  const { incomeMonth, expenseMonth } = useMemo(() => {
    let incomeMonth = 0;
    let expenseMonth = 0;
    for (const t of txs) {
      if (t.txDate?.startsWith(monthKey)) {
        if (t.type === "income") incomeMonth += t.amount;
        else expenseMonth += t.amount;
      }
    }
    return { incomeMonth, expenseMonth };
  }, [txs, monthKey]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not record the transaction.");
        return;
      }
      setModal(false);
      setForm(EMPTY);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: Tx) {
    if (confirmDelete !== t.id) {
      setConfirmDelete(t.id);
      setTimeout(() => setConfirmDelete((c) => (c === t.id ? null : c)), 3000);
      return;
    }
    await fetch(`/api/finance/${t.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await load();
  }

  const cats = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-leaf-900">Finance</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Sales income posts automatically when orders complete. Record expenses as they
            happen to keep the books audit-ready.
          </p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) }); setModal(true); }} className="btn-primary">
          <PlusIcon size={16} /> Record transaction
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-ink-soft uppercase">
            <span className="flex size-7 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700"><TrendUpIcon size={14} /></span>
            Income this month
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-leaf-700">{peso(incomeMonth)}</p>
        </div>
        <div className="card p-4">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-ink-soft uppercase">
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-700"><WalletIcon size={14} /></span>
            Expenses this month
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-red-700">{peso(expenseMonth)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">Net this month</p>
          <p className={`mt-2 font-display text-2xl font-semibold ${incomeMonth - expenseMonth >= 0 ? "text-leaf-700" : "text-red-700"}`}>
            {peso(incomeMonth - expenseMonth)}
          </p>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-cream-50">
            <tr>
              <th className="th">Date</th>
              <th className="th">Category</th>
              {txs.length > 0 && txs[0].sourceName && <th className="th">Organization</th>}
              <th className="th">Note</th>
              <th className="th text-right">Amount</th>
              <th className="th text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {loading && <tr><td colSpan={6} className="td py-10 text-center text-ink-faint">Loading ledger…</td></tr>}
            {!loading && txs.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-12 text-center">
                  <p className="font-semibold text-ink-soft">The ledger is empty.</p>
                  <p className="mt-1 text-sm text-ink-faint">Completed orders and recorded expenses will appear here.</p>
                </td>
              </tr>
            )}
            {txs.map((t) => (
              <tr key={t.id} className="hover:bg-cream-50/60">
                <td className="td whitespace-nowrap text-ink-soft">{t.txDate ? formatDate(t.txDate) : "—"}</td>
                <td className="td">
                  <span className={`badge ${t.type === "income" ? "border-leaf-200 bg-leaf-100 text-leaf-800" : "border-red-200 bg-red-100 text-red-800"}`}>
                    {t.category}
                  </span>
                </td>
                {txs[0].sourceName && <td className="td text-ink-soft">{t.sourceName}</td>}
                <td className="td max-w-60 truncate text-ink-faint">{t.note ?? "—"}</td>
                <td className={`td text-right font-bold ${t.type === "income" ? "text-leaf-700" : "text-red-700"}`}>
                  {t.type === "income" ? "+" : "−"}{peso(t.amount)}
                </td>
                <td className="td text-right">
                  <button
                    onClick={() => void remove(t)}
                    className={`rounded-lg border p-2 ${
                      confirmDelete === t.id
                        ? "border-red-600 bg-red-700 text-white"
                        : "border-cream-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50"
                    }`}
                    title={confirmDelete === t.id ? "Click again to confirm" : "Delete entry"}
                  >
                    <TrashIcon size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Record a transaction" onClose={() => setModal(false)}>
          <form onSubmit={add} className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t, category: (t === "income" ? INCOME_CATS : EXPENSE_CATS)[0] })}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-bold capitalize ${
                    form.type === t
                      ? t === "income"
                        ? "border-leaf-600 bg-leaf-50 text-leaf-800 ring-2 ring-leaf-500/30"
                        : "border-red-400 bg-red-50 text-red-800 ring-2 ring-red-400/30"
                      : "border-cream-300 bg-white text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="fn-cat">Category</label>
                <select
                  id="fn-cat"
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {cats.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="fn-date">Date</label>
                <input id="fn-date" type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="fn-amt">Amount (₱)</label>
              <input id="fn-amt" type="number" min="1" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required />
            </div>
            <div>
              <label className="label" htmlFor="fn-note">Note</label>
              <input id="fn-note" className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Diesel for the tricycle delivery" />
            </div>
            <ModalFooter onSave={add} saving={saving} onCancel={() => setModal(false)} saveLabel="Add to ledger" />
          </form>
        </Modal>
      )}
    </div>
  );
}
