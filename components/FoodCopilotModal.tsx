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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to consult Food Copilot");
      }

      const data = await res.json();
      setInterpretedMood(data.interpretedMood || "");

      if (data.matches && Array.isArray(data.matches)) {
        let resolved = data.matches
          .map((m: any) => {
            const found = products.find((p) => Number(p.id) === Number(m.productId));
            return found ? { ...m, product: found } : null;
          })
          .filter(Boolean);

        if (resolved.length === 0 && products.length > 0) {
          const qLower = q.toLowerCase();
          const tokens = qLower.split(/[\s,.-]+/).filter((w) => w.length > 1);
          const matchedByTokens = products.filter((p) => {
            const text = `${p.name} ${p.category?.name || ""} ${p.description || ""}`.toLowerCase();
            return tokens.some((t) => text.includes(t));
          });
          const candidates =
            matchedByTokens.length > 0
              ? matchedByTokens.slice(0, 3)
              : products.filter((p) => p.is_available).slice(0, 2);

          resolved = candidates.map((p) => ({
            productId: p.id,
            matchReason: `Pilihan lezat "${p.name}" yang pas dengan apa yang kamu cari!`,
            product: p,
          }));
        }
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#30251F]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFF9F0] rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-[#EADBCA] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#30251F]/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

        {/* Top Header */}
        <div className="bg-[#D94B35] text-white p-4 sm:p-5 relative border-b-2 border-[#F2C14E] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F2C14E] text-[#30251F] font-black text-lg flex items-center justify-center shadow-xs">
                ✨
              </span>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#F2C14E] text-[#30251F] inline-block">
                  Chef Gemini AI
                </span>
                <h2 className="text-base sm:text-xl font-black font-heading text-white leading-tight">
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
          <p className="text-[11px] sm:text-xs text-[#FFF9F0]/90 mt-2 font-medium">
            Describe your craving in plain words, and Gemini will find the exact dishes for you!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 -webkit-overflow-scrolling-touch">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch(query);
                  }
                }}
                enterKeyHint="search"
                placeholder="E.g. kuah hangat gurih di bawah 30 ribu..."
                className="w-full pl-4 pr-22 py-3 rounded-2xl border border-[#EADBCA] focus:outline-none focus:border-[#D94B35] focus:ring-1 focus:ring-[#D94B35] text-xs sm:text-sm bg-white font-medium shadow-inner placeholder:text-[#8E7A6F]"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 sm:px-4 rounded-xl bg-[#D94B35] hover:bg-[#B73824] disabled:opacity-40 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Cari</span>
                    <span>✨</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#8E7A6F] tracking-wider block">
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
                  className="px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-semibold bg-white hover:bg-[#FEF8E9] text-[#30251F] border border-[#EADBCA] transition-colors cursor-pointer text-left active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-[#D94B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#5F4E44] font-medium animate-pulse">
                Chef Gemini is consulting the Resto Mayo menu...
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#D94B35]/10 border border-[#D94B35]/20 text-xs text-[#D94B35] font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {/* Interpreted Mood / Filter Criteria */}
          {interpretedMood && !loading && (
            <div className="p-3 rounded-2xl bg-[#F2F5F0] border border-[#829477]/30 text-xs text-[#30251F]">
              <span className="font-bold text-[#829477] mr-1">🎯 AI Recommendation:</span>
              <span>{interpretedMood}</span>
            </div>
          )}

          {/* Matches List */}
          {!loading && matches.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#30251F] font-heading">
                Recommended Dishes ({matches.length})
              </h3>
              <div className="space-y-2">
                {matches.map((m) => {
                  const prod = m.product;
                  if (!prod) return null;
                  const isAdded = addedIds.includes(prod.id);

                  return (
                    <div
                      key={prod.id}
                      className="p-3 bg-white rounded-2xl border border-[#EADBCA] shadow-2xs hover:border-[#D94B35]/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden flex-1">
                        <img
                          src={getOptimizedImageUrl(prod.image)}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#F2EDE4] border border-[#EADBCA]"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-[#30251F] font-heading truncate">
                            {prod.name}
                          </h4>
                          <p className="text-[10px] text-[#829477] line-clamp-1 italic font-medium mt-0.5">
                            {m.matchReason}
                          </p>
                          <span className="text-xs font-black text-[#D94B35] font-heading block mt-0.5">
                            {formatRupiah(prod.price)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAdd(prod)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs ${
                          isAdded
                            ? "bg-[#829477]/20 text-[#829477] border border-[#829477]/40 cursor-default"
                            : "bg-[#D94B35] hover:bg-[#B73824] text-white active:scale-95"
                        }`}
                      >
                        {isAdded ? "✓ Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
