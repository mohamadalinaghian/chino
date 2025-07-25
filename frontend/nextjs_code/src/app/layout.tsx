import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Cafe Chino | کافه چینو",
  description: "سایت رسمی کافه رستوران چینو",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-[#FAF3E0] text-[#333] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
