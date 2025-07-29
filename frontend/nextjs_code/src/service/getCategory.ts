import { IMenuCategory } from "../types/menu";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const REVALIDATE = process.env.NEXT_FETCH_REVALIDATE;

export async function getCategories(): Promise<IMenuCategory[]> {
	const response = await fetch(`${API_BASE_URL}/api/menu/category/`, {
		next: { revalidate: REVALIDATE },
	});

	if (!response.ok) {
		throw new Error("Failed to fetch categories");
	}

	return response.json();
}
