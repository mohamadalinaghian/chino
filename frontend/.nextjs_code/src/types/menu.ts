export interface IMenuItem {
	title: string;
	price: number;
	description: string;
	thumbnail?: string;
	category: {
		title: string;
	};
}

export interface IMenuCategory {
	title: string;
	description?: string;
}
