export const TOWNS = [
  "Anao",
  "Arayat",
  "Balanga",
  "Bolmon",
  "Cabanlanan",
  "Calasiao",
  "Castigliano",
  "Cullyo",
  "Divilacs",
  "Don Manuel",
  "El Nido",
  "Iba",
  "Masinloc",
  "Masinoc",
  "Palauhinog",
  "San Antonio",
  "San Isidro",
  "San Rafael",
  "Sluice",
  "Wawa",
];

export const CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Grains",
  "Root Crops",
  "Coconut Products",
  "Processed Goods",
];

export const UNITS = ["kg", "pc", "bunch", "dozen", "sack (50 kg)", "box", "jar", "case"];

export function peso(amount: number): string {
  return "₱" + Math.round(amount).toLocaleString("en-PH");
}

export function pesoExact(amount: number): string {
  return (
    "₱" +
    amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  processing: { label: "Processing", className: "bg-harvest-100 text-harvest-800 border-harvest-300" },
  confirmed: { label: "Confirmed", className: "bg-sky-100 text-sky-800 border-sky-300" },
  completed: { label: "Completed", className: "bg-leaf-100 text-leaf-800 border-leaf-300" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-300" },
};

export const ROLE_META: Record<string, { label: string; className: string }> = {
  admin: { label: "Platform Admin", className: "bg-ink text-cream-100" },
  cooperative: { label: "Cooperative", className: "bg-leaf-100 text-leaf-800" },
  vendor: { label: "Farm Vendor", className: "bg-harvest-100 text-harvest-800" },
  buyer: { label: "Buyer", className: "bg-cream-200 text-ink" },
};

export function orgLabel(
  user: { name: string; role: string; cooperativeName?: string | null } | null | undefined
): string {
  if (!user) return "Guest";
  if (user.role === "cooperative" && user.cooperativeName) return user.cooperativeName;
  return user.name;
}
