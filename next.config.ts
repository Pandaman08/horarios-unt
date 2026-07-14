import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "html-to-pdfmake",
    "pdfmake",
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
};

export default nextConfig;
