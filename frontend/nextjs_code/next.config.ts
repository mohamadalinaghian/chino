import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "backend",
				port: "8000",
				pathname: "/media/**",
			},
			{
				protocol: "https",
				hostname: "backend",
				port: "8000",
				pathname: "/media/**",
			},
			{
				protocol: "https",
				hostname: "chinocafe.ir",
				port: "",
				pathname: "/media/**",
			},
			{
				protocol: "https",
				hostname: "chinocafe.ir/api",
				port: "",
				pathname: "/media/**",
			},
			{
				protocol: "https",
				hostname: "https://chinocafe.ir",
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
