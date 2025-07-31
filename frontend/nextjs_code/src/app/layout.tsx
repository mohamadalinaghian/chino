import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "کافه چینو | منوی آنلاین",
		template: "%s | کافه چینو",
	},
	description:
		"منوی دیجیتال کافه چینو - تجربه سفارش آنلاین نوشیدنیها و غذاهای ویژه",
	keywords: ["کافه", "چینو", "منوی آنلاین", "قهوه", "نوشیدنی", "کافه شاهرود"],
	openGraph: {
		title: "کافه چینو",
		description: "منوی آنلاین کافه چینو",
		url: "https://chinocafe.ir",
		siteName: "کافه چینو",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
			},
		],
		locale: "fa_IR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "کافه چینو",
		description: "منوی آنلاین کافه چینو",
		images: ["/twitter-image.jpg"],
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},
	themeColor: "#faf3d0",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="fa" dir="rtl">
			<body className="main-container container mx-auto">{children}</body>
		</html>
	);
}
