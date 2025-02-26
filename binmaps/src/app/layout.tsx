import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Binmaps - Find Nearby Recycling Centers",
  description: "Locate recycling centers and waste management facilities near you with Binmaps - your eco-friendly location finder",
  keywords: "recycling, waste management, bin locations, eco-friendly, maps",
  authors: [{ name: "Binmaps" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#4CAF50",
  openGraph: {
    title: "Binmaps - Find Nearby Recycling Centers",
    description: "Locate recycling centers and waste management facilities near you",
    type: "website",
    siteName: "Binmaps",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
