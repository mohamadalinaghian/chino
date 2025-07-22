import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "185.243.48.151",
        port: "",
        pathname: "/media/menu/thumbnails/**",
      },
      {
        protocol: "https",
        hostname: "www.chinocafe.ir",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "chinocafe.ir",
        port: "",
        pathname: "**",
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
