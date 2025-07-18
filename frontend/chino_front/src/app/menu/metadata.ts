import { Metadata } from "next";

export const metadata: Metadata = {
  title: "منوی کافه چینو | قهوه، دمنوش، صبحانه، فست‌فود و بیشتر",
  description:
    "منوی متنوع کافه چینو شامل قهوه، دمنوش، بستنی، میان‌وعده، کیک، صبحانه، سالاد، فست‌فود، پیتزا، سوخاری و غذاهای فرنگی. تجربه‌ای خوشمزه در محیطی دل‌انگیز.",
  keywords: [
    "کافه چینو",
    "منوی کافه",
    "قهوه",
    "دمنوش",
    "بستنی",
    "کیک",
    "صبحانه",
    "سالاد",
    "فست فود",
    "پیتزا",
    "سوخاری",
    "غذای فرنگی",
    "منو چینو",
  ],
  openGraph: {
    title: "منوی کافه چینو",
    description:
      "منوی کامل کافه چینو شامل نوشیدنی و غذاهای خوشمزه برای تمام سلیقه‌ها.",
    type: "website",
    url: "https://chinocafe.ir/menu",
    siteName: "کافه چینو",
    images: [
      {
        url: "https://chinocafe.ir/images/og-menu.jpg",
        width: 1200,
        height: 630,
        alt: "منوی کافه چینو",
      },
    ],
    locale: "fa_IR",
  },
  twitter: {
    card: "summary_large_image",
    title: "منوی کافه چینو",
    description: "منوی متنوع نوشیدنی و غذای خوشمزه با فضای دل‌نشین",
    images: ["https://chinocafe.ir/images/og-menu.jpg"],
  },
  alternates: {
    canonical: "https://chinocafe.ir/menu",
  },
};
