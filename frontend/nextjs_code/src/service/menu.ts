import { SS_API_URL } from "@/libs/constants";
import { IMenuCategory, IMenuItem } from "@/types/menu";

async function safeFetch<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Menu fetch failed:", res.status, url);
      return [];
    }

    return await res.json();
  } catch (err) {
    console.error("Menu fetch exception:", url, err);
    return [];
  }
}

export function fetchCategories(): Promise<IMenuCategory[]> {
  return safeFetch(`${SS_API_URL}/menu/categories/`);
}

export function fetchMenuItems(): Promise<IMenuItem[]> {
  return safeFetch(`${SS_API_URL}/menu/items/`);
}
