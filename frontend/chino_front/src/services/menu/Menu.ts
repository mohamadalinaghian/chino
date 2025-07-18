import { IMenuCategory, IMenuItem } from "@/types/menu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getMenuCategories(): Promise<IMenuCategory[]> {
  const res = await fetch(`${API_BASE}/menu/category/`);
  if (!res.ok) throw new Error("خطا در گرفتن دسته‌بندی‌ها");
  return await res.json();
}

export async function getMenuItems(): Promise<IMenuItem[]> {
  const res = await fetch(`${API_BASE}/menu/item/`);
  if (!res.ok) throw new Error("خطا در گرفتن آیتم‌ها");
  return await res.json();
}

export async function getMenuData(): Promise<{
  categories: IMenuCategory[];
  items: IMenuItem[];
}> {
  const MIN_LOADING_MS = 1200;
  const start = Date.now();

  const [categories, items] = await Promise.all([
    getMenuCategories(),
    getMenuItems(),
  ]);

  const elapsed = Date.now() - start;
  if (elapsed < MIN_LOADING_MS && process.env.NODE_ENV === "production") {
    await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
  }

  return { categories, items };
}
