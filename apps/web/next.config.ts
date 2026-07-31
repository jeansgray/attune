import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@attune/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
