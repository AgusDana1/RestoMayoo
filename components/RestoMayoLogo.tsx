"use client";

import React from "react";

interface RestoMayoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function RestoMayoLogo({
  className = "",
  size = "md",
  showText = false,
}: RestoMayoLogoProps) {
  const sizeClasses = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-8 h-8 sm:w-9 sm:h-9",
    lg: "w-10 h-10 sm:w-11 sm:h-11",
    xl: "w-13 h-13 sm:w-15 sm:h-15",
  };

  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      {/* Resto Mayo Cloche & Mayo Swirl Badge */}
      <div
        className={`${sizeClasses[size]} relative rounded-2xl bg-[#D94B35] p-1.5 flex items-center justify-center shadow-xs border border-[#F2C14E]/60 overflow-hidden shrink-0`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Steam wisps */}
          <path
            d="M26 11C24.5 8 27 6 25.5 3"
            stroke="#F2C14E"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M32 12C30.5 9 33.5 6.5 32 3"
            stroke="#FFF9F0"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M38 11C36.5 8 39 6 37.5 3"
            stroke="#F2C14E"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Cloche Knob */}
          <circle cx="32" cy="17" r="3" fill="#F2C14E" />
          <path d="M30 19H34V22H30Z" fill="#F2C14E" />

          {/* Cloche Dome */}
          <path
            d="M13 36C13 24 21 22 32 22C43 22 51 24 51 36H13Z"
            fill="#FFF9F0"
          />

          {/* Cloche reflection highlight */}
          <path
            d="M17 34C17 26.5 23 24.5 32 24.5"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Serving Platter Rim */}
          <rect x="9" y="36" width="46" height="5" rx="2.5" fill="#F2C14E" />

          {/* Mayo / Sauce Swirl Accent */}
          <path
            d="M20 48C26 44 38 52 44 47"
            stroke="#F2C14E"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center space-x-1">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-[#D94B35] font-heading">
              Resto
            </span>
            <span className="text-lg sm:text-2xl font-black tracking-tight text-[#F2C14E] font-heading">
              Mayo
            </span>
          </div>
          <span className="text-[9px] font-bold text-[#829477] uppercase tracking-wider mt-0.5 hidden sm:block">
            Casual Dining &bull; Bali
          </span>
        </div>
      )}
    </div>
  );
}
