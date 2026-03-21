import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Cloud Run 최적화 빌드
};

export default nextConfig;
