import { getCategories } from "@/service/getCategory";
import { getMenuItems } from "@/service/getMenuItem";
import MenuContent from "./MenuContent.client";
import { IMenuCategory, IMenuItem } from "@/types/menu";

export default async function MenuContainer() {
	const [categories, menuItems] = await Promise.all([
		getCategories(),
		getMenuItems(),
	]);

	return <MenuContent categories={categories} menuItems={menuItems} />;
}
