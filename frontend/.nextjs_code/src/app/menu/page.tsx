import { getMenuData } from "@/services/menu/Menu";
import MenuContent from "./MenuContent";
import MenuLayout from "./MenuLayout";
import { SidebarMenu } from "@/components/menu/sidebar";
import { generateMenuSchema } from "@/seo/structuredData/menuSchema";

export const dynamic = "force-dynamic";
export { metadata } from "./metadata";

export default async function MenuPage() {
  const { categories, items } = await getMenuData();
  const schema = generateMenuSchema(categories, items);

  const MenuSchemaInjector = (await import("./MenuSchemaInjector")).default;

  return (
    <>
      <MenuLayout
        sidebar={<SidebarMenu categories={categories} />}
        content={<MenuContent categories={categories} items={items} />}
      />
      <MenuSchemaInjector schema={schema} />
    </>
  );
}
