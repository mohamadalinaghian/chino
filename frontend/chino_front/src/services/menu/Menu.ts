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

    await new Promise((resolve) => setTimeout(resolve, 2000)); // 👈 تست loading

  const [categories, items] = await Promise.all([
    getMenuCategories(),
    getMenuItems(),
  ]);

  return { categories, items };
}
