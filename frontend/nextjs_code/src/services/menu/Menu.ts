import { IMenuCategory, IMenuItem } from "@/types/menu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getMenuCategories(): Promise<IMenuCategory[]> {
  const res = await fetch(`${API_BASE}/menu/category/`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.error("خطا در گرفتن دسته‌بندی‌ها");
    return [];
  }

  return await res.json();
}

export async function getMenuItems(): Promise<IMenuItem[]> {
  const res = await fetch(`${API_BASE}/menu/item/`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.error("خطا در گرفتن آیتم‌ها");
    return [];
  }

  return await res.json();
}

export async function getMenuData(): Promise<{
  categories: IMenuCategory[];
  items: IMenuItem[];
}> {
  const [categories, items] = await Promise.all([
    getMenuCategories(),
    getMenuItems(),
  ]);

  return { categories, items };
}
