"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import RestoMayoLogo from "../../components/RestoMayoLogo";
import SmartUpsell from "../../components/SmartUpsell";

interface Table {
  id: number;
  table_code: string;
  table_number: number;
  status: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    addToCart,
    customerName,
    tableCode,
    tableId,
    setCustomerInfo,
    clearCart,
    totalItems,
    totalAmount,
  } = useCart();

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
          const match = data.find((t: Table) => t.id === Number(tableId));
          if (match && match.status !== "occupied") {
            setSelectedTableId(match.id);
          } else {
            setSelectedTableId("");
          }
        } else if (tableCode) {
          const match = data.find((t: Table) => t.table_code === tableCode);
          if (match && match.status !== "occupied") {
            setSelectedTableId(match.id);
          } else {
            setSelectedTableId("");
          }
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
      setErrorMsg("Your order cart is empty. Please select dishes first.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (!selectedTableId) {
      setErrorMsg("Please choose your table number.");
      return;
    }

    try {
      setSubmitting(true);
      const chosenTable = tables.find((t) => t.id === Number(selectedTableId));
      if (!chosenTable) {
        setErrorMsg("Please select a valid table.");
        return;
      }
      if (chosenTable.status === "occupied") {
        setErrorMsg(
          `Meja ${chosenTable.table_code} sedang digunakan pelanggan lain. Silakan pilih meja lain yang tersedia.`
        );
        return;
      }
      setCustomerInfo(name.trim(), chosenTable.table_code, chosenTable.id);

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
            spicy_level: item.spicyLevel || null,
            options: item.options || [],
            notes: item.notes || null,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit order");
      }

      clearCart();
      if (typeof window !== "undefined") {
        localStorage.setItem("resto_mayo_active_order", data.order_number);
      }
      router.push(`/payment/${data.order_number}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while processing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  const paymentOptions = [
    { id: "qris", title: "QRIS", desc: "Instant QR (GoPay, BCA, OVO, etc.)" },
    { id: "gopay", title: "GoPay", desc: "Digital E-Wallet" },
    { id: "dana", title: "DANA", desc: "Digital E-Wallet" },
    { id: "shopeepay", title: "ShopeePay", desc: "Digital E-Wallet" },
    { id: "bank_transfer", title: "BRI Transfer", desc: "Direct Bank Transfer" },
    { id: "ovo", title: "OVO", desc: "Digital E-Wallet" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#30251F]">
      {/* Header */}
      <header className="bg-white border-b border-[#30251F]/10 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              href="/cart"
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
              <span>Back to Cart</span>
            </Link>

            <Link href="/" className="flex items-center space-x-2">
              <RestoMayoLogo size="sm" showText={true} />
            </Link>

            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F2C14E]/25 text-[#30251F] border border-[#F2C14E]/60 mb-2 shadow-2xs">
            <span>✨</span>
            <span>Final Ordering Step</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#30251F] font-heading tracking-tight">
            Table Confirmation &amp; Payment
          </h1>
          <p className="text-xs sm:text-sm text-[#30251F]/70 mt-1">
            Fill in your name, select your table, and choose how you would like to settle your bill.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-[#D94B35]/10 border border-[#D94B35]/30 text-xs sm:text-sm text-[#D94B35] font-semibold flex items-center space-x-2.5">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleProcessOrder}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {/* Left Columns: Inputs (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Guest & Table */}
            <div className="bg-white rounded-3xl border border-[#30251F]/10 shadow-sm p-5 sm:p-7 space-y-5">
              <h2 className="text-base font-bold text-[#30251F] font-heading pb-3 border-b border-[#30251F]/10 flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-[#D94B35] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Guest &amp; Table Details</span>
              </h2>

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#30251F] mb-1.5 font-heading">
                  Your Full Name <span className="text-[#D94B35]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="w-full px-4 py-3 rounded-xl border border-[#30251F]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#D94B35] focus:border-[#D94B35] transition-all bg-white"
                />
              </div>

              {/* Table Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#30251F] mb-1.5 font-heading">
                  Choose Dining Table <span className="text-[#D94B35]">*</span>
                </label>
                <select
                  required
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#30251F]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#D94B35] focus:border-[#D94B35] transition-all bg-white text-[#30251F] cursor-pointer"
                >
                  <option value="">-- Choose Resto Mayo Table --</option>
                  {tables.map((t) => {
                    const isOccupied = t.status === "occupied";
                    return (
                      <option key={t.id} value={t.id} disabled={isOccupied}>
                        Meja {t.table_code} (Table #{t.table_number}){" "}
                        {isOccupied ? "⛔ Sedang Digunakan (Occupied)" : "✓ Tersedia (Available)"}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-[#30251F]/60 mt-1.5">
                  Occupied tables are locked automatically to ensure your seat is reserved for your meal.
                </p>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl border border-[#30251F]/10 shadow-sm p-5 sm:p-7 space-y-5">
              <h2 className="text-base font-bold text-[#30251F] font-heading pb-3 border-b border-[#30251F]/10 flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-[#D94B35] text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Select Payment Method</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paymentOptions.map((opt) => {
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`relative flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#D94B35] bg-[#FFF9F0] ring-2 ring-[#D94B35]/25 shadow-xs"
                          : "border-[#30251F]/15 hover:border-[#30251F]/30 bg-white"
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
                        <span
                          className={`font-bold text-sm ${
                            isSelected ? "text-[#D94B35]" : "text-[#30251F]"
                          }`}
                        >
                          {opt.title}
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-[#D94B35] bg-[#D94B35]"
                              : "border-[#30251F]/30"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#30251F]/60 mt-1 leading-snug">
                        {opt.desc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#30251F]/10 shadow-sm p-6 space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#30251F]/10">
                <h2 className="text-base font-bold text-[#30251F] font-heading">
                  Order Summary
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D94B35]/10 text-[#D94B35]">
                  {totalItems} Items
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-[#30251F]/8 space-y-2 pr-1">
                {cart.map((item) => (
                  <div
                    key={item.key || item.id}
                    className="pt-2 flex items-start justify-between text-xs"
                  >
                    <div className="pr-2 min-w-0">
                      <span className="font-semibold text-[#30251F] block truncate">
                        {item.name}
                      </span>
                      {item.spicyLevel && (
                        <span className="text-[10px] text-[#D94B35] block">
                          {item.spicyLevel}
                        </span>
                      )}
                      {item.options && item.options.length > 0 && (
                        <span className="text-[10px] text-[#829477] block truncate">
                          + {item.options.map((o) => o.name).join(", ")}
                        </span>
                      )}
                      <span className="text-[#30251F]/50 block text-[10px]">
                        x{item.quantity} portion
                      </span>
                    </div>
                    <span className="font-bold text-[#D94B35] text-xs shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2.5 pt-3 border-t border-[#30251F]/10 text-xs">
                <div className="flex justify-between text-[#30251F]/80">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#30251F]">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-[#30251F]/80">
                  <span>Restaurant Tax (PB1)</span>
                  <span className="text-[#829477] font-bold">Included</span>
                </div>
                <div className="flex justify-between text-[#30251F]/80">
                  <span>Service Fee</span>
                  <span className="text-[#829477] font-bold">Free</span>
                </div>
                <div className="pt-3 border-t border-[#30251F]/10 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#30251F]">
                    Total Payment
                  </span>
                  <span className="text-2xl font-black text-[#D94B35] font-heading">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full py-4 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Sending Order to Kitchen...</span>
                ) : (
                  <span>Send Order to Kitchen &rarr;</span>
                )}
              </button>

              <div className="p-3 rounded-2xl bg-[#FFF9F0] border border-[#F2C14E]/40 text-[11px] text-[#30251F]/75 text-center leading-relaxed flex items-center space-x-2">
                <span>🔔</span>
                <span className="text-left">
                  Your ticket will immediately display on the kitchen screen for live preparation.
                </span>
              </div>
            </div>

            {/* AI Smart Upsell in compact mode */}
            <SmartUpsell cart={cart} onAddToCart={addToCart} compact={true} />
          </div>
        </form>
      </main>
    </div>
  );
}
