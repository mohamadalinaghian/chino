import { getMenuData } from "@/services/menu/Menu";
import MenuList from "@/components/menu/MenuList";

function checkCategory(){
  
}
export default async function MenuPage() {
  const { categories, items } = await getMenuData();

  return (
    <main
      className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-8 py-6"
      aria-label="منوی کافه چینو"
    >
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
          منوی کافه چینو
        </h1>
      </header>

      <MenuList categories={categories} items={items} />
    </main>
  );
}
