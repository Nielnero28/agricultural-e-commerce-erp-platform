"use client";

import { useCallback, useEffect, useState } from "react";
import { TOWNS } from "@/lib/utils";
import { PhoneIcon, PlusIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { Modal, ModalFooter } from "@/app/dashboard/inventory/page";

type Supplier = {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  supplies: string | null;
  town: string | null;
  ownerName: string | null;
};

const EMPTY = { name: "", contactPerson: "", phone: "", supplies: "", town: TOWNS[0] };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data.suppliers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add the supplier.");
        return;
      }
      setModal(false);
      setForm(EMPTY);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Supplier) {
    if (confirmDelete !== s.id) {
      setConfirmDelete(s.id);
      setTimeout(() => setConfirmDelete((c) => (c === s.id ? null : c)), 3000);
      return;
    }
    await fetch(`/api/suppliers?id=${s.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-leaf-900">Suppliers</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Your source for seed, fertilizer, and packaging — with whom to call when the
            delivery is two days out.
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY); setError(""); setModal(true); }} className="btn-primary">
          <PlusIcon size={16} /> Add supplier
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {loading && <p className="text-sm text-ink-faint md:col-span-2">Loading suppliers…</p>}
        {!loading && suppliers.length === 0 && (
          <div className="card flex flex-col items-center px-6 py-14 text-center md:col-span-2">
            <TruckIcon size={30} className="text-ink-faint" />
            <h3 className="mt-3 font-display text-xl font-semibold">No suppliers yet</h3>
            <p className="mt-1 max-w-sm text-sm text-ink-soft">
              Add the agri-input dealers and service providers you work with.
            </p>
          </div>
        )}
        {suppliers.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-semibold">{s.name}</h3>
                <p className="text-sm text-ink-soft">
                  {s.supplies ? `${s.supplies} · ` : ""}
                  {s.town ?? "Zambales"}
                </p>
              </div>
              <button
                onClick={() => void remove(s)}
                className={`rounded-lg border p-2 ${
                  confirmDelete === s.id
                    ? "border-red-600 bg-red-700 text-white"
                    : "border-cream-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50"
                }`}
                title={confirmDelete === s.id ? "Click again to confirm" : "Remove"}
              >
                <TrashIcon size={14} />
              </button>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {s.contactPerson && <p className="font-semibold text-ink-soft">Contact: {s.contactPerson}</p>}
              {s.phone && (
                <p className="flex items-center gap-1.5 text-ink-soft">
                  <PhoneIcon size={14} className="text-ink-faint" /> {s.phone}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Add a supplier" onClose={() => setModal(false)}>
          <form onSubmit={add} className="grid gap-4">
            <div>
              <label className="label" htmlFor="sp-name">Supplier / business name</label>
              <input id="sp-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Zambales Agro-Inputs Inc." required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="sp-contact">Contact person</label>
                <input id="sp-contact" className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="sp-phone">Phone</label>
                <input id="sp-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="sp-town">Town</label>
                <select id="sp-town" className="input" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })}>
                  {TOWNS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="sp-supplies">Supplies</label>
              <input id="sp-supplies" className="input" value={form.supplies} onChange={(e) => setForm({ ...form, supplies: e.target.value })} placeholder="e.g. Urea, NPK, corn seed, sacks" />
            </div>
            <ModalFooter onSave={add} saving={saving} onCancel={() => setModal(false)} saveLabel="Add supplier" />
          </form>
        </Modal>
      )}
    </div>
  );
}
