// 📄 src/components/menu/MenuContainer/MenuContainer.tsx

"use client"; // ❗چون داخلش فقط کامپوننت کلاینتی رو استفاده میکنیم

import dynamic from "next/dynamic";

// 👇 Lazy load MenuContent فقط در مرورگر
const MenuContent = dynamic(() => import("./MenuContent.client"), {
	ssr: false,
	loading: () => (
		<div className="text-center py-10">در حال بارگذاری منو...</div>
	),
});

export default function MenuContainer() {
	return <MenuContent />;
}
