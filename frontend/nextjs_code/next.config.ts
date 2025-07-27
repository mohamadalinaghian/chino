import type { NextConfig } from "next";

const MEDIA_HOST: string = process.env.NEXT_PUBLIC_MEDIA_DOMAIN as string;

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: MEDIA_HOST.startsWith("https") ? "https" : "http",
				hostname: new URL(MEDIA_HOST).hostname,
				port: "",
				pathname: "*",
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
