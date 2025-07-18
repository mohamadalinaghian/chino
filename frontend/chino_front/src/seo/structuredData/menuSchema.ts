import { IMenuCategory, IMenuItem } from "@/types/menu";

export function generateMenuSchema(
  categories: IMenuCategory[],
  items: IMenuItem[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "منوی کافه چینو",
    hasMenuSection: categories.map((cat) => ({
      "@type": "MenuSection",
      name: cat.title,
      hasMenuItem: items
        .filter((item) => item.category.title === cat.title)
        .map((item) => ({
          "@type": "MenuItem",
          name: item.title,
          description: item.description,
          offers: {
            "@type": "Offer",
            priceCurrency: "IRR",
            price: item.price,
          },
        })),
    })),
  };
}
