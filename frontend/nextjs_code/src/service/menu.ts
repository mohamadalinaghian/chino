import { IMenuCategory, IMenuItem} from "@/types/menu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
const REVALIDATE = Number(process.env.NEXT_FETCH_REVALIDATE) || 86400;

export async function fetchCategories(): Promise<IMenuCategory[]> {
	const res = await fetch(`${API_BASE}/api/menu/category/`, {
		next: { revalidate: REVALIDATE },
	});
	if (!res.ok) throw new Error("Failed to fetch categories");
	return res.json();
}

export async function fetchMenuItems(): Promise<IMenuItem[]> {
	const res = await fetch(`${API_BASE}/api/menu/item/`, {
		next: { revalidate: REVALIDATE },
	});
	if (!res.ok) throw new Error("Failed to fetch menu items");
	return res.json();
}
