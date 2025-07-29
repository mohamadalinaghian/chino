import { IMenuItem } from "../types/menu";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const REVALIDATE = process.env.NEXT_FETCH_REVALIDATE;

export async function getMenuItems(): Promise<IMenuItem[]> {
	const response = await fetch(`${API_BASE_URL}/api/menu/item/`, {
		next: { revalidate: REVALIDATE },
	});

	if (!response.ok) {
		throw new Error("Failed to fetch menu items");
	}

	return response.json();
}
