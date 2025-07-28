import type { NextConfig } from "next";

const MEDIA_HOST: string = process.env.NEXT_PUBLIC_MEDIA_DOMAIN as string;
const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: MEDIA_HOST.startsWith("https") ? "https" : "http",
				hostname: new URL(MEDIA_HOST).hostname,
				port: "",
				pathname: "*",
			},
			{
				protocol: API_URL.startsWith("https") ? "https" : "http",
				hostname: new URL(API_URL).hostname,
				port: "",
				pathname: "*",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "",
				pathname: "/media/menu/thumbnails/**",
			},
			{
				protocol: "http",
				hostname: "backend",
				port: "8000",
				pathname: "/media/menu/thumbnails/**",
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
