import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "",
				pathname: "/media/menu/thumbnails/**",
			},
			{
				protocol: "https",
				hostname: "chinocafe.ir",
				port: "",
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
