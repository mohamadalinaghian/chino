// export const dynamic = 'force-dynamic';
import { fetchCategories, fetchMenuItems } from "@/service/menu";
import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuPageClient from "@/components/menu/MenuPageClient";

/**
 * Page Rendering Configuration
 * - dynamic: 'auto' lets Next.js decide between static and dynamic rendering
 * - revalidate: Enables ISR (Incremental Static Regeneration) every hour
 */
export const dynamic = "auto";
export const revalidate = 3600; // ISR: Rebuild every 1 hour

/**
 * Menu Page - Server Component
 *
 * Fetches menu data from API and renders the interactive menu interface.
 * Implements graceful fallback if API requests fail during build or runtime.
 */
export default async function MenuPage() {
  // Initialize empty arrays as fallback
  let categories: IMenuCategory[] = [];
  let menuItems: IMenuItem[] = [];

  try {
    // Fetch both categories and menu items in parallel
    [categories, menuItems] = await Promise.all([
      fetchCategories().catch(() => []), // Fallback to empty array if error
      fetchMenuItems().catch(() => []), // Fallback to empty array if error
    ]);
  } catch (error) {
    console.error("Error fetching menu data:", error);
    // Error is already handled by individual catch statements above
    // This outer catch is for additional error logging if needed
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl text-center font-bold mb-8">Cafe Chino Menu</h1>
      {/*
        Pass data to client component
        Even if fetch fails, empty arrays will be passed
        Client component should handle empty state appropriately
      */}
      <MenuPageClient categories={categories} items={menuItems} />
    </main>
  );
}
