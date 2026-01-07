import { SS_API_URL } from "@/libs/constants";
import { IMenuCategory, IMenuItem } from "@/types/menu";

export async function fetchCategories(): Promise<IMenuCategory[]> {
  const res = await fetch(`${SS_API_URL}/menu/categories/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch categories (${res.status})`);
  }

  return res.json();
}

export async function fetchMenuItems(): Promise<IMenuItem[]> {
  const res = await fetch(`${SS_API_URL}/menu/items/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch menu items (${res.status})`);
  }

  return res.json();
}
