"use client";

import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import TableSelectModal from "../components/TableSelectModal";
import OpeningScene from "../components/OpeningScene";
import FoodCopilotModal from "../components/FoodCopilotModal";
import { useCart } from "../context/CartContext";
import { getOptimizedImageUrl } from "../lib/image";

function TableQrDetector() {
  const searchParams = useSearchParams();
  const { tableCode, setCustomerInfo, customerName } = useCart();
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const paramTable = searchParams.get("table") || searchParams.get("meja");
    if (paramTable && (!tableCode || tableCode.toLowerCase() !== paramTable.toLowerCase())) {
      fetch("/api/tables")
        .then((res) => (res.ok ? res.json() : []))
        .then((tables: Array<{ id: number; table_code: string; table_number: number }>) => {
          const matched = tables.find(
            (t) =>
              t.table_code.toLowerCase() === paramTable.toLowerCase() ||
              t.table_number.toString() === paramTable
          );
          if (matched) {
            setCustomerInfo(customerName || "", matched.table_code, matched.id);
            setToastMsg(`✨ Automatically connected to Table ${matched.table_code}!`);
            setTimeout(() => setToastMsg(""), 5000);
          }
        })
        .catch((e) => console.error("Error auto-detecting table from QR", e));
    }
  }, [searchParams, tableCode, customerName, setCustomerInfo]);

  if (!toastMsg) return null;

  return (
    <div className="fixed top-16 sm:top-20 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 duration-300">
      <div className="bg-yellow-400 text-red-950 px-4 py-2.5 rounded-2xl shadow-xl font-black text-xs flex items-center space-x-2 border-2 border-red-600">
        <span className="text-base">🪑</span>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  is_available: boolean;
  category?: Category;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [editingNoteItem, setEditingNoteItem] = useState<{ id: number; name: string; notes: string } | null>(null);

  const {
    cart,
    addToCart,
    updateQuantity,
    updateNotes,
    totalItems,
    totalAmount,
    tableCode,
    customerName,
  } = useCart();

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (e) {
      console.error("Error fetching menu data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter products by category & search (deferred for 60fps mobile responsiveness)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.category_id.toString() === selectedCategory;
      const matchSearch =
        !deferredSearchQuery.trim() ||
        p.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, deferredSearchQuery]);

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] pb-24 sm:pb-28">
      {/* Auto-detect table from QR scan URL (?table=M01) */}
      <Suspense fallback={null}>
        <TableQrDetector />
      </Suspense>

      {/* Splash Intro */}
      <OpeningScene />

      {/* Navigation - Clean and without admin shortcut */}
      <Navbar onSelectTableClick={() => setIsTableModalOpen(true)} />

      {/* Table Select Modal */}
      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      {/* AI Food Copilot Modal */}
      <FoodCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        products={products}
        onAddToCart={addToCart}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        
        {/* Banner Section - Appetizing Red & Yellow Food Banner (Responsive for Phone & Desktop) */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white p-4 sm:p-10 mb-5 sm:mb-8 shadow-lg shadow-red-700/20 border-2 border-yellow-400">
          <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-yellow-400 to-transparent"></div>
          
          <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-yellow-400 text-red-950 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>🌶️ Chef&apos;s Specials &amp; Crispy Mayo Delights 🧀</span>
            </div>

            <h1 className="text-xl sm:text-4xl lg:text-5xl font-black font-poppins tracking-tight text-white drop-shadow-md">
              Welcome to <span className="text-yellow-300 drop-shadow-lg">Resto Mayo</span>
            </h1>

            <p className="text-[11px] sm:text-base text-yellow-50 font-medium leading-relaxed drop-shadow-xs line-clamp-2 sm:line-clamp-none">
              Indulge in authentic savory cuisine: Golden crispy melted cheese mayo risoles, wok-charred fried rice, flame-grilled mentai dimsum, and handcrafted iced beverages!
            </p>

            {/* Table status banner if not set */}
            {!tableCode ? (
              <div className="pt-1 sm:pt-2">
                <button
                  onClick={() => setIsTableModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-red-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-sm sm:text-base">🪑</span>
                  <span>Select Dining Table</span>
                  <span>&rarr;</span>
                </button>
              </div>
            ) : (
              <div className="pt-1 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-red-900/60 border border-yellow-400/50 text-[11px] sm:text-xs text-yellow-200 font-bold backdrop-blur-xs">
                <span>📍 Table: <strong className="text-yellow-300 font-black">{tableCode}</strong></span>
                <span>•</span>
                <span>👤 Guest: <strong className="text-white">{customerName || "Guest"}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-yellow-400 shadow-sm scale-102"
                  : "bg-white text-gray-700 hover:bg-yellow-50/70 border border-amber-200"
              }`}
            >
              🍽️ All ({products.length})
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id.toString();
              const count = products.filter((p) => p.category_id === cat.id).length;
              const emoji = cat.name.toLowerCase().includes("minum") || cat.name.toLowerCase().includes("beverage") ? "🥤" : cat.name.toLowerCase().includes("dimsum") ? "🥟" : "🍛";
              const displayName = cat.name.toLowerCase() === "makanan" ? "Food" : cat.name.toLowerCase() === "minuman" ? "Beverages" : cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                  className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-yellow-400 shadow-sm scale-102"
                      : "bg-white text-gray-700 hover:bg-yellow-50/70 border border-amber-200"
                  }`}
                >
                  {emoji} {displayName} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Food Copilot */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-red-950 font-black text-xs sm:text-sm shadow-xs border-2 border-red-600 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Search menu with natural language AI"
            >
              <span>✨</span>
              <span>AI Copilot</span>
            </button>

            {/* Search Box */}
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes or drinks..."
                className="w-full pl-9 pr-8 py-2 rounded-xl sm:rounded-2xl bg-white border border-amber-200 text-xs sm:text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-yellow-300 shadow-2xs font-medium"
              />
              <svg
                className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-2.5 sm:top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 text-xs text-amber-700 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Product Cards Grid - 2 columns on mobile, 3-4 on desktop */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-amber-100 animate-pulse space-y-2">
                <div className="w-full h-28 sm:h-44 bg-amber-100/50 rounded-xl sm:rounded-2xl"></div>
                <div className="h-3.5 bg-amber-100 rounded-md w-3/4"></div>
                <div className="h-2.5 bg-amber-100 rounded-md w-full hidden sm:block"></div>
                <div className="h-5 bg-amber-100 rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl sm:rounded-3xl border border-amber-200 p-6 shadow-xs">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-yellow-100 text-red-700 flex items-center justify-center text-2xl sm:text-3xl">
              🍳
            </div>
            <h3 className="text-base sm:text-lg font-black text-red-950 font-poppins">No menu items found</h3>
            <p className="text-xs text-amber-800 mt-1">Try another keyword or select a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id);
              const inCart = Boolean(cartItem);

              return (
                <div
                  key={product.id}
                  className="menu-grid-card bg-white rounded-2xl sm:rounded-3xl border border-amber-100 hover:border-yellow-400 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                >
                  {/* Image only (lazy loaded and async decoded for lightweight mobile running) */}
                  <div className="relative h-28 sm:h-48 w-full overflow-hidden bg-amber-50">
                    <img
                      src={getOptimizedImageUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {!product.is_available && (
                      <div className="absolute inset-0 bg-red-950/70 backdrop-blur-2xs flex items-center justify-center p-2 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase text-white bg-red-600 shadow-md border border-yellow-300">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-bold sm:font-black text-xs sm:text-base text-gray-900 group-hover:text-red-700 transition-colors font-poppins line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                        {product.description || "Special delicious dish crafted by Resto Mayo."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[8px] sm:text-[10px] text-amber-700 font-bold block uppercase tracking-wider">Price</span>
                        <span className="text-xs sm:text-base font-black text-red-600 font-poppins">
                          {formatRupiah(product.price)}
                        </span>
                      </div>

                      {/* Add / Quantity Buttons - Compact for mobile */}
                      <div>
                        {!inCart ? (
                          <button
                            disabled={!product.is_available}
                            onClick={() => {
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: Number(product.price),
                                image: product.image,
                                categoryName: product.category?.name,
                              });
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-[11px] sm:text-xs shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-yellow-400/40"
                          >
                            <span className="text-yellow-300 font-bold">+</span>
                            <span>Order</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1 bg-yellow-50 p-0.5 sm:p-1 rounded-xl border border-yellow-400">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white text-red-700 font-black text-xs flex items-center justify-center hover:bg-red-50 shadow-2xs border border-amber-200 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-4 sm:w-5 text-center font-black text-[11px] sm:text-xs text-red-900 font-poppins">
                              {cartItem?.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center hover:bg-red-700 shadow-2xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick note indicator if item in cart */}
                    {inCart && (
                      <button
                        onClick={() =>
                          setEditingNoteItem({
                            id: product.id,
                            name: product.name,
                            notes: cartItem?.notes || "",
                          })
                        }
                        className="text-[10px] text-amber-800 hover:text-red-700 text-left flex items-center space-x-1 pt-1 border-t border-amber-100 font-medium cursor-pointer"
                      >
                        <span className="text-amber-500">📝</span>
                        <span className="truncate">
                          {cartItem?.notes ? `Note: "${cartItem.notes}"` : "+ Chef\u0027s note"}
                        </span>
                      </button>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar - Minimalist & Compact for Phone */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 sm:bottom-6 inset-x-0 z-40 max-w-xl mx-auto px-3 sm:px-4 gpu-accelerated">
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-xl shadow-red-700/30 border-2 border-yellow-400 flex items-center justify-between backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center space-x-2 sm:space-x-3.5">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-yellow-400 text-red-950 font-black text-xs sm:text-base flex items-center justify-center shadow-md border-2 border-white shrink-0">
                {totalItems}
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-yellow-300 font-bold uppercase tracking-wider block">
                  Selected Orders
                </span>
                <span className="text-xs sm:text-lg font-black font-poppins text-white">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <Link
              href="/cart"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-red-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-yellow-200 cursor-pointer"
            >
              <span>Cart</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* Note Editing Modal */}
      {editingNoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border-2 border-yellow-400 space-y-3.5">
            <h3 className="font-black text-sm sm:text-base text-red-950 font-poppins">
              Notes for: <span className="text-red-600">{editingNoteItem.name}</span>
            </h3>
            <textarea
              rows={3}
              value={editingNoteItem.notes}
              onChange={(e) =>
                setEditingNoteItem({ ...editingNoteItem, notes: e.target.value })
              }
              placeholder="E.g. Extra spicy, sauce on the side, no onions..."
              className="w-full p-2.5 rounded-xl border border-amber-200 text-xs sm:text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-yellow-300"
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateNotes(editingNoteItem.id, editingNoteItem.notes);
                  setEditingNoteItem(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs shadow-md border border-yellow-400 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
