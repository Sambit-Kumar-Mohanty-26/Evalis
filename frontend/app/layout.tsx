import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  style: ['normal', 'italic'] 
});

export const metadata: Metadata = {
  title: "SPARS | Student Performance Analysis",
  description: "Discover how data shapes academic success.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased selection:bg-brand-green selection:text-white`}>
        {children}
      </body>
    </html>
  );
}