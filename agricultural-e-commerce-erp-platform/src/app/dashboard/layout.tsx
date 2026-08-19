import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardSidebar from "@/components/DashboardSidebar";
import { AlertIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role === "buyer") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-harvest-100 text-harvest-600">
          <AlertIcon size={24} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold text-leaf-900">
          The dashboard is for sellers
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Inventory, orders, finance, and suppliers are managed by cooperatives and farm
          vendors. As a buyer, you can browse the market and track your orders instead.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/market" className="btn-primary">Browse the market</Link>
          <Link href="/orders" className="btn-outline">My orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] gap-8 px-4 py-8 sm:px-6">
      <DashboardSidebar
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          cooperativeId: user.cooperativeId,
          cooperativeName: user.cooperativeName,
          town: user.town,
          phone: user.phone,
        }}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
