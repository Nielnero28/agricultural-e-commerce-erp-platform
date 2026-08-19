"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TOWNS } from "@/lib/utils";
import { SproutIcon, StoreIcon, UsersIcon } from "@/components/icons";

type Role = "buyer" | "vendor" | "cooperative";

const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "buyer", label: "Buyer", desc: "I want to buy farm produce", icon: <StoreIcon size={18} /> },
  { value: "vendor", label: "Farm vendor", desc: "I sell my own produce", icon: <SproutIcon size={18} /> },
  { value: "cooperative", label: "Cooperative", desc: "We run a registered coop", icon: <UsersIcon size={18} /> },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("cooperative");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    coopName: "",
    town: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", role, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.push(role === "buyer" ? "/market" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.16em] text-harvest-600 uppercase">Join the platform</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-leaf-900 sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Farmers, vendors, and cooperatives across the selected towns of Zambales.
        </p>
      </div>

      <div className="card mt-8 p-7">
        <form onSubmit={submit} className="grid gap-5">
          <div>
            <span className="label">I am registering as</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setRole(o.value)}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    role === o.value
                      ? "border-leaf-600 bg-leaf-50 ring-2 ring-leaf-500/30"
                      : "border-cream-300 bg-white hover:border-leaf-300"
                  }`}
                >
                  <span className={`flex size-9 items-center justify-center rounded-lg ${role === o.value ? "bg-leaf-700 text-cream-50" : "bg-cream-100 text-ink-soft"}`}>
                    {o.icon}
                  </span>
                  <span className="mt-2 block text-sm font-bold">{o.label}</span>
                  <span className="block text-xs text-ink-faint">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {role === "cooperative" && (
            <div>
              <label className="label" htmlFor="rg-coop">Cooperative name (as registered with DTI/PCO)</label>
              <input
                id="rg-coop"
                className="input"
                value={form.coopName}
                onChange={(e) => setForm({ ...form, coopName: e.target.value })}
                placeholder="e.g. Banagan Corn Growers Cooperative"
                required
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="rg-name">Full name</label>
              <input id="rg-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
            </div>
            <div>
              <label className="label" htmlFor="rg-email">Email</label>
              <input id="rg-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label" htmlFor="rg-town">Town / municipality</label>
              <select id="rg-town" className="input" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} required>
                <option value="">Select town</option>
                {TOWNS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rg-phone">Mobile</label>
              <input id="rg-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0917 555 0123" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="rg-pass">Password</label>
            <input
              id="rg-pass"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full py-3!">
            {busy ? "Creating account…" : "Create account"}
          </button>
          <p className="text-center text-sm text-ink-soft">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-leaf-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
