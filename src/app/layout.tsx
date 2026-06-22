

import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { iniciarCronOnce } from "@/lib/cronStarter";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Sistema de Horarios UNT",
  description: "Gestión de horarios académicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inicia los cron jobs una sola vez por proceso
  iniciarCronOnce();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AppProviders>
          {children}
          <ChatWidget />
        </AppProviders>
      </body>
    </html>
  );
}
