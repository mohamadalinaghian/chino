import { IMenuCategory, IMenuItem } from "@/types/menu";

export function generateMenuSchema(
  categories: IMenuCategory[],
  items: IMenuItem[],
) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.title,
      hasMenuItem: items
        .filter((item) => item.category.title === category.title)
        .map((item) => ({
          "@type": "MenuItem",
          name: item.title,
          description: item.description,
          offers: {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "IRR",
          },
        })),
    })),
  };

  return schema;
}
