// در page.tsx
import { fetchCategories, fetchMenuItems } from "@/service/menu";
import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuPageClient from "@/components/menu/MenuPageClient";

export const dynamic = "auto"; // یا 'force-dynamic' اگر میخواهید همیشه SSR شود
export const revalidate = 3600; // ISR: هر 1 ساعت rebuild شود

export default async function MenuPage() {
	let categories: IMenuCategory[] = [];
	let menuItems: IMenuItem[] = [];

	try {
		[categories, menuItems] = await Promise.all([
			fetchCategories().catch(() => []),
			fetchMenuItems().catch(() => []),
		]);
	} catch (error) {
		console.error("Error fetching menu data:", error);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl text-center font-bold mb-8">Cafe Chino Menu</h1>
			<MenuPageClient categories={categories} items={menuItems} />
		</main>
	);
}
