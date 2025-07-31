import dynamic from "next/dynamic";

// 👇 Lazy load client-only component without SSR
const MenuContent = dynamic(() => import("./MenuContent.client"), {
	ssr: false,
	loading: () => <div>در حال بارگذاری منو...</div>,
});

export default function MenuContainer() {
	return <MenuContent />;
}
