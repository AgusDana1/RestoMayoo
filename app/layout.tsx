import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import OrderNotification from "../components/OrderNotification";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#DC2626",
};

export const metadata: Metadata = {
  title: "Resto Mayo - Premium Dining & Culinary Experience",
  description:
    "Resto Mayo - Authentic & Flavorful Cuisine. Order your favorite dishes directly from your table.",
  icons: {
    icon: [
      { url: "/resto-mayo-logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/resto-mayo-logo.svg",
    apple: "/resto-mayo-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-800">
        <CartProvider>
          {children}
          <Suspense fallback={null}>
            <OrderNotification />
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}
