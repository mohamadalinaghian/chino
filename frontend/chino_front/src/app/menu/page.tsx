import { getMenuData } from "@/services/menu/Menu";

import MenuContent from "./MenuContent";

import MenuSchemaInjector from "./MenuSchemaInjector";

import { generateMenuSchema } from "@/seo/structuredData/menuSchema";

export { metadata } from "./metadata";

export default async function MenuPage() {
  const { categories, items } = await getMenuData();

  const schema = generateMenuSchema(categories, items);

  return (
    <>
      <MenuContent categories={categories} items={items} />

      <MenuSchemaInjector schema={schema} />
    </>
  );
}
