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
