import { NextResponse } from "next/server";
import { readDeals } from "@/lib/store";
import type { Deal } from "@/types/deal";

type SortKey = "newest" | "rating" | "students" | "price" | "updated";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const provider = searchParams.get("provider") ?? undefined;
  const sort = (searchParams.get("sort") ?? "updated") as SortKey | undefined;
  const freeOnlyParam = searchParams.get("freeOnly") ?? undefined;
  const freeOnly = freeOnlyParam === "1" || freeOnlyParam === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 12)));

  const all = await readDeals();
  let list = filterList(all, { q, category, provider, freeOnly });
  list = sortList(list, sort);
  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return NextResponse.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

function filterList(all: Deal[], opts: { q?: string; category?: string; provider?: string; freeOnly?: boolean }) {
  const term = opts.q?.trim().toLowerCase();
  const cat = opts.category?.trim().toLowerCase();
  const prov = opts.provider?.trim().toLowerCase();
  return all.filter((d) => {
    const okTerm = !term
      ? true
      : d.title.toLowerCase().includes(term) ||
        d.provider.toLowerCase().includes(term) ||
        (d.category ?? "").toLowerCase().includes(term);
    const okCat = !cat ? true : (d.category ?? "").toLowerCase() === cat;
    const okProv = !prov ? true : d.provider.toLowerCase() === prov;
    const okFree = opts.freeOnly ? (d.price ?? 0) === 0 : true;
    return okTerm && okCat && okProv && okFree;
  });
}

function sortList(items: Deal[], sort?: SortKey): Deal[] {
  switch (sort) {
    case "updated":
      return [...items].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    case "rating":
      return [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "students":
      return [...items].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
    case "price":
      return [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "newest":
    default:
      return [...items].sort((a, b) => new Date(b.expiresAt ?? 0).getTime() - new Date(a.expiresAt ?? 0).getTime());
  }
}
