"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import RestoMayoLogo from "@/components/RestoMayoLogo";

interface ReviewData {
  id: number;
  rating: number;
  comment?: string | null;
  category?: string | null;
  sentiment?: string | null;
  is_critical?: boolean;
  critical_reason?: string | null;
  ai_summary?: string | null;
  created_at?: string;
}

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
  review?: ReviewData | null;
}

export default function PaymentClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>("");

  const prevStatusRef = React.useRef<string | null>(null);

  const playOrderReadyChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(587.33, 0, 0.35); // D5
      playTone(880, 0.2, 0.45); // A5
    } catch (e) {
      console.warn("Could not play chime:", e);
    }
  };

  // Review states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>("");

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
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      fetchOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  useEffect(() => {
    if (order) {
      if (typeof window !== "undefined") {
        if (order.status === "completed") {
          // Keep active order reference for completion toast or clear
        } else {
          localStorage.setItem("resto_mayo_active_order", order.order_number);
        }
      }

      if (order.status === "ready" && prevStatusRef.current && prevStatusRef.current !== "ready") {
        playOrderReadyChime();
      }
      prevStatusRef.current = order.status;
    }
  }, [order]);

  const handleConfirmPayment = async () => {
    try {
      setConfirming(true);
      const res = await fetch(`/api/payments/${orderNumber}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setSuccessToast("Payment successfully confirmed! Your order has been forwarded to the kitchen.");
        await fetchOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setSubmittingReview(true);
      setReviewError("");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: order.order_number,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }
      setSuccessToast("Thank you! Your feedback has been analyzed by Chef Gemini AI.");
      await fetchOrder();
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F0]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#D94B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#30251F]/70 font-medium">Loading your bill details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF9F0] p-4 text-center">
        <h2 className="text-xl font-bold text-[#30251F] font-heading">Order Not Found</h2>
        <p className="text-xs text-[#30251F]/70 mt-1">Please double-check your order number or re-order from the menu.</p>
        <Link
          href="/"
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#D94B35] text-white text-xs font-bold shadow-xs hover:bg-[#C23E2A]"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  const isPaid = order.payment?.status === "paid";
  const method = order.payment?.method || "qris";

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#30251F]">
      {/* Header */}
      <header className="bg-white border-b border-[#30251F]/10 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#30251F] hover:text-[#D94B35] hover:bg-[#FFF9F0] transition-colors border border-[#30251F]/15 bg-white shadow-2xs"
            >
              <svg
                className="w-4 h-4 text-[#D94B35]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Home Menu</span>
            </Link>

            <Link href="/" className="flex items-center space-x-2">
              <RestoMayoLogo size="sm" showText={true} />
            </Link>

            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="max-w-xl mx-auto px-4 mt-4 w-full">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#829477]/15 border border-[#829477]/40 text-[#30251F] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-[#829477] text-white flex items-center justify-center text-xs">
                ✓
              </span>
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast("")}
              className="text-[#30251F]/60 hover:text-[#30251F] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 flex-1 w-full space-y-5 sm:space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#30251F]/10 shadow-sm p-4 sm:p-8 space-y-5 sm:space-y-6">
          {/* Header Status */}
          <div className="text-center space-y-2">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-xs border ${
                isPaid
                  ? "bg-[#829477]/15 text-[#829477] border-[#829477]/30"
                  : "bg-[#F2C14E]/25 text-[#D94B35] border-[#F2C14E]/60"
              }`}
            >
              {isPaid ? "✓" : "🧾"}
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                isPaid
                  ? "bg-[#829477]/15 text-[#829477] border border-[#829477]/30"
                  : "bg-[#F2C14E]/25 text-[#30251F] border border-[#F2C14E]/60"
              }`}
            >
              {isPaid ? "Payment Confirmed" : "Awaiting Payment"}
            </span>

            <h1 className="text-xl sm:text-3xl font-extrabold text-[#30251F] font-heading tracking-tight">
              Order #{order.order_number}
            </h1>

            <p className="text-xs sm:text-sm text-[#30251F]/70">
              Guest: <strong className="text-[#30251F]">{order.customer_name}</strong> • Table:{" "}
              <strong className="text-[#D94B35] bg-[#D94B35]/10 px-2 py-0.5 rounded-lg border border-[#D94B35]/20">
                {order.table?.table_code}
              </strong>
            </p>
          </div>

          {/* Amount Box */}
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#FFF9F0] border border-[#30251F]/10 flex items-center justify-between">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#30251F]/60 block">
                Total Bill
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#D94B35] font-heading">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#30251F]/60 block">
                Payment Method
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold uppercase bg-white border border-[#30251F]/15 text-[#30251F] shadow-2xs">
                {method.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Payment Specific Instructions */}
          {!isPaid && (
            <div className="space-y-4">
              {method === "qris" ? (
                /* QRIS: Aligned vertically down centered */
                <div className="flex flex-col items-center justify-center text-center p-4 sm:p-6 rounded-2xl bg-[#FFF9F0] border border-[#F2C14E]/60 space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center justify-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-[#F2C14E]/60 text-[10px] sm:text-xs font-bold text-[#30251F] uppercase shadow-2xs">
                    <span>📱</span>
                    <span>Scan QRIS Code</span>
                  </div>

                  <div className="flex items-center justify-center p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-[#30251F]/10">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=RESTOMAYO-${order.order_number}-${order.total_amount}`}
                      alt="QRIS Barcode"
                      decoding="async"
                      className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl block mx-auto"
                    />
                  </div>

                  <p className="text-[11px] sm:text-xs text-[#30251F]/70 max-w-sm mx-auto text-center leading-relaxed">
                    Scan with any Indonesian banking app (BCA, Mandiri, BRI, BNI) or e-wallet (GoPay, OVO, DANA, ShopeePay).
                  </p>
                </div>
              ) : method === "bank_transfer" ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F0] border border-[#F2C14E]/60 space-y-3">
                  <span className="text-xs font-bold text-[#30251F] block uppercase tracking-wider">
                    Bank Transfer Destination Account
                  </span>
                  <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#30251F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-[#30251F]/60 uppercase font-bold block">
                        Bank Rakyat Indonesia (BRI)
                      </span>
                      <span className="text-base sm:text-lg font-mono font-bold text-[#30251F] tracking-wider block">
                        1234-01-000567-53-8
                      </span>
                      <span className="text-xs text-[#30251F]/70 block">
                        a.n. PT Resto Mayo Nusantara
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("123401000567538")}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#FFF9F0] hover:bg-[#F2C14E]/20 text-xs font-bold text-[#30251F] transition-colors border border-[#30251F]/15 cursor-pointer shrink-0"
                    >
                      {copied ? "Copied!" : "Copy Account"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F0] border border-[#F2C14E]/60 space-y-3">
                  <span className="text-xs font-bold text-[#30251F] block uppercase tracking-wider">
                    Digital Wallet Destination ({method.toUpperCase()})
                  </span>
                  <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#30251F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-[#30251F]/60 uppercase font-bold block">
                        {method.toUpperCase()} Official
                      </span>
                      <span className="text-base sm:text-lg font-mono font-bold text-[#30251F] block">
                        0877-5500-0371
                      </span>
                      <span className="text-xs text-[#30251F]/70 block">Resto Mayo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("087755000371")}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#FFF9F0] hover:bg-[#F2C14E]/20 text-xs font-bold text-[#30251F] transition-colors border border-[#30251F]/15 cursor-pointer shrink-0"
                    >
                      {copied ? "Copied!" : "Copy Number"}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {confirming ? (
                  <span>Confirming Payment...</span>
                ) : (
                  <span>I Have Completed Payment &rarr;</span>
                )}
              </button>
            </div>
          )}

          {/* Order Ready Alert Notification Banner */}
          {order.status === "ready" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F2C14E]/30 border-2 border-[#F2C14E] text-[#30251F] shadow-md flex items-start space-x-3 sm:space-x-3.5">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#D94B35] text-white flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-xs">
                🔔
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#D94B35] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                    Siap Diambil / Order Ready
                  </span>
                  <span className="text-xs font-bold text-[#30251F]">
                    Meja {order.table?.table_code}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#30251F] font-heading mt-1">
                  Pesanan Anda Sudah Selesai Disiapkan! 🎉
                </h4>
                <p className="text-[11px] sm:text-xs text-[#30251F]/80 mt-1 leading-relaxed">
                  Makanan dan minuman Anda sudah siap. Silakan ambil pesanan di counter pick-up dengan menyebutkan{" "}
                  <strong>Meja {order.table?.table_code}</strong> (#{order.order_number}) atau pelayan kami akan mengantarkannya ke meja Anda.
                </p>
              </div>
            </div>
          )}

          {order.status === "completed" && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#829477]/15 border border-[#829477]/30 text-[#30251F] flex items-center space-x-3">
              <span className="text-xl sm:text-2xl">🍽️</span>
              <div className="text-xs">
                <h4 className="font-bold text-[#30251F]">Pesanan Telah Selesai Dihidangkan</h4>
                <p className="text-[#30251F]/70">Selamat menikmati sajian hangat lezat di Resto Mayo!</p>
              </div>
            </div>
          )}

          {/* Kitchen Order Progress Tracker */}
          <div className="space-y-3 pt-4 sm:pt-5 border-t border-[#30251F]/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#30251F]/70 flex items-center space-x-1.5 font-heading">
              <span>👨‍🍳</span>
              <span>Kitchen Preparation Status</span>
            </h3>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
              {[
                { key: "pending", label: "Received", icon: "📋" },
                { key: "processing", label: "Cooking", icon: "🍳" },
                { key: "ready", label: "Ready", icon: "🔔" },
                { key: "completed", label: "Served", icon: "🍽️" },
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
                        ? "bg-[#FFF9F0] border-[#D94B35] text-[#D94B35] font-bold shadow-xs scale-102"
                        : isPassed
                        ? "bg-[#829477]/15 border-[#829477]/30 text-[#829477] font-semibold"
                        : "bg-[#FFF9F0]/60 border-[#30251F]/10 text-[#30251F]/40"
                    }`}
                  >
                    <span className="text-sm sm:text-base block mb-0.5">{step.icon}</span>
                    <span className="text-[9px] sm:text-[11px] block truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="space-y-3 pt-5 border-t border-[#30251F]/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#30251F]/70 flex items-center space-x-1.5 font-heading">
              <span>🍜</span>
              <span>Ordered Items Breakdown</span>
            </h3>
            <div className="divide-y divide-[#30251F]/8">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex justify-between items-start text-xs"
                >
                  <div className="pr-2">
                    <span className="font-bold text-[#30251F] text-sm">
                      {item.product.name}
                    </span>
                    <span className="text-[#30251F]/60 ml-2">x{item.quantity}</span>
                    {item.notes && (
                      <span className="block text-xs text-[#D94B35] mt-0.5">
                        {item.notes}
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-[#D94B35] text-sm shrink-0 font-heading">
                    {formatRupiah(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Review & AI Sentiment Section */}
          <div className="pt-5 border-t border-[#30251F]/10">
            {order.review ? (
              <div className="p-5 rounded-2xl bg-[#FFF9F0] border border-[#30251F]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🌟</span>
                    <div>
                      <h3 className="text-sm font-bold text-[#30251F] font-heading">
                        Your Dining Feedback
                      </h3>
                      <span className="text-[11px] text-[#30251F]/60">
                        Processed by Gemini AI Quality Assurance
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`text-base ${
                          s <= order.review!.rating ? "text-[#F2C14E]" : "text-[#30251F]/20"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {order.review.comment && (
                  <p className="text-xs text-[#30251F]/85 italic bg-white p-3 rounded-xl border border-[#30251F]/10 shadow-2xs">
                    &ldquo;{order.review.comment}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {order.review.category && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white text-[#30251F] border border-[#30251F]/15 font-semibold">
                      <span>✨ Topic:</span>
                      <span>{order.review.category}</span>
                    </span>
                  )}
                  {order.review.sentiment && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        order.review.sentiment === "positive"
                          ? "bg-[#829477]/20 text-[#829477] border border-[#829477]/40"
                          : order.review.sentiment === "negative"
                          ? "bg-[#D94B35]/15 text-[#D94B35] border border-[#D94B35]/30"
                          : "bg-[#30251F]/10 text-[#30251F] border border-[#30251F]/20"
                      }`}
                    >
                      {order.review.sentiment}
                    </span>
                  )}
                  {order.review.is_critical && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-[#D94B35]/15 text-[#D94B35] border border-[#D94B35]/30">
                      ⚠️ Notified to Restaurant Manager
                    </span>
                  )}
                </div>

                {order.review.ai_summary && (
                  <p className="text-xs text-[#30251F]/70 pt-2 border-t border-[#30251F]/10">
                    <strong className="text-[#30251F]">Chef Gemini Note:</strong>{" "}
                    {order.review.ai_summary}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#FFF9F0] border border-[#30251F]/10 space-y-4">
                <div>
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white text-[#30251F] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#30251F]/15">
                    <span>✨</span>
                    <span>AI Dining Feedback</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#30251F] font-heading">
                    How was your meal &amp; service?
                  </h3>
                  <p className="text-xs text-[#30251F]/70 mt-0.5">
                    Rate your visit. Gemini AI categorizes feedback to help our kitchen continually refine dishes and speed.
                  </p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-3.5">
                  {/* Star selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#30251F]">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        >
                          <span
                            className={
                              (hoverRating || rating) >= star
                                ? "text-[#F2C14E]"
                                : "text-[#30251F]/20"
                            }
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#D94B35] ml-2 font-heading">
                      {rating === 5
                        ? "Outstanding! 😍"
                        : rating === 4
                        ? "Very Good! 😊"
                        : rating === 3
                        ? "Okay 🙂"
                        : rating === 2
                        ? "Needs Improvement 😕"
                        : "Disappointing 😞"}
                    </span>
                  </div>

                  {/* Comment field */}
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Tell us what you loved, food temperature, flavor, or beverage pairing..."
                    className="w-full text-xs p-3 rounded-xl border border-[#30251F]/20 focus:ring-2 focus:ring-[#D94B35] focus:outline-none bg-white shadow-2xs resize-none placeholder:text-[#30251F]/40"
                  />

                  {reviewError && (
                    <p className="text-xs text-[#D94B35] font-medium">{reviewError}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-2"
                    >
                      {submittingReview ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>AI Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Submit Feedback</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
