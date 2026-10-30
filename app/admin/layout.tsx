"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import RestoMayoLogo from "../../components/RestoMayoLogo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, don't show admin header/nav
  if (pathname === "/admin/login" || pathname === "/login") {
    return <>{children}</>;
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/kitchen", label: "Kitchen (KDS)", icon: "🍳" },
    { href: "/admin/orders", label: "Orders", icon: "📋" },
    { href: "/admin/products", label: "Menu Items", icon: "🍔" },
    { href: "/admin/categories", label: "Categories", icon: "🏷️" },
    { href: "/admin/qr", label: "Table QR", icon: "📱" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-stone-800">
      
      {/* Top Accent Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-resto-red-600 via-resto-yellow-500 to-resto-red-700"></div>

      {/* Admin Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-resto-yellow-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <Link href="/admin/dashboard" className="flex items-center space-x-3">
                <RestoMayoLogo size="lg" />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-resto-red-700 font-poppins">
                      Resto<span className="text-resto-yellow-500">Mayo</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium hidden sm:block">
                    Restaurant &amp; Kitchen Management
                  </span>
                </div>
              </Link>
            </div>

            {/* Nav Links for Desktop */}
            <nav className="hidden md:flex items-center space-x-1.5">
              {navLinks.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white shadow-xs"
                        : "text-stone-600 hover:text-resto-red-700 hover:bg-resto-yellow-50/70"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-resto-yellow-200 text-stone-700 hover:text-resto-red-700 hover:bg-resto-yellow-50 text-xs font-semibold transition-colors bg-white shadow-2xs"
              >
                <span>View Menu</span>
                <span className="text-xs">↗</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-resto-red-50 hover:text-resto-red-700 text-stone-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center space-x-1 px-4 py-2 border-t border-resto-yellow-100 overflow-x-auto scrollbar-none bg-white">
          {navLinks.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white"
                    : "text-stone-600 hover:bg-resto-yellow-50/70"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

    </div>
  );
}

