"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ActiveOrderInfo {
  order_number: string;
  status: string;
  customer_name: string;
  table?: {
    table_code: string;
    table_number: number;
  };
}

export default function OrderNotification() {
  const pathname = usePathname();
  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const prevStatusRef = useRef<string | null>(null);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(587.33, 0, 0.35); // D5
      playTone(880, 0.18, 0.45);   // A5
    } catch (e) {
      console.warn("Could not play sound chime:", e);
    }
  };

  useEffect(() => {
    // Skip polling in admin section
    if (pathname?.startsWith("/admin")) return;

    const checkActiveOrder = async () => {
      try {
        if (typeof window === "undefined") return;
        const savedOrderNum = localStorage.getItem("resto_mayo_active_order");
        if (!savedOrderNum) {
          setActiveOrder(null);
          return;
        }

        const res = await fetch(`/api/orders/${savedOrderNum}`);
        if (!res.ok) {
          if (res.status === 404) {
            localStorage.removeItem("resto_mayo_active_order");
            setActiveOrder(null);
          }
          return;
        }

        const data: ActiveOrderInfo = await res.json();
        setActiveOrder(data);

        // If status changed to ready, play chime and un-dismiss
        if (data.status === "ready" && prevStatusRef.current !== "ready") {
          setDismissed(false);
          playChime();
        }

        prevStatusRef.current = data.status;
      } catch (err) {
        console.error("OrderNotification poll error:", err);
      }
    };

    checkActiveOrder();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      checkActiveOrder();
    }, 5000);

    return () => clearInterval(interval);
  }, [pathname]);

  // Don't show if on admin or on that order's payment page itself or if dismissed
  if (!activeOrder || dismissed || pathname?.startsWith("/admin")) {
    return null;
  }

  // Only show notification banner if status is "ready" (or completed toast)
  if (activeOrder.status !== "ready" && activeOrder.status !== "completed") {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (activeOrder.status === "completed") {
      localStorage.removeItem("resto_mayo_active_order");
    }
  };

  const isReady = activeOrder.status === "ready";

  return (
    <aside
      aria-label="Order Status Notification"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] animate-in slide-in-from-bottom-5 duration-300"
    >
      <div
        className={`rounded-2xl p-4 sm:p-5 border-2 shadow-2xl backdrop-blur-md transition-all ${
          isReady
            ? "bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 border-yellow-200 text-red-950 shadow-amber-500/30"
            : "bg-white/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10"
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                isReady
                  ? "bg-red-600 text-yellow-300 animate-pulse"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isReady ? "🔔" : "🍽️"}
            </div>
            <div>
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isReady
                      ? "bg-red-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {isReady ? "Siap Diambil" : "Selesai Dihidangkan"}
                </span>
                {activeOrder.table?.table_code && (
                  <span className="text-[11px] font-bold text-red-900">
                    Meja {activeOrder.table.table_code}
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-black font-poppins mt-1">
                {isReady
                  ? "Pesanan Anda Sudah Jadi! 🎉"
                  : "Pesanan Telah Selesai Dihidangkan"}
              </h4>
              <p
                className={`text-[11px] mt-0.5 leading-snug font-medium ${
                  isReady ? "text-red-950/90" : "text-stone-600"
                }`}
              >
                {isReady
                  ? `Pesanan #${activeOrder.order_number} sudah selesai disiapkan. Silakan ambil di pick-up counter!`
                  : "Selamat menikmati hidangan Anda di Resto Mayo!"}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Tutup notifikasi"
            className="w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between gap-2">
          <Link
            href={`/payment/${activeOrder.order_number}`}
            className={`flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-bold transition-all shadow-xs ${
              isReady
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            Lihat Pesanan &rarr;
          </Link>
          <button
            onClick={handleDismiss}
            className="py-1.5 px-2.5 rounded-xl text-xs font-semibold hover:bg-black/10 text-stone-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </aside>
  );
}
