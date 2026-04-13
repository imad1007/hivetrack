import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "openweathermap.org" },
    ],
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
};

export default withNextIntl(nextConfig);
