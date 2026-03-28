import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  style: ['normal', 'italic'] 
});

export const metadata: Metadata = {
  title: "Evalis | Academic Intelligence Platform",
  description: "Multi-tenant academic performance analytics and management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased selection:bg-brand-green selection:text-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}