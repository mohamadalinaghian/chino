export interface IMenuCategory {
  title: string;
  description?: string | null;
}

export interface IMenuItem {
  name: string;
  price?: number | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: string[];
  category: IMenuCategory;
}

export interface IMenuItemSale {
  id: number;
  name: string
  price: number
}

export interface IMenuCategorySale {
  category: string
  items: IMenuItemSale[]
}
