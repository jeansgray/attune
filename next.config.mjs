/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@attune/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
    ],
  },
};
export default nextConfig;
