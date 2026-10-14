"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import RestoMayoLogo from "../../components/RestoMayoLogo";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, updateNotes, removeFromCart, clearCart, totalItems, totalAmount, tableCode } = useCart();
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] pb-16">
      
      {/* Top Accent Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-resto-red-600 via-resto-yellow-500 to-resto-red-700"></div>

      {/* Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-resto-yellow-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            
            {/* Back to menu */}
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-stone-700 hover:text-resto-red-700 hover:bg-resto-red-50 text-[11px] sm:text-xs font-semibold transition-colors border border-resto-yellow-200/80 bg-white shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-resto-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Menu</span>
            </Link>

            {/* Brand */}
            <Link href="/" className="flex items-center space-x-2">
              <RestoMayoLogo size="sm" showText={true} />
            </Link>

            {/* Table Badge */}
            <div>
              {tableCode ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 shadow-2xs">
                  Meja {tableCode}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs text-stone-400 font-medium">Meja di checkout</span>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        
        {/* Title */}
        <div className="border-b border-resto-yellow-200/60 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-resto-red-50 text-resto-red-700 border border-resto-red-200 mb-2">
              <span>🛒</span>
              <span>Daftar Santapan Anda</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-poppins">
              Keranjang Pesanan Resto Mayo
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Periksa kembali hidangan favorit Anda sebelum lanjut ke pembayaran dan proses dapur.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin mengosongkan keranjang?")) {
                  clearCart();
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-resto-red-700 hover:bg-resto-red-50 transition-colors self-start sm:self-auto cursor-pointer border border-transparent hover:border-resto-red-200"
            >
              <svg className="w-4 h-4 text-resto-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Kosongkan Pesanan</span>
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-sm p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-resto-yellow-100 text-resto-red-700 flex items-center justify-center text-3xl shadow-xs border border-resto-yellow-200">
              🍜
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-poppins">Keranjang masih kosong</h2>
            <p className="text-xs text-stone-500">
              Anda belum menambahkan makanan atau minuman ke dalam keranjang. Yuk pilih menu lezat sekarang!
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 text-white font-bold text-xs shadow-md shadow-resto-red-600/20 transition-all active:scale-95"
              >
                <span>Buka Menu Resto Mayo</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Items List (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-resto-yellow-200/80 shadow-xs divide-y divide-resto-yellow-100/70 overflow-hidden">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-resto-yellow-50/20 transition-colors">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"}
                        alt={item.name}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover shrink-0 bg-resto-yellow-50 border border-resto-yellow-200/60 shadow-2xs"
                      />
                      <div className="space-y-0.5 sm:space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-200">
                          {item.categoryName || "Resto Mayo"}
                        </span>
                        <h3 className="font-bold text-xs sm:text-base text-stone-900 font-poppins">
                          {item.name}
                        </h3>
                        <div className="text-xs sm:text-sm font-extrabold text-resto-red-700">
                          {formatRupiah(item.price)}
                        </div>

                        {/* Notes snippet or trigger */}
                        <div className="pt-0.5 sm:pt-1">
                          {editingNotesId === item.id ? (
                            <div className="flex items-center space-x-1.5 sm:space-x-2 mt-1">
                              <input
                                type="text"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Tulis catatan (cth: pedas, tanpa es)..."
                                className="px-2.5 py-1 rounded-xl border border-resto-yellow-300 text-xs focus:outline-none focus:ring-1 focus:ring-resto-red-500 w-full sm:w-64 bg-white"
                              />
                              <button
                                onClick={() => {
                                  updateNotes(item.id, tempNotes);
                                  setEditingNotesId(null);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-resto-red-700 hover:bg-resto-red-800 text-white text-[10px] sm:text-[11px] font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNotesId(item.id);
                                setTempNotes(item.notes || "");
                              }}
                              className="text-[10px] sm:text-[11px] text-stone-500 hover:text-resto-red-700 flex items-center space-x-1 cursor-pointer"
                            >
                              <span className="text-resto-yellow-600">📝</span>
                              <span className="truncate max-w-[200px] sm:max-w-none">
                                {item.notes ? `"${item.notes}" (Ubah)` : "+ Catatan khusus"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="flex items-center space-x-1 sm:space-x-2 bg-resto-yellow-50/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-resto-yellow-200">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-white text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-resto-yellow-100 shadow-2xs border border-resto-yellow-200/60 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 sm:w-8 text-center font-bold text-xs text-stone-900 font-poppins">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-resto-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-resto-red-800 shadow-2xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[75px] sm:min-w-[90px]">
                        <span className="text-[10px] text-stone-400 block sm:hidden">Subtotal</span>
                        <span className="font-extrabold text-xs sm:text-base text-resto-red-700 font-poppins">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-300 hover:text-resto-red-600 p-1 rounded-lg cursor-pointer text-xs sm:text-sm"
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Column (1 Col) */}
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-white to-resto-yellow-50/30 rounded-3xl border border-resto-yellow-200 shadow-md p-6 space-y-6 sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-200/80">
                  <h2 className="text-base font-bold text-stone-900 font-poppins">
                    Ringkasan Transaksi
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-resto-red-100 text-resto-red-700">
                    {totalItems} Menu
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Jumlah Item ({totalItems})</span>
                    <span className="font-semibold text-stone-900">{formatRupiah(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Pajak Restoran &amp; PB1</span>
                    <span className="text-emerald-700 font-bold">Sudah Termasuk</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Biaya Layanan Meja</span>
                    <span className="text-emerald-700 font-bold">Gratis</span>
                  </div>

                  <div className="pt-4 border-t border-resto-yellow-200/80 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-stone-900">Total Tagihan</span>
                    <span className="text-xl sm:text-2xl font-black text-resto-red-700 font-poppins">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-sm shadow-xl shadow-resto-red-600/25 transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Lanjut ke Pembayaran &rarr;</span>
                </button>

                <div className="p-3 rounded-2xl bg-resto-yellow-100/70 border border-resto-yellow-200 text-[11px] text-stone-600 text-center leading-relaxed flex items-center space-x-2">
                  <span className="text-base">🍳</span>
                  <span>Setelah konfirmasi checkout, dapur Resto Mayo akan segera menerima pesanan Anda.</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}

