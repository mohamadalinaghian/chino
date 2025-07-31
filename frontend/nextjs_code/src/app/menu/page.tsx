// 📄 src/app/menu/page.tsx

// Import client-side MenuContainer directly.
// This component is declared with `"use client"` internally.
import MenuContainer from "@/components/menu/MenuContainer/MenuContainer";

/**
 * Cafe Menu Page (Server Component)
 *
 * This is the entry point for the /menu route. It is rendered on the server.
 * The heavy interactive part (MenuContainer) is isolated to a client component.
 *
 * ❗Important:
 * Avoid using `dynamic(..., { ssr: false })` in server components.
 * Instead, directly import the client component that handles browser-only logic.
 */

export default function MenuPage() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl text-center font-bold mb-8">Cafe Chino Menu</h1>
			<MenuContainer />
		</main>
	);
}
