import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer-core",
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
    "src/app/api/reportes/pdf/route": ["node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
