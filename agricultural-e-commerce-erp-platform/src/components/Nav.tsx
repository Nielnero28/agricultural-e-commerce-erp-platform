"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { ROLE_META } from "@/lib/utils";
import { LeafIcon, LogoutIcon } from "@/components/icons";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-leaf-700 text-cream-50">
        <LeafIcon size={20} />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight text-leaf-900">
          AgriZambales
        </span>
        {!compact && (
          <span className="block text-[10px] font-bold tracking-[0.14em] text-ink-faint uppercase">
            Farm-gate commerce · ERP
          </span>
        )}
      </span>
    </Link>
  );
}

export default function Nav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const links = [
    { href: "/market", label: "Market" },
    { href: "/orders", label: "My Orders" },
    ...(user && user.role !== "buyer" ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  const isActive = (href: string) =>
    href === "/market" ? pathname.startsWith("/market") : pathname.startsWith(href);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive(l.href)
                  ? "bg-leaf-100 text-leaf-900"
                  : "text-ink-soft hover:bg-cream-100 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-full border border-cream-300 bg-white py-1 pr-3 pl-1 md:flex">
                <span className="flex size-7 items-center justify-center rounded-full bg-leaf-700 text-xs font-bold text-cream-50">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm font-semibold">{user.name.split(" ")[0]}</span>
                <span className={`badge ${ROLE_META[user.role]?.className ?? ""}`}>
                  {ROLE_META[user.role]?.label ?? user.role}
                </span>
              </span>
              <button onClick={signOut} disabled={signingOut} className="btn-outline px-3! py-2!">
                <LogoutIcon size={16} />
                <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3! py-2!">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary px-4! py-2!">
                Sell with us
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-cream-200 px-4 py-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
              isActive(l.href) ? "bg-leaf-100 text-leaf-900" : "text-ink-soft"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
