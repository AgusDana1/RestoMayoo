"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import RestoMayoLogo from "../../components/RestoMayoLogo";
import SmartUpsell from "../../components/SmartUpsell";
import { getOptimizedImageUrl } from "../../lib/image";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    addToCart,
    updateQuantity,
    updateNotes,
    removeFromCart,
    clearCart,
    totalItems,
    totalAmount,
    tableCode,
  } = useCart();

  const [editingKey, setEditingKey] = useState<string | number | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#30251F]">
      {/* Header */}
      <header className="bg-white border-b border-[#30251F]/10 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-15 sm:h-16 items-center">
            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-[#30251F] hover:text-[#D94B35] hover:bg-[#FFF9F0] transition-colors border border-[#30251F]/15 bg-white shadow-2xs"
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
              <span>Back to Menu</span>
            </Link>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <RestoMayoLogo size="sm" showText={true} />
            </Link>

            {/* Table Badge */}
            <div>
              {tableCode ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#F2C14E]/20 text-[#30251F] border border-[#F2C14E]/60 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#D94B35]"></span>
                  <span>Table {tableCode}</span>
                </span>
              ) : (
                <span className="text-xs text-[#30251F]/60 font-medium hidden sm:inline-block">
                  Select table at checkout
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full pb-28 lg:pb-8">
        {/* Title & Clear Action */}
        <div className="border-b border-[#30251F]/10 pb-5 sm:pb-6 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#D94B35]/10 text-[#D94B35] border border-[#D94B35]/20 mb-1.5">
              <span>🛒</span>
              <span>Review Your Selection</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-[#30251F] font-heading tracking-tight">
              Your Dining Order
            </h1>
            <p className="text-xs sm:text-sm text-[#30251F]/70 mt-0.5 sm:mt-1">
              Verify your dishes, customize spice and toppings, before sending directly to the kitchen.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to clear your cart?")) {
                  clearCart();
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#30251F]/60 hover:text-[#D94B35] hover:bg-[#D94B35]/10 transition-colors self-start sm:self-auto cursor-pointer border border-[#30251F]/15"
            >
              <svg
                className="w-3.5 h-3.5 text-[#D94B35]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-[#30251F]/10 shadow-sm p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 sm:space-y-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#FFF9F0] text-[#D94B35] flex items-center justify-center text-3xl sm:text-4xl border border-[#F2C14E]/40 shadow-xs">
              🍲
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#30251F] font-heading">
                Your Cart is Empty
              </h2>
              <p className="text-xs sm:text-sm text-[#30251F]/70 mt-1.5 leading-relaxed">
                You haven&apos;t added any artisanal risoles, wok-fried rice, or signature dimsum yet.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Explore Resto Mayo Menu</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Items Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#30251F]/10 shadow-xs divide-y divide-[#30251F]/8 overflow-hidden">
                {cart.map((item) => {
                  const itemIdentifier = item.key || item.id;
                  const isEditingThis = editingKey === itemIdentifier;

                  return (
                    <div
                      key={itemIdentifier}
                      className="p-3.5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 hover:bg-[#FFF9F0]/40 transition-colors"
                    >
                      {/* Product image & details */}
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                        <img
                          src={getOptimizedImageUrl(item.image)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover shrink-0 bg-[#FFF9F0] border border-[#30251F]/10 shadow-2xs"
                        />
                        <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#FFF9F0] text-[#30251F] border border-[#F2C14E]/60">
                              {item.categoryName || "Resto Mayo"}
                            </span>
                            {item.spicyLevel && (
                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#D94B35]/10 text-[#D94B35] border border-[#D94B35]/20">
                                🌶️ {item.spicyLevel}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-xs sm:text-base text-[#30251F] font-heading line-clamp-1">
                            {item.name}
                          </h3>

                          {/* Selected Custom Options */}
                          {item.options && item.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
                              {item.options.map((opt, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium bg-[#829477]/15 text-[#30251F] border border-[#829477]/30"
                                >
                                  + {opt.name}{" "}
                                  {opt.price > 0 && `(${formatRupiah(opt.price)})`}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="text-xs sm:text-sm font-extrabold text-[#D94B35] pt-0.5">
                            {formatRupiah(item.price)}
                            {item.quantity > 1 && (
                              <span className="text-[10px] sm:text-[11px] font-normal text-[#30251F]/60 ml-1.5">
                                ({formatRupiah(item.price)} / portion)
                              </span>
                            )}
                          </div>

                          {/* Notes snippet or edit form */}
                          <div className="pt-0.5 sm:pt-1">
                            {isEditingThis ? (
                              <div className="flex items-center space-x-1.5 sm:space-x-2 mt-1">
                                <input
                                  type="text"
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="Kitchen note (e.g. less salt, sauce on side)..."
                                  className="px-2.5 py-1.5 rounded-xl border border-[#30251F]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#D94B35] w-full sm:w-72 bg-white"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateNotes(itemIdentifier, tempNotes);
                                    setEditingKey(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] text-white text-xs font-bold cursor-pointer shrink-0"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingKey(null)}
                                  className="px-1.5 py-1.5 text-xs text-[#30251F]/60 hover:text-[#30251F] cursor-pointer shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKey(itemIdentifier);
                                  setTempNotes(item.notes || "");
                                }}
                                className="text-[11px] sm:text-xs text-[#30251F]/65 hover:text-[#D94B35] flex items-center space-x-1 cursor-pointer pt-0.5"
                              >
                                <span>📝</span>
                                <span className="underline underline-offset-2 truncate max-w-[200px] sm:max-w-none">
                                  {item.notes ? `"${item.notes}" (Edit)` : "+ Add kitchen instruction"}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity stepper & Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#30251F]/8">
                        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-[#FFF9F0] p-1 sm:p-1.5 rounded-xl border border-[#30251F]/15">
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemIdentifier, -1)}
                            className="w-8 h-8 rounded-lg sm:rounded-xl bg-white text-[#30251F] font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-[#F2C14E]/20 shadow-2xs border border-[#30251F]/10 cursor-pointer active:scale-95"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-7 sm:w-8 text-center font-bold text-xs sm:text-sm text-[#30251F] font-heading">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemIdentifier, 1)}
                            className="w-8 h-8 rounded-lg sm:rounded-xl bg-[#D94B35] text-white font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-[#C23E2A] shadow-2xs cursor-pointer active:scale-95"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[75px] sm:min-w-[85px]">
                          <span className="text-[9px] sm:text-[10px] text-[#30251F]/50 block sm:hidden">
                            Subtotal
                          </span>
                          <span className="font-extrabold text-xs sm:text-base text-[#D94B35] font-heading">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(itemIdentifier)}
                          className="text-[#30251F]/40 hover:text-[#D94B35] p-1.5 rounded-lg cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic AI Upselling & Pairing Recommendations */}
              <SmartUpsell cart={cart} onAddToCart={addToCart} />
            </div>

            {/* Summary Column (1 Col) */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-[#30251F]/10 shadow-sm p-5 sm:p-6 space-y-5 sm:space-y-6 sticky top-24">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#30251F]/10">
                  <h2 className="text-base font-bold text-[#30251F] font-heading">
                    Order Summary
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D94B35]/10 text-[#D94B35] border border-[#D94B35]/20">
                    {totalItems} {totalItems === 1 ? "Dish" : "Dishes"}
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#30251F]/80">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-[#30251F]">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#30251F]/80">
                    <span>Restaurant Tax (PB1 10%)</span>
                    <span className="text-[#829477] font-bold">Included</span>
                  </div>
                  <div className="flex justify-between text-[#30251F]/80">
                    <span>Table Service</span>
                    <span className="text-[#829477] font-bold">Free</span>
                  </div>

                  <div className="pt-3.5 border-t border-[#30251F]/10 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#30251F]">
                      Total Due
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#D94B35] font-heading">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <span>&rarr;</span>
                </button>

                <div className="p-3 rounded-2xl bg-[#FFF9F0] border border-[#F2C14E]/40 text-xs text-[#30251F]/80 text-center leading-relaxed flex items-center space-x-2.5">
                  <span className="text-base sm:text-lg">🍳</span>
                  <span className="text-left text-[11px] sm:text-xs">
                    Dishes are made-to-order upon payment confirmation to guarantee optimal crispiness and temperature.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Checkout Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#30251F]/10 p-3.5 shadow-2xl z-30 pb-[max(14px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <span className="text-[10px] text-[#30251F]/60 block font-medium">
                Total ({totalItems} items)
              </span>
              <span className="text-base font-black text-[#D94B35] font-heading">
                {formatRupiah(totalAmount)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="flex-1 max-w-[200px] py-3 px-4 rounded-xl bg-[#D94B35] hover:bg-[#C23E2A] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Checkout</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
