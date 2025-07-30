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
			<body className="">{children}</body>
		</html>
	);
}
