import { IMenuItem } from "@/types/menu";

export function filterMenuItems(
  items: IMenuItem[],
  query: string,
): IMenuItem[] {
  if (!query) return items;

  return items.filter((item) => {
    const nameMatch = item.title.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query);
    const priceMatch = item.price?.toString().includes(query);
    return nameMatch || descMatch || priceMatch;
  });
}
