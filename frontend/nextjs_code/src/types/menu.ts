export interface IMenuCategory {
	title: string;
	description?: string | null;
}

export interface IMenuItem {
	title: string;
	price?: number;
	description?: string | null;
	thumbnail?: string | null;
	images?: string[];
	category: IMenuCategory;
}
