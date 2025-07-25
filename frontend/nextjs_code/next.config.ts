import type { NextConfig } from "next";

const MEDIA_HOST = process.env.NEXT_PUBLIC_MEDIA_DOMAIN || "http://backend:8000";
const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "http://frontend:3000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: MEDIA_HOST.startsWith("https") ? "https" : "http",
        hostname: new URL(MEDIA_HOST).hostname,
        port: "",
        pathname: "/media/menu/thumbnails/**",
      },
      {
        protocol: SITE_DOMAIN.startsWith("https") ? "https" : "http",
        hostname: new URL(SITE_DOMAIN).hostname,
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
