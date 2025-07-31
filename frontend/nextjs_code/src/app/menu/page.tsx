import { fetchCategories, fetchMenuItems } from "@/service/menu";
import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuPageClient from "@/components/menu/MenuPageClient";

/**
 * MenuPage — Server Component
 * Fetches categories and items and passes them to the interactive UI.
 */
export default async function MenuPage() {
	const [categories, menuItems]: [IMenuCategory[], IMenuItem[]] =
		await Promise.all([fetchCategories(), fetchMenuItems()]);

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl text-center font-bold mb-8">Cafe Chino Menu</h1>
			<MenuPageClient categories={categories} items={menuItems} />
		</main>
	);
}
