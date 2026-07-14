import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
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
      "node_modules/@sparticuz/chromium/**/*",
      "node_modules/puppeteer-core/**/*",
    ],
  },
};

export default nextConfig;
