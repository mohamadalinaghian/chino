export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Cafe Chino Menu | Coffee & Food",
  description:
    "Browse Cafe Chino’s full menu of coffee, drinks, and freshly prepared food.",
};

import { fetchCategories, fetchMenuItems } from "@/service/menu";
import MenuPageClient from "@/components/menu/MenuPageClient";

export default async function MenuPage() {
  const [categories, menuItems] = await Promise.all([
    fetchCategories(),
    fetchMenuItems(),
  ]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">
        Cafe Chino Menu
      </h1>

      {categories.length === 0 && menuItems.length === 0 ? (
        <p className="text-center opacity-70">
          Menu is temporarily unavailable.
        </p>
      ) : (
        <MenuPageClient categories={categories} items={menuItems} />
      )}
    </main>
  );
}
