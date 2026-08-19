import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import Nav, { Brand } from "@/components/Nav";
import { TOWNS } from "@/lib/utils";
import Link from "next/link";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "AgriZambales — Agricultural E-Commerce & ERP for Zambales Cooperatives",
  description:
    "An integrated agricultural e-commerce and enterprise resource planning platform for cooperatives and local agricultural vendors in the selected towns of Zambales.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Nav user={user} />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-cream-200 bg-leaf-900 text-cream-100">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-cream-50/10 text-harvest-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
                </span>
                <span className="font-display text-lg font-semibold">AgriZambales</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-100/70">
                An integrated agricultural e-commerce and enterprise resource planning
                platform for cooperatives and local agricultural vendors in the selected
                towns of Zambales — from farm-gate listing to order pipeline, stock,
                and the books.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-[0.16em] text-harvest-300 uppercase">Platform</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link className="hover:text-harvest-300" href="/market">Produce market</Link></li>
                <li><Link className="hover:text-harvest-300" href="/orders">Track an order</Link></li>
                <li><Link className="hover:text-harvest-300" href="/dashboard">Vendor &amp; cooperative dashboard</Link></li>
                <li><Link className="hover:text-harvest-300" href="/register">Register your cooperative</Link></li>
                <li><Link className="hover:text-harvest-300" href="/login">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-[0.16em] text-harvest-300 uppercase">
                Selected towns covered
              </h4>
              <div className="mt-4 flex max-w-sm flex-wrap gap-1.5">
                {TOWNS.map((t) => (
                  <span key={t} className="rounded-full bg-cream-50/10 px-2.5 py-1 text-xs font-medium text-cream-100/80">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-cream-50/10">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-cream-100/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>© {new Date().getFullYear()} AgriZambales · Provincial agri-commerce initiative, Zambales</span>
              <span>Prices in Philippine pesos (₱) · Payment on delivery or at the coop gate</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
