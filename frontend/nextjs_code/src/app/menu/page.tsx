import { getMenuData } from "@/services/menu/Menu";

import MenuContent from "./MenuContent";

import MenuSchemaInjector from "./MenuSchemaInjector";

import MenuLayout from "./MenuLayout";

import { SidebarMenu } from "@/components/menu/sidebar";

import { generateMenuSchema } from "@/seo/structuredData/menuSchema";
export const dynamic = "force-dynamic";
export { metadata } from "./metadata";

export default async function MenuPage() {
  const { categories, items } = await getMenuData();

  const schema = generateMenuSchema(categories, items);

  const content = <MenuContent categories={categories} items={items} />;

  const sidebar = <SidebarMenu categories={categories} />;

  return (
    <>
      <MenuLayout sidebar={sidebar} content={content} />

      <MenuSchemaInjector schema={schema} />
    </>
  );
}
