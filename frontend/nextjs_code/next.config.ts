import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "chinocafe.ir",
				pathname: "/media/**",
			},
		],
		// برای دیباگ موقتا غیرفعال کنید
		unoptimized: false,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/menu",
				permanent: true,
			},
		];
	},
};

export default nextConfig;
