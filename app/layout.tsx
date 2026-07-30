import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // CSS import karna zaroori hai

// 👇 Yahan apna Sidebar import karna hai
import Sidebar from "@/components/Sidebar"; 

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
      <body className={`${inter.className} flex h-screen w-full bg-[#F5F7F9] overflow-hidden`}>
        
        {/* 1. Sidebar hamesha left side me fix rahega */}
        <Sidebar />
        
        {/* 2. Main Content right side me aayega aur scroll hoga */}
        <main className="flex-1 h-full overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}
