"use client";

import React, { useState } from "react";

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#D94B35] text-[#FFF9F0] text-xs py-2 px-3 sm:px-6 border-b border-[#B73824] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center space-x-2 text-center text-[11px] sm:text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F2C14E] text-[#30251F] text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            Promo
          </span>
          <p className="font-medium truncate">
            <span>Free Signature Mayo Dip on orders over Rp 75.000</span>
            <span className="mx-2 hidden md:inline text-white/40">&bull;</span>
            <span className="hidden md:inline text-white/90">Dine-in Table QR Ordering Active</span>
            <span className="mx-2 hidden lg:inline text-white/40">&bull;</span>
            <span className="hidden lg:inline text-white/90">Open Daily 10:00 – 22:00 WITA</span>
          </p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="text-white/70 hover:text-white text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
