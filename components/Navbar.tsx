"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import RestoMayoLogo from "./RestoMayoLogo";
import AnnouncementBar from "./AnnouncementBar";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Navbar({ onSelectTableClick }: { onSelectTableClick?: () => void }) {
  const { totalItems, tableCode, customerName } = useCart();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Featured", href: "#featured" },
    { label: "Menu", href: "#menu" },
    { label: "Why Us", href: "#why-us" },
    { label: "Our Story", href: "#story" },
    { label: "Location & Hours", href: "#location" },
  ];

  return (
    <>
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#EADBCA] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-15 sm:h-20 items-center gap-2">
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
              <RestoMayoLogo size="sm" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-0.5">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-[#D94B35] font-heading">
                    Resto
                  </span>
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-[#F2C14E] font-heading">
                    Mayo
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-[#829477] font-bold uppercase tracking-wider -mt-1 hidden sm:block">
                  Modern Casual Dining
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-[#5F4E44]">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-[#D94B35] transition-colors py-1 cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right Side Actions: Table Selector & Cart */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              
              {/* Table Info Pill (Responsive) */}
              <button
                type="button"
                onClick={onSelectTableClick}
                className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#FFF9F0] hover:bg-[#FEF8E9] border border-[#EADBCA] hover:border-[#F2C14E] text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Change or select dining table"
              >
                <div className="w-2 h-2 rounded-full bg-[#829477] shrink-0"></div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#D94B35] font-black">
                    {mounted && tableCode ? `Table ${tableCode}` : "Table"}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#30251F] truncate max-w-[60px] sm:max-w-[120px]">
                    {mounted && customerName ? customerName : "Select"}
                  </span>
                </div>
              </button>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative inline-flex items-center space-x-1 sm:space-x-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#D94B35] hover:bg-[#B73824] text-white font-bold text-xs sm:text-sm font-heading shadow-xs transition-all active:scale-95 shrink-0"
                aria-label={`Shopping cart with ${totalItems} items`}
              >
                <svg
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#F2C14E]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="hidden sm:inline">Cart</span>

                {mounted && totalItems > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-black text-[#30251F] bg-[#F2C14E] rounded-full shadow-2xs">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden p-2 rounded-xl text-[#30251F] hover:bg-[#FFF9F0] border border-[#EADBCA] cursor-pointer shrink-0"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#EADBCA] bg-[#FFF9F0] px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#EADBCA]/60">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectTableClick?.();
                }}
                className="px-3 py-2 rounded-xl bg-white border border-[#EADBCA] text-xs font-bold text-[#30251F] flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <span>🪑</span>
                <span>{tableCode ? `Table ${tableCode}` : "Select Table"}</span>
              </button>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-[#D94B35] text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <span>🛒</span>
                <span>Cart ({totalItems})</span>
              </Link>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-bold text-[#30251F] hover:text-[#D94B35] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
