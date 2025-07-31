// 📄 src/app/menu/page.tsx

import dynamic from "next/dynamic";

// ✅ در اینجا به صورت مستقیم کلاینتکامپوننت لود میشه (بدون SSR)
const MenuContainer = dynamic(
	() => import("@/components/menu/MenuContainer/MenuContainer"),
	{
		ssr: false,
		loading: () => (
			<div className="text-center py-12">در حال بارگذاری منو...</div>
		),
	},
);

export default function MenuPage() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl text-center font-bold mb-8">منو کافه چینو</h1>
			<MenuContainer />
		</main>
	);
}
