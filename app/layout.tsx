import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // CSS import karna zaroori hai

// 🔥 NAYA: NextAuth ka Provider import kiya
import { NextAuthProvider } from "@/components/providers/SessionProvider"; 

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
        
        {/* 🔥 NAYA: Poori app ko NextAuthProvider se wrap kar diya hai */}
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
        
      </body>
    </html>
  );
}
