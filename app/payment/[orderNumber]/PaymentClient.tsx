"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface OrderDetail {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: string | number;
  status: string;
  table: {
    id: number;
    table_code: string;
    table_number: number;
  };
  order_items: {
    id: number;
    quantity: number;
    price: string | number;
    total: string | number;
    notes?: string | null;
    product: {
      name: string;
      image?: string | null;
    };
  }[];
  payment?: {
    id: number;
    method: string;
    status: string;
    amount: string | number;
    paid_at?: string | null;
  } | null;
}

export default function PaymentClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>("");

  const fetchOrder = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(() => {
      // Pause polling if user switched apps or locked mobile screen to save battery & CPU
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      fetchOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleConfirmPayment = async () => {
    try {
      setConfirming(true);
      const res = await fetch(`/api/payments/${orderNumber}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setSuccessToast("Pembayaran berhasil dikonfirmasi! Pesanan Anda diteruskan ke dapur Resto Mayo.");
        await fetchOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-resto-red-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500 font-medium">Memuat detail tagihan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <h2 className="text-xl font-bold text-gray-900">Pesanan tidak ditemukan</h2>
        <Link href="/" className="mt-4 px-4 py-2 rounded-xl bg-resto-red-800 text-white text-xs font-bold">
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  const isPaid = order.payment?.status === "paid";
  const method = order.payment?.method || "qris";

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] pb-16">
      
      {/* Top Accent Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-resto-red-600 via-resto-yellow-500 to-resto-red-700"></div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-resto-yellow-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-stone-700 hover:text-resto-red-700 hover:bg-resto-red-50 text-[11px] sm:text-xs font-semibold transition-colors border border-resto-yellow-200/80 bg-white shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-resto-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Menu Utama</span>
            </Link>

            <Link href="/" className="flex items-center space-x-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-resto-red-600 to-resto-yellow-500 flex items-center justify-center text-white text-sm sm:text-base shadow-sm">
                🍽️
              </span>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-resto-red-700 font-poppins">
                Resto<span className="text-resto-yellow-500">Mayo</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="max-w-xl mx-auto px-3 mt-4 w-full">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast("")} className="text-emerald-500 hover:text-emerald-800">✕</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 flex-1 w-full space-y-5 sm:space-y-6">
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-resto-yellow-200/80 shadow-xl p-4 sm:p-8 space-y-6 sm:space-y-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-32 h-32 sm:w-36 sm:h-36 bg-resto-yellow-100/50 rounded-full pointer-events-none"></div>

          {/* Header Status */}
          <div className="text-center space-y-2 relative z-10">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs ${
              isPaid ? "bg-emerald-100 text-emerald-800" : "bg-resto-yellow-100 text-resto-red-700 border border-resto-yellow-300"
            }`}>
              {isPaid ? (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-2xl sm:text-3xl">🧾</span>
              )}
            </div>

            <span className={`inline-flex items-center px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              isPaid
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300"
            }`}>
              {isPaid ? "✓ Pembayaran Berhasil / Lunas" : "Menunggu Pembayaran"}
            </span>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 font-poppins">
              Pesanan #{order.order_number}
            </h1>

            <p className="text-[11px] sm:text-xs md:text-sm text-stone-500">
              Pelanggan: <strong className="text-stone-900">{order.customer_name}</strong> • Meja: <strong className="text-resto-red-700 bg-resto-red-50 px-2 py-0.5 rounded-lg border border-resto-red-200">{order.table?.table_code}</strong>
            </p>
          </div>

          {/* Amount Box */}
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-resto-yellow-50/70 to-white border border-resto-yellow-200 flex items-center justify-between">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Tagihan</span>
              <span className="text-xl sm:text-2xl font-black text-resto-red-700 font-poppins">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Metode</span>
              <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold uppercase bg-resto-yellow-100 border border-resto-yellow-300 text-resto-yellow-900">
                {method.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Payment Specific Instructions */}
          {!isPaid && (
            <div className="space-y-4">
              {method === "qris" ? (
                <div className="text-center p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-resto-yellow-50/40 border border-resto-yellow-200 space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white border border-resto-yellow-300 text-[10px] sm:text-[11px] font-bold text-resto-yellow-900 uppercase">
                    <span>📱</span>
                    <span>Pindai Kode QRIS</span>
                  </div>
                  
                  <div className="inline-block p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-md border-2 border-resto-yellow-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=RESTOMAYO-${order.order_number}-${order.total_amount}`}
                      alt="QRIS Code"
                      decoding="async"
                      className="w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-xl"
                    />
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-stone-500 max-w-sm mx-auto">
                    Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja.
                  </p>
                </div>
              ) : method === "bank_transfer" ? (
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-resto-yellow-50/40 border border-resto-yellow-200 space-y-3 sm:space-y-4">
                  <span className="text-[11px] sm:text-xs font-bold text-stone-700 block uppercase tracking-wider">
                    Rekening Tujuan Transfer Bank
                  </span>
                  <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-resto-yellow-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-bold block">Bank Rakyat Indonesia (BRI)</span>
                      <span className="text-base sm:text-lg font-mono font-bold text-stone-900 tracking-wider">
                        1234-01-000567-53-8Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, Link
                      </span>
                      <span className="text-[10px] sm:text-xs text-stone-500 block">a.n. PT Resto Mayo Nusantara</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("123401000567538")}
                      className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-resto-yellow-200 hover:bg-resto-yellow-300 text-[10px] sm:text-xs font-bold text-resto-yellow-950 transition-colors border border-resto-yellow-300 cursor-pointer"
                    >
                      {copied ? "Tersalin!" : "Salin Rek"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-resto-yellow-50/40 border border-resto-yellow-200 space-y-3 sm:space-y-4">
                  <span className="text-[11px] sm:text-xs font-bold text-stone-700 block uppercase tracking-wider">
                    Nomor Tujuan Dompet Digital ({method.toUpperCase()})
                  </span>
                  <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-resto-yellow-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-bold block">{method.toUpperCase()} Official</span>
                      <span className="text-base sm:text-lg font-mono font-bold text-stone-900">
                        0877-5500-0371
                      </span>
                      <span className="text-[10px] sm:text-xs text-stone-500 block">Resto Mayo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("087755000371")}
                      className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-resto-yellow-200 hover:bg-resto-yellow-300 text-[10px] sm:text-xs font-bold text-resto-yellow-950 transition-colors border border-resto-yellow-300 cursor-pointer"
                    >
                      {copied ? "Tersalin!" : "Salin Nomor"}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-resto-red-600/25 transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {confirming ? (
                  <span>Mengonfirmasi Pembayaran...</span>
                ) : (
                  <span>Saya Sudah Selesai Bayar &rarr;</span>
                )}
              </button>
            </div>
          )}

          {/* Kitchen Order Progress Tracker */}
          <div className="space-y-3 pt-5 sm:pt-6 border-t border-resto-yellow-100">
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
              <span>👨‍🍳</span>
              <span>Status Pesanan di Dapur Resto Mayo</span>
            </h3>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
              {[
                { key: "pending", label: "Diterima", icon: "📋" },
                { key: "processing", label: "Dimasak", icon: "🍳" },
                { key: "ready", label: "Siap Saji", icon: "🔔" },
                { key: "completed", label: "Selesai", icon: "🍽️" },
              ].map((step, idx) => {
                const statuses = ["pending", "processing", "ready", "completed"];
                const currentIndex = statuses.indexOf(order.status);
                const isPassed = currentIndex >= idx;
                const isCurrent = order.status === step.key;

                return (
                  <div
                    key={step.key}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-resto-yellow-100 border-resto-red-400 text-resto-red-800 font-bold scale-102 shadow-xs"
                        : isPassed
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                        : "bg-stone-50 border-stone-200 text-stone-400"
                    }`}
                  >
                    <span className="text-sm sm:text-base block mb-0.5">{step.icon}</span>
                    <span className="text-[9px] sm:text-[11px] block">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="space-y-2.5 sm:space-y-3 pt-4 border-t border-resto-yellow-100">
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center space-x-1.5">
              <span>🍜</span>
              <span>Rincian Menu yang Dipesan</span>
            </h3>
            <div className="divide-y divide-resto-yellow-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="py-2 sm:py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-stone-900 text-[11px] sm:text-xs">{item.product.name}</span>
                    <span className="text-stone-400 ml-1.5 text-[10px] sm:text-xs">x{item.quantity}</span>
                    {item.notes && (
                      <span className="block text-[10px] sm:text-[11px] text-resto-red-700 italic">
                        Catatan: &ldquo;{item.notes}&rdquo;
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-resto-red-700 text-xs sm:text-sm">{formatRupiah(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
