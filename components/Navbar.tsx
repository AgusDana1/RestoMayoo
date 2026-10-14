"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import RestoMayoLogo from "./RestoMayoLogo";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Navbar({ onSelectTableClick }: { onSelectTableClick?: () => void }) {
  const { totalItems, tableCode, customerName } = useCart();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <>
      {/* Signature Red-Yellow Gradient Food Top Ribbon */}
      <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400 shadow-xs"></div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-amber-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-20 items-center">
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <RestoMayoLogo size="md" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-0.5">
                  <span className="text-lg sm:text-3xl font-black tracking-tight text-red-700 font-poppins">
                    Resto
                  </span>
                  <span className="text-lg sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent font-poppins">
                    Mayo
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 -mt-1 hidden sm:flex">
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                    🌶️ Cita Rasa Autentik &amp; Meresap 🧀
                  </span>
                </div>
              </div>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              
              {/* Table & Customer Info Pill */}
              <button
                onClick={onSelectTableClick}
                className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-amber-50/90 hover:bg-amber-100 border-2 border-yellow-400 text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0"></div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-red-700 font-black">
                    {mounted && tableCode ? `Meja ${tableCode}` : "Pilih Meja"}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 truncate max-w-[68px] sm:max-w-[130px]">
                    {mounted && customerName ? customerName : "Belum diisi"}
                  </span>
                </div>
              </button>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative inline-flex items-center space-x-1 sm:space-x-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all duration-200 hover:shadow-lg active:scale-95 border border-yellow-400/40"
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="hidden sm:inline">Pesanan</span>
                {mounted && totalItems > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-xs font-black leading-none text-red-950 bg-yellow-400 rounded-full shadow-xs border border-white">
                    {totalItems}
                  </span>
                )}
              </Link>

            </div>

          </div>
        </div>
      </header>
    </>
  );
}
