import { IMenuCategory, IMenuItem } from "@/types/menu";
export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const REVALIDATE = process.env.NEXT_FETCH_REVALIDATE
  ? parseInt(process.env.NEXT_FETCH_REVALIDATE)
  : undefined;
export async function getMenuCategories(): Promise<IMenuCategory[]> {
  const res = await fetch(`${API_BASE}/menu/category/`, {
    next: { revalidate: REVALIDATE },
  });

  if (!res.ok) {
    console.error("خطا در گرفتن دسته‌بندی‌ها");
    return [];
  }

  return await res.json();
}

export async function getMenuItems(): Promise<IMenuItem[]> {
  const res = await fetch(`${API_BASE}/menu/item/`, {
    next: { revalidate: REVALIDATE },
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
