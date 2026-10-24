import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Las fotos de planillas se achican en el navegador (~0,5 MB), pero dejamos margen.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
