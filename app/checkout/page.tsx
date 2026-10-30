"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import RestoMayoLogo from "../../components/RestoMayoLogo";

interface Table {
  id: number;
  table_code: string;
  table_number: number;
  status: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, customerName, tableCode, tableId, setCustomerInfo, clearCart, totalItems, totalAmount } = useCart();

  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState<string>(customerName || "");
  const [selectedTableId, setSelectedTableId] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("qris");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchTables = React.useCallback(async () => {
    try {
      const res = await fetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (tableId) {
          setSelectedTableId(tableId);
        } else if (tableCode) {
          const match = data.find((t: Table) => t.table_code === tableCode);
          if (match) setSelectedTableId(match.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [tableId, tableCode]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cart.length === 0) {
      setErrorMsg("Your order cart is empty.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (!selectedTableId) {
      setErrorMsg("Please select your table number.");
      return;
    }

    try {
      setSubmitting(true);
      const chosenTable = tables.find((t) => t.id === Number(selectedTableId));
      if (chosenTable) {
        setCustomerInfo(name.trim(), chosenTable.table_code, chosenTable.id);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          table_id: selectedTableId,
          payment_method: paymentMethod,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit order");
      }

      clearCart();
      router.push(`/payment/${data.order_number}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while processing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  const paymentOptions = [
    { id: "qris", title: "QRIS", desc: "BCA, GoPay, OVO, etc." },
    { id: "gopay", title: "GoPay", desc: "E-Wallet" },
    { id: "dana", title: "DANA", desc: "E-Wallet" },
    { id: "shopeepay", title: "ShopeePay", desc: "E-Wallet" },
    { id: "bank_transfer", title: "BRI Transfer", desc: "Direct Bank Transfer" },
    { id: "ovo", title: "OVO", desc: "E-Wallet" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] pb-16">
      
      {/* Top Accent Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-resto-red-600 via-resto-yellow-500 to-resto-red-700"></div>

      {/* Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-resto-yellow-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <Link
              href="/cart"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-stone-700 hover:text-resto-red-700 hover:bg-resto-red-50 text-[11px] sm:text-xs font-semibold transition-colors border border-resto-yellow-200/80 bg-white shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-resto-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </Link>

            <Link href="/" className="flex items-center space-x-2">
              <RestoMayoLogo size="sm" showText={true} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-5 sm:mb-8">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 mb-1.5 shadow-2xs">
            <span>✨</span>
            <span>Final Ordering Step</span>
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 font-poppins">
            Table Confirmation &amp; Payment
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-stone-500 mt-1">
            Complete your details and table number so the kitchen can prepare your meal.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-resto-red-50 border border-resto-red-200 text-xs sm:text-sm text-resto-red-700 font-medium flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleProcessOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
          
          {/* Form Columns (2 Cols) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Section 1: Table & Customer */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-resto-yellow-200/80 shadow-xs p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 font-poppins pb-2.5 sm:pb-3 border-b border-resto-yellow-100 flex items-center space-x-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-resto-red-600 to-resto-red-700 text-resto-yellow-300 text-[10px] sm:text-xs flex items-center justify-center font-black shadow-xs">1</span>
                <span>Table &amp; Guest Information</span>
              </h2>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 font-poppins">
                  Guest Full Name <span className="text-resto-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. John Doe"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-resto-yellow-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-resto-red-500 focus:border-resto-yellow-400 transition-all bg-white"
                />
              </div>

              {/* Table Selection */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 font-poppins">
                  Select Your Table Number <span className="text-resto-red-600">*</span>
                </label>
                <select
                  required
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-resto-yellow-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-resto-red-500 focus:border-resto-yellow-400 transition-all bg-white text-stone-800 cursor-pointer"
                >
                  <option value="">-- Choose Resto Mayo Table --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_code} (Table #{t.table_number}) {t.status === "occupied" ? "• Occupied" : "• Available"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 2: Payment Method */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-resto-yellow-200/80 shadow-xs p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 font-poppins pb-2.5 sm:pb-3 border-b border-resto-yellow-100 flex items-center space-x-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-resto-red-600 to-resto-red-700 text-resto-yellow-300 text-[10px] sm:text-xs flex items-center justify-center font-black shadow-xs">2</span>
                <span>Select Payment Method</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {paymentOptions.map((opt) => {
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`relative flex flex-col p-2.5 sm:p-3.5 border rounded-xl sm:rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? "border-resto-red-600 bg-resto-yellow-50/80 ring-2 ring-resto-red-600/30 shadow-xs"
                          : "border-resto-yellow-200/70 hover:border-resto-yellow-400 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => setPaymentMethod(opt.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs sm:text-sm ${isSelected ? "text-resto-red-700" : "text-stone-800"}`}>
                          {opt.title}
                        </span>
                        <span
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-resto-red-600 bg-resto-red-600" : "border-stone-300"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-resto-yellow-300"></span>}
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-stone-400 mt-1">{opt.desc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Summary Column */}
          <div className="space-y-4">
            <div className="bg-gradient-to-b from-white to-resto-yellow-50/30 rounded-2xl sm:rounded-3xl border border-resto-yellow-200 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6 sticky top-20 sm:top-24">
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-resto-yellow-200/80">
                <h2 className="text-sm sm:text-base font-bold text-stone-900 font-poppins">
                  Your Order ({totalItems})
                </h2>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300">
                  Menu Items
                </span>
              </div>

              {/* Mini Item List */}
              <div className="max-h-48 sm:max-h-56 overflow-y-auto divide-y divide-resto-yellow-100 space-y-1.5 sm:space-y-2 pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-stone-800 text-[11px] sm:text-xs">{item.name}</span>
                      <span className="text-stone-400 block text-[10px] sm:text-[11px]">x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-resto-red-700 text-xs sm:text-sm">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-resto-yellow-200/80 text-[11px] sm:text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tax &amp; Service</span>
                  <span className="text-emerald-700 font-bold">Included</span>
                </div>
                <div className="pt-2.5 sm:pt-3 border-t border-resto-yellow-200/80 flex justify-between items-baseline">
                  <span className="text-xs sm:text-sm font-bold text-stone-900">Total Payment</span>
                  <span className="text-lg sm:text-xl font-black text-resto-red-700 font-poppins">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl shadow-resto-red-600/25 transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Sending Order...</span>
                ) : (
                  <span>Send Order to Kitchen &rarr;</span>
                )}
              </button>

              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-resto-yellow-100/70 border border-resto-yellow-200 text-[9px] sm:text-[10px] text-stone-600 text-center leading-relaxed flex items-center space-x-1.5">
                <span>🔔</span>
                <span>Your order ticket will instantly appear on the chef&apos;s Kitchen Display System (KDS).</span>
              </div>
            </div>
          </div>

        </form>

      </main>

    </div>
  );
}
