import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "@stellar/stellar-sdk"],
};

export default nextConfig;
