import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [new URL("https://chinocafe.ir/**")],
	},
};

export default nextConfig;
