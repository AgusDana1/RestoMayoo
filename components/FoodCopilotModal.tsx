"use client";

import React, { useState } from "react";
import { getOptimizedImageUrl } from "../lib/image";

interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  is_available: boolean;
  category?: {
    id: number;
    name: string;
  };
}

interface FoodCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: {
    id: number;
    name: string;
    price: number;
    image?: string | null;
    categoryName?: string;
  }) => void;
}

interface CopilotMatch {
  productId: number;
  matchReason: string;
  product?: Product;
}

export default function FoodCopilotModal({
  isOpen,
  onClose,
  products,
  onAddToCart,
}: FoodCopilotModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [interpretedMood, setInterpretedMood] = useState("");
  const [matches, setMatches] = useState<CopilotMatch[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const quickPrompts = [
    { label: "🍲 Warm Broth < Rp 30k", text: "Lagi pengen yang kuah hangat, gurih, tapi budget di bawah 30 ribu" },
    { label: "🧀 Crispy Melty Snacks", text: "Camilan renyah dengan keju lumer yang gurih buat nemenin santai" },
    { label: "🌶️ Spicy & Cold Drink Combo", text: "Menu pedas nampol lengkap sama minuman dingin penyejuk dahaga" },
    { label: "🥗 Vegetarian Friendly", text: "Menu makanan yang aman untuk vegetarian dan tanpa daging" },
    { label: "🥟 Dimsum for Sharing", text: "Pilihan dimsum terbaik yang cocok dinikmati berdua" },
  ];

  const handleSearch = async (userQuery: string) => {
    const q = userQuery.trim();
    if (!q) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setMatches([]);
      setInterpretedMood("");

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "food-copilot",
          query: q,
          allProducts: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            description: p.description,
            is_available: p.is_available,
            category: p.category,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to consult Food Copilot");
      }

      const data = await res.json();
      setInterpretedMood(data.interpretedMood || "");

      if (data.matches && Array.isArray(data.matches)) {
        const resolved = data.matches
          .map((m: any) => {
            const found = products.find((p) => p.id === m.productId);
            return found ? { ...m, product: found } : null;
          })
          .filter(Boolean);
        setMatches(resolved);
      }
    } catch (err: any) {
      console.error("Food Copilot error:", err);
      setErrorMsg("Food Copilot is momentarily catching its breath. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (product: Product) => {
    onAddToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      categoryName: product.category?.name,
    });
    setAddedIds((prev) => [...prev, product.id]);
  };

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-yellow-400 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-resto-red-700 via-resto-red-600 to-amber-600 text-white p-4 sm:p-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-yellow-400 text-red-950 font-black text-lg flex items-center justify-center shadow-md">
                ✨
              </span>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-red-950 inline-block">
                  Gemini AI Powered
                </span>
                <h2 className="text-base sm:text-xl font-black font-poppins text-white leading-tight">
                  Food Copilot
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-yellow-100 mt-2 font-medium">
            Describe what you crave in your own words, and Gemini will find the exact dishes for you!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="space-y-2"
          >
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g. Warm broth under 30k, or crispy snacks for two..."
                className="w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-amber-300 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-yellow-300 text-xs sm:text-sm bg-white font-medium shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 disabled:opacity-40 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center"
              >
                {loading ? "..." : "Ask"}
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
              Try Quick Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(p.text);
                    handleSearch(p.text);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-50 hover:bg-yellow-100 text-stone-700 border border-amber-200 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-resto-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-stone-500 font-medium animate-pulse">
                Food Copilot is crafting the best recommendations for your craving...
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Results Display */}
          {interpretedMood && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 flex items-center space-x-2">
              <span className="text-base">🎯</span>
              <div className="text-xs">
                <span className="font-bold text-resto-red-900 block font-poppins">
                  Understood your craving:
                </span>
                <span className="text-stone-700 italic">&ldquo;{interpretedMood}&rdquo;</span>
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-poppins">
                Recommended Menu ({matches.length})
              </h4>
              <div className="space-y-2.5">
                {matches.map((item) => {
                  const prod = item.product;
                  if (!prod) return null;
                  const isAdded = addedIds.includes(prod.id);

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-amber-200 hover:border-yellow-400 p-3 flex items-center justify-between gap-3 shadow-2xs transition-all"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img
                          src={getOptimizedImageUrl(prod.image)}
                          alt={prod.name}
                          loading="lazy"
                          decoding="async"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 bg-yellow-50 border border-amber-200 shadow-2xs"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="font-black text-xs sm:text-sm text-stone-900 font-poppins truncate">
                            {prod.name}
                          </h5>
                          <p className="text-[11px] text-resto-red-800 font-medium line-clamp-2 leading-tight">
                            ✨ {item.matchReason}
                          </p>
                          <span className="text-xs font-black text-resto-red-700 font-poppins block">
                            {formatRupiah(prod.price)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAdded || !prod.is_available}
                        onClick={() => handleAdd(prod)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer shadow-xs ${
                          isAdded
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                            : "bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 text-white active:scale-95 border border-yellow-400"
                        }`}
                      >
                        {isAdded ? "✓ Added" : "+ Order"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

