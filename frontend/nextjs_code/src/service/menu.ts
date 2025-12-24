import { IMenuCategory, IMenuItem } from "@/types/menu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
const REVALIDATE = Number(process.env.NEXT_FETCH_REVALIDATE) || 86400;

export async function fetchCategories(): Promise<IMenuCategory[]> {
  const res = await fetch(`${API_BASE}/menu/categories/`, {
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchMenuItems(): Promise<IMenuItem[]> {
  try {
    const res = await fetch(`${API_BASE}/menu/items/`, {
      next: { revalidate: REVALIDATE },
    });

    console.log("fetchMenuItems → res:", res.status, res.url);

    if (!res.ok) {
      const t = await res.text();
      console.error("fetchMenuItems → error:", t);
      throw new Error("Failed to fetch menu items");
    }

    return res.json();
  } catch (err) {
    console.error("fetchMenuItems → catch:", err);
    throw err;
  }
}
