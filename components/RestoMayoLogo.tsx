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
    lg: "w-10 h-10 sm:w-12 sm:h-12",
    xl: "w-14 h-14 sm:w-16 sm:h-16",
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Resto Mayo Brand Icon */}
      <div
        className={`${sizeClasses[size]} relative rounded-xl sm:rounded-2xl bg-gradient-to-br from-resto-red-600 via-resto-red-700 to-resto-yellow-600 p-1 flex items-center justify-center shadow-sm border border-resto-yellow-300/70 overflow-hidden shrink-0`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-2xs"
        >
          {/* Steam wisps */}
          <path
            d="M26 12C24.5 9 27 7 25.5 4"
            stroke="#FEF08A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M32 13C30.5 10 33.5 7.5 32 4"
            stroke="#FACC15"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M38 12C36.5 9 39 7 37.5 4"
            stroke="#FEF08A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Cloche Knob */}
          <circle cx="32" cy="17" r="3" fill="#FEF08A" />
          <path d="M30 19H34V22H30Z" fill="#FACC15" />

          {/* Cloche Dome */}
          <path
            d="M13 36C13 24 21 22 32 22C43 22 51 24 51 36H13Z"
            fill="url(#clocheGrad)"
          />

          {/* Dome reflection highlight */}
          <path
            d="M17 34C17 26.5 23 24.5 32 24.5"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Crossed Fork & Knife / Chef motif in dome */}
          <path
            d="M28 28.5L36 36.5M36 28.5L28 36.5"
            stroke="#991B1B"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Serving Platter Rim */}
          <rect x="9" y="36" width="46" height="5" rx="2.5" fill="#FEF08A" />

          {/* Serving Stand */}
          <path d="M15 41L19 46H45L49 41H15Z" fill="#991B1B" opacity="0.9" />

          {/* Mayo / Sauce Swirl Accent */}
          <path
            d="M21 53C27 50 37 56 43 52"
            stroke="#FDE047"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient
              id="clocheGrad"
              x1="32"
              y1="22"
              x2="32"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFFFF" />
              <stop offset="0.35" stopColor="#FEF08A" />
              <stop offset="1" stopColor="#EAB308" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span className="text-lg sm:text-xl font-black tracking-tight text-resto-red-700 font-poppins leading-none">
          Resto<span className="text-resto-yellow-500">Mayo</span>
        </span>
      )}
    </div>
  );
}

