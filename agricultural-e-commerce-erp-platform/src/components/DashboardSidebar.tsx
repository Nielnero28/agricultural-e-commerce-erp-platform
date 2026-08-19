"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { orgLabel, ROLE_META } from "@/lib/utils";
import { Brand } from "@/components/Nav";
import {
  BoxIcon,
  ChartIcon,
  LogoutIcon,
  ReceiptIcon,
  StoreIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/icons";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: <ChartIcon size={17} />, exact: true },
  { href: "/dashboard/inventory", label: "Inventory", icon: <BoxIcon size={17} /> },
  { href: "/dashboard/orders", label: "Orders", icon: <ReceiptIcon size={17} /> },
  { href: "/dashboard/finance", label: "Finance", icon: <WalletIcon size={17} /> },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: <TruckIcon size={17} /> },
];

export default function DashboardSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7.5rem)] w-60 shrink-0 flex-col lg:flex">
      <div className="card flex-1 overflow-hidden p-4">
        <Brand compact />
        <div className="mt-4 rounded-lg border border-leaf-200 bg-leaf-50 px-3 py-2.5">
          <p className="truncate text-sm font-bold text-leaf-900">{orgLabel(user)}</p>
          <span className={`badge mt-1 ${ROLE_META[user.role]?.className ?? ""}`}>
            {ROLE_META[user.role]?.label ?? user.role}
          </span>
        </div>
        <nav className="mt-4 space-y-1">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-leaf-700 text-cream-50" : "text-ink-soft hover:bg-cream-100 hover:text-ink"
                }`}
              >
                {l.icon}
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="card mt-3 p-3">
        <Link href="/market" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-100 hover:text-ink">
          <StoreIcon size={17} /> View market
        </Link>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-100 hover:text-ink disabled:opacity-50"
        >
          <LogoutIcon size={17} /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      {/* Mobile tab bar */}
      <nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap ${
                active ? "bg-leaf-700 text-cream-50" : "bg-white text-ink-soft border border-cream-200"
              }`}
            >
              {l.icon}
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
