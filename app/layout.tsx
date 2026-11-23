import "./globals.css";
import type { Metadata, Viewport } from "next";

import { Inter, Outfit } from "next/font/google";
import { ServiceWorkerUpdater } from "@/components/ServiceWorkerUpdater";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "ESA Gestor",
  description: "Controle de acessos, despesas e cobranças via WhatsApp.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-esa-play.png",
    apple: "/logo-esa-play.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ESA Gestor",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">
        <ServiceWorkerUpdater />
        {children}
      </body>
    </html>
  );
}
