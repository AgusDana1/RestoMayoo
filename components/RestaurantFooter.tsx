"use client";

import React from "react";
import Link from "next/link";
import RestoMayoLogo from "./RestoMayoLogo";

export default function RestaurantFooter() {
  return (
    <footer className="bg-[#30251F] text-[#FFF9F0] border-t-4 border-[#F2C14E] pt-12 sm:pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2">
              <RestoMayoLogo size="md" />
              <div className="flex items-center space-x-0.5">
                <span className="text-xl font-black tracking-tight text-[#FFF9F0] font-heading">
                  Resto
                </span>
                <span className="text-xl font-black tracking-tight text-[#F2C14E] font-heading">
                  Mayo
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#EADBCA]/80 leading-relaxed">
              Modern casual dining specializing in golden crispy melted cheese risoles, wok-charred fried rice, flame-torched mentai dimsum, and handcrafted iced beverages.
            </p>

            <div className="flex items-center space-x-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#D94B35] flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="Instagram"
              >
                📸
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#D94B35] flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="TikTok"
              >
                🎵
              </a>
              <a
                href="https://wa.me/6287755000371"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#829477] flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="WhatsApp"
              >
                💬
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2C14E] font-heading">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-[#EADBCA]/80">
              <li>
                <a href="#featured" className="hover:text-white transition-colors">
                  Featured Dishes
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-white transition-colors">
                  Full Menu Catalog
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-white transition-colors">
                  Why Resto Mayo
                </a>
              </li>
              <li>
                <a href="#story" className="hover:text-white transition-colors">
                  Our Culinary Story
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-white transition-colors">
                  Location &amp; Opening Hours
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="text-white/40 hover:text-white/80 transition-colors">
                  Staff Login (KDS)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Operating Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2C14E] font-heading">
              Opening Hours
            </h4>
            <div className="space-y-1.5 text-xs text-[#EADBCA]/80">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Monday – Friday</span>
                <span className="font-semibold text-white">10:00 – 22:00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Saturday – Sunday</span>
                <span className="font-semibold text-white">10:00 – 22:00</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Last Kitchen Order</span>
                <span className="font-semibold text-[#F2C14E]">21:30 WITA</span>
              </div>
            </div>

            <p className="text-[11px] text-[#829477] pt-1 font-medium">
              &bull; Dine-in, Takeaway, and Table QR Ordering available daily.
            </p>
          </div>

          {/* Col 4: Location & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2C14E] font-heading">
              Visit Us
            </h4>
            <p className="text-xs text-[#EADBCA]/80 leading-relaxed">
              Jl. Danau Tamblingan No. 88, Sanur, Denpasar Selatan, Bali 80228
            </p>
            <div className="text-xs text-[#EADBCA]/80 space-y-1 pt-1">
              <p>
                <span className="text-[#F2C14E]">Phone / WA:</span> +62 877-5500-0371
              </p>
              <p>
                <span className="text-[#F2C14E]">Email:</span> hello@restomayo.com
              </p>
            </div>

            {/* Accepted Payments */}
            <div className="pt-2">
              <span className="text-[10px] text-white/50 block uppercase tracking-wider mb-1.5 font-bold">
                Accepted Payment Methods
              </span>
              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-white/80">
                <span className="px-2 py-0.5 rounded bg-white/10">QRIS</span>
                <span className="px-2 py-0.5 rounded bg-white/10">GoPay</span>
                <span className="px-2 py-0.5 rounded bg-white/10">OVO</span>
                <span className="px-2 py-0.5 rounded bg-white/10">DANA</span>
                <span className="px-2 py-0.5 rounded bg-white/10">ShopeePay</span>
                <span className="px-2 py-0.5 rounded bg-white/10">BRI Transfer</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#EADBCA]/60 gap-3">
          <p>&copy; 2026 Resto Mayo Nusantara. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Handcrafted with 🌶️ &bull; Comfort Food &bull; Sanur, Bali
          </p>
        </div>
      </div>
    </footer>
  );
}
