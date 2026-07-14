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
      "node_modules/@sparticuz/chromium/bin/**",
      "node_modules/@sparticuz/chromium/build/**",
      "node_modules/puppeteer-core/**",
      "node_modules/puppeteer/**"
    ],
  },
  webpack: (config) => {
    // Ensure @sparticuz/chromium files are included in the server bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      "@sparticuz/chromium": "@sparticuz/chromium",
    };
    return config;
  },
};

export default nextConfig;
