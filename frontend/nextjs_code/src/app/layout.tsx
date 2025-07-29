import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "کافه چینو",
	description: "منوی آنلاین کافه چینو",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="fa" dir="rtl">
			<body className="bg-[#FAF3D0] text-[#5D4037]">{children}</body>
		</html>
	);
}
