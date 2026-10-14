"use client";

import React, { useState, useEffect, useCallback } from "react";

export default function OpeningScene() {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("resto_mayo_scene_seen");
    }
    return false;
  });
  const [animatingOut, setAnimatingOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setAnimatingOut(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("resto_mayo_scene_seen", "true");
    }
    setTimeout(() => {
      setVisible(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, handleDismiss]);

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#2D0508] via-[#4A0A0F] to-[#1A0204] text-white overflow-hidden transition-all duration-700 ease-out select-none cursor-pointer ${
        animatingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient Glowing Auras */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="anim-opening-aura w-72 h-72 sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-resto-gold-600/30 via-resto-red-600/20 to-transparent blur-3xl"></div>
      </div>

      {/* Luxury Corner Ornaments */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-6 h-6 sm:w-10 sm:h-10 border-t-2 border-l-2 border-resto-gold-500/30 pointer-events-none"></div>
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-6 h-6 sm:w-10 sm:h-10 border-t-2 border-r-2 border-resto-gold-500/30 pointer-events-none"></div>
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-6 h-6 sm:w-10 sm:h-10 border-b-2 border-l-2 border-resto-gold-500/30 pointer-events-none"></div>
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-6 h-6 sm:w-10 sm:h-10 border-b-2 border-r-2 border-resto-gold-500/30 pointer-events-none"></div>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-md w-full text-center">
        {/* Emblem Cloche Badge */}
        <div className="anim-opening-emblem relative mb-4 sm:mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-resto-gold-500/30 to-resto-red-500/30 rounded-3xl blur-md"></div>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 bg-gradient-to-tr from-resto-gold-600 via-resto-gold-400 to-amber-200 shadow-2xl">
            <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-resto-red-800 to-resto-red-950 flex items-center justify-center border border-resto-gold-500/40">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-resto-gold-300 drop-shadow-md"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M4 15c0-4.418 3.582-8 8-8s8 3.582 8 8H4z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 17h20" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 7l1-1m-1 0l1 1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex items-center justify-center space-x-2.5 sm:space-x-3 overflow-hidden py-1">
          <span className="anim-opening-resto text-3xl sm:text-5xl font-black font-poppins tracking-tight text-white drop-shadow-lg">
            Resto
          </span>
          <span className="anim-opening-mayo text-3xl sm:text-5xl font-black font-poppins tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
            Mayo
          </span>
        </div>

        {/* Accent Line */}
        <div className="w-32 sm:w-44 h-0.5 bg-gradient-to-r from-transparent via-resto-gold-400 to-transparent my-3 sm:my-4"></div>

        {/* Tagline */}
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-resto-gold-200 font-poppins">
          Cita Rasa Autentik &amp; Meresap
        </p>

        {/* Welcome Pill & Loader */}
        <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black/40 border border-resto-gold-500/20 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-resto-gold-400 animate-ping"></span>
            <span className="text-[10px] sm:text-[11px] font-medium text-amber-200/90 tracking-wider">
              Menyiapkan Ruang Santap...
            </span>
          </div>
          <div className="w-36 sm:w-44 h-1 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div className="h-full bg-gradient-to-r from-resto-red-600 via-resto-gold-400 to-amber-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Tap anywhere prompt */}
      <div className="absolute bottom-6 text-[10px] sm:text-xs text-white/40 tracking-wider font-light flex items-center space-x-1.5 pointer-events-none">
        <span>Sentuh layar untuk langsung masuk</span>
        <span>&rarr;</span>
      </div>
    </div>
  );
}

