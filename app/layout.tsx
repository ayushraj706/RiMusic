import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // CSS import karna zaroori hai

const inter = Inter({ subsets: ["latin"] });

// Ye metadata aapke BaseKey CRM ka title aur description set karega
export const metadata: Metadata = {
  title: "BaseKey CRM - WhatsApp Automation",
  description: "Futuristic production-ready WhatsApp Business API Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* className="dark" default dark mode ke liye hai */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
