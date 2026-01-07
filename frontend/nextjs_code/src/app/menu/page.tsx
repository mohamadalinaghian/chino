export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchCategories, fetchMenuItems } from "@/service/menu";
import MenuPageClient from "@/components/menu/MenuPageClient";

export default async function MenuPage() {
  const [categories, menuItems] = await Promise.all([
    fetchCategories(),
    fetchMenuItems(),
  ]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl text-center font-bold mb-8">
        Cafe Chino Menu
      </h1>
      <MenuPageClient categories={categories} items={menuItems} />
    </main>
  );
}
