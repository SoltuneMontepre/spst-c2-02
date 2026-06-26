import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Faster builds + smaller bundles (tree-shake icon packs).
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
