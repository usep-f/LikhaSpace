import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "@stellar/stellar-sdk", "google-auth-library"],
};

export default nextConfig;
