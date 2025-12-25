import { REVALIDATE, SS_API_URL } from "@/libs/constants";
import { IMenuCategory, IMenuItem } from "@/types/menu";

export async function fetchCategories(): Promise<IMenuCategory[]> {
  const res = await fetch(`${SS_API_URL}/menu/categories/`, {
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchMenuItems(): Promise<IMenuItem[]> {
  try {
    const res = await fetch(`${SS_API_URL}/menu/items/`, {
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
