import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ESA Gestor",
  description: "Controle de acessos, despesas e cobranças via WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
