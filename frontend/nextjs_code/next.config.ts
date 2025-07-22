import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["185.243.48.151", "www.chinocafe.ir", "chinocafe.ir"],
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
