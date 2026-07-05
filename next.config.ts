import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@shopify/polaris', '@shopify/polaris-icons'],
};

export default nextConfig;
