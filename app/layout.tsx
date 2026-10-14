import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";

export const metadata: Metadata = {
  title: "Resto Mayo - Restoran Pilihan Bersama",
  description:
    "Resto Mayo - Cita Rasa Autentik & Meresap. Pesan hidangan favorit langsung dari meja Anda.",
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
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-800">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
