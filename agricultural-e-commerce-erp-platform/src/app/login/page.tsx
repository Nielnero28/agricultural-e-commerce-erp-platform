"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Nav";
import { LeafIcon } from "@/components/icons";

const DEMO_ACCOUNTS = [
  { label: "Platform admin", email: "admin@agrizambales.gov.ph", password: "admin123" },
  { label: "Cooperative", email: "ops@banagancoop.ph", password: "demo123" },
  { label: "Farm vendor", email: "joel@malvarrasfarm.ph", password: "demo123" },
  { label: "Buyer", email: "buyer@demo.ph", password: "demo123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent, em = email, pw = password) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: em, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      router.push(data.user.role === "buyer" ? "/market" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="hidden lg:block">
        <Brand />
        <h1 className="mt-10 font-display text-4xl leading-tight font-semibold tracking-tight text-leaf-900">
          One sign-in for the market
          <br />
          and the back office.
        </h1>
        <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
          Cooperatives and vendors manage inventory, orders, finance, and suppliers.
          Buyers track their farm-gate orders.
        </p>
        <div className="card mt-8 max-w-md p-5">
          <p className="text-xs font-bold tracking-[0.14em] text-harvest-600 uppercase">Demo accounts</p>
          <p className="mt-1 text-xs text-ink-faint">Click a role to fill the form and sign in.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                disabled={busy}
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  void submit(undefined, d.email, d.password);
                }}
                className="rounded-lg border border-cream-300 bg-white px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:border-leaf-400 hover:bg-leaf-50 disabled:opacity-50"
              >
                {d.label}
                <span className="mt-0.5 block text-[11px] font-medium text-ink-faint">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-leaf-700 text-cream-50">
          <LeafIcon size={22} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-ink-soft">Welcome back to AgriZambales.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div>
            <label className="label" htmlFor="li-email">Email</label>
            <input id="li-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="li-pass">Password</label>
            <input id="li-pass" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full py-3!">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">
          No account yet?{" "}
          <Link href="/register" className="font-bold text-leaf-700 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
