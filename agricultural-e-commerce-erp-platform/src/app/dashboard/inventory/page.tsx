"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, TOWNS, UNITS, peso, formatDateTime } from "@/lib/utils";
import {
  BoxIcon,
  CheckIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
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
  status: string;
  featured: boolean;
  cooperativeName: string | null;
  vendorName: string | null;
};

type Movement = {
  id: number;
  productId: number;
  productName: string;
  type: string;
  delta: number;
  note: string | null;
  createdAt: string;
};

const EMPTY = {
  name: "",
  category: CATEGORIES[0],
  pricePerUnit: "",
  unit: "kg",
  stock: "0",
  town: TOWNS[0],
  imageUrl: "",
  description: "",
  featured: false,
  status: "active",
};

const MOVE_META: Record<string, string> = {
  restock: "bg-leaf-100 text-leaf-800 border-leaf-200",
  sale: "bg-sky-100 text-sky-800 border-sky-200",
  adjustment: "bg-harvest-100 text-harvest-800 border-harvest-200",
  return: "bg-cream-200 text-ink border-cream-300",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, m] = await Promise.all([
      fetch("/api/products?mine=1").then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ]);
    setProducts(p.products ?? []);
    setMovements(m.movements ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setForm(EMPTY);
    setError("");
    setEditing("new");
  }
  function openEdit(p: Product) {
    setForm({
      name: p.name,
      category: p.category,
      pricePerUnit: String(p.pricePerUnit),
      unit: p.unit,
      stock: String(p.stock),
      town: p.town,
      imageUrl: p.imageUrl ?? "",
      description: p.description ?? "",
      featured: p.featured,
      status: p.status,
    });
    setError("");
    setEditing(p);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        category: form.category,
        pricePerUnit: Number(form.pricePerUnit),
        unit: form.unit,
        stock: Number(form.stock),
        town: form.town,
        imageUrl: form.imageUrl,
        description: form.description,
        featured: form.featured,
        status: form.status,
      };
      const res =
        editing === "new"
          ? await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/products/${(editing as Product).id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save the product.");
        return;
      }
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjusting) return;
    const delta = Number(adjQty);
    if (!delta || !Number.isFinite(delta)) {
      setError("Enter a non-zero quantity (use a negative number to remove stock).");
      return;
    }
    setError("");
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: adjusting.id, delta, note: adjNote }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update stock.");
      return;
    }
    setAdjusting(null);
    setAdjQty("");
    setAdjNote("");
    await load();
  }

  async function removeProduct(p: Product) {
    if (confirmDelete !== p.id) {
      setConfirmDelete(p.id);
      setTimeout(() => setConfirmDelete((c) => (c === p.id ? null : c)), 3000);
      return;
    }
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-leaf-900">Inventory</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {products.length} product{products.length === 1 ? "" : "s"} · every sale, restock, and adjustment is logged below.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon size={16} /> Add product
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-cream-50">
            <tr>
              <th className="th">Product</th>
              <th className="th">Town</th>
              <th className="th">Price</th>
              <th className="th">Stock</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {loading && (
              <tr><td colSpan={6} className="td py-10 text-center text-ink-faint">Loading inventory…</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-12 text-center">
                  <BoxIcon size={28} className="mx-auto text-ink-faint" />
                  <p className="mt-2 font-semibold text-ink-soft">No products yet.</p>
                  <button onClick={openNew} className="btn-primary mt-3">
                    <PlusIcon size={15} /> List your first product
                  </button>
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-cream-50/60">
                <td className="td">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-200">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <BoxIcon size={18} className="text-ink-faint" />}
                    </span>
                    <div>
                      <p className="font-bold">
                        {p.name}
                        {p.featured && <span className="badge ml-2 border-harvest-200 bg-harvest-100 text-harvest-800">Featured</span>}
                      </p>
                      <p className="text-xs text-ink-faint">{p.category}</p>
                    </div>
                  </div>
                </td>
                <td className="td text-ink-soft">{p.town}</td>
                <td className="td font-semibold">{peso(p.pricePerUnit)} <span className="text-xs font-medium text-ink-faint">/ {p.unit}</span></td>
                <td className="td">
                  <span className={`badge ${p.stock === 0 ? "border-red-200 bg-red-100 text-red-800" : p.stock <= 15 ? "border-harvest-200 bg-harvest-100 text-harvest-800" : "border-leaf-200 bg-leaf-100 text-leaf-800"}`}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td className="td">
                  <span className={`badge ${p.status === "active" ? "border-leaf-200 bg-leaf-50 text-leaf-800" : "border-cream-300 bg-cream-100 text-ink-soft"}`}>
                    {p.status === "active" ? "Listed" : "Hidden"}
                  </span>
                </td>
                <td className="td">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setAdjusting(p);
                        setAdjQty("");
                        setAdjNote("");
                        setError("");
                      }}
                      className="rounded-lg border border-cream-300 bg-white p-2 text-leaf-700 hover:border-leaf-400 hover:bg-leaf-50"
                      title="Adjust stock"
                    >
                      <CheckIcon size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg border border-cream-300 bg-white p-2 text-ink-soft hover:border-harvest-400 hover:bg-harvest-50"
                      title="Edit"
                    >
                      <PencilIcon size={15} />
                    </button>
                    <button
                      onClick={() => void removeProduct(p)}
                      className={`rounded-lg border p-2 ${
                        confirmDelete === p.id
                          ? "border-red-600 bg-red-700 text-white"
                          : "border-cream-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50"
                      }`}
                      title={confirmDelete === p.id ? "Click again to confirm" : "Delete"}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Movement log */}
      <div className="card overflow-hidden">
        <div className="border-b border-cream-200 px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold">Stock movement log</h2>
          <p className="text-xs text-ink-faint">Most recent 40 entries</p>
        </div>
        {movements.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-soft">No movements yet.</p>
        ) : (
          <ul className="divide-y divide-cream-100">
            {movements.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5">
                <span className={`badge ${MOVE_META[m.type] ?? MOVE_META.adjustment}`}>{m.type}</span>
                <span className="text-sm font-bold">{m.productName}</span>
                <span className={`text-sm font-bold ${m.delta >= 0 ? "text-leaf-700" : "text-red-700"}`}>
                  {m.delta >= 0 ? "+" : ""}{m.delta}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-faint">{m.note}</span>
                <span className="text-xs text-ink-faint">{formatDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add / edit modal */}
      {editing && (
        <Modal title={editing === "new" ? "Add a product" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={saveProduct} className="grid gap-4">
            <div>
              <label className="label" htmlFor="pf-name">Product name</label>
              <input id="pf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Yellow corn (for milling)" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="pf-cat">Category</label>
                <select id="pf-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pf-town">Town of origin</label>
                <select id="pf-town" className="input" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })}>
                  {TOWNS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pf-price">Price (₱)</label>
                <input id="pf-price" type="number" min="1" className="input" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="pf-unit">Unit</label>
                <select id="pf-unit" className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pf-stock">Stock on hand</label>
                <input id="pf-stock" type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="pf-status">Listing</label>
                <select id="pf-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Listed in market</option>
                  <option value="inactive">Hidden (keep records)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="pf-img">Image URL (optional)</label>
              <input id="pf-img" className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="label" htmlFor="pf-desc">Description (optional)</label>
              <textarea id="pf-desc" rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Grade, ripeness, packaging, delivery notes…" />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="size-4 accent-leaf-700" />
              Feature on the homepage
            </label>
            <ModalFooter onSave={saveProduct} saving={saving} onCancel={() => setEditing(null)} />
          </form>
        </Modal>
      )}

      {/* Adjust stock modal */}
      {adjusting && (
        <Modal title={`Adjust stock — ${adjusting.name}`} onClose={() => setAdjusting(null)}>
          <form onSubmit={submitAdjust} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-cream-100 px-4 py-3">
              <span className="text-sm font-semibold text-ink-soft">Current stock</span>
              <span className="font-display text-xl font-semibold text-leaf-800">
                {adjusting.stock} {adjusting.unit}
              </span>
            </div>
            <div>
              <label className="label" htmlFor="aj-qty">Quantity change (use − to remove)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAdjQty(String((Number(adjQty) || 0) - 1))} className="btn-outline px-3!"><MinusIcon size={14} /></button>
                <input id="aj-qty" type="number" className="input text-center font-bold" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} placeholder="e.g. 20 or -5" required />
                <button type="button" onClick={() => setAdjQty(String((Number(adjQty) || 0) + 1))} className="btn-outline px-3!"><PlusIcon size={14} /></button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="aj-note">Note</label>
              <input id="aj-note" className="input" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="e.g. New harvest delivery / spoiled lot removed" />
            </div>
            <ModalFooter onSave={submitAdjust} saving={false} onCancel={() => setAdjusting(null)} saveLabel="Record movement" />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- shared bits ---------- */

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="card relative max-h-[90vh] w-full max-w-xl overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-2!"><XIcon size={17} /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({
  onSave,
  saving,
  onCancel,
  saveLabel = "Save",
}: {
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2 border-t border-cream-200 pt-4">
      <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}
