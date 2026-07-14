import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer-core",
    "puppeteer",
    "@sparticuz/chromium",
    "exceljs",
    "nodemailer",
    "bcryptjs",
    "jsonwebtoken",
    "node-cron",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "app/api/reportes/pdf/route.ts": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/puppeteer-core/**",
      "node_modules/puppeteer/**"
    ],
  },
};

export default nextConfig;
