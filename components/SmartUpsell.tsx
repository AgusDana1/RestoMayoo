"use client";

import React, { useState, useEffect } from "react";
import { getOptimizedImageUrl } from "../lib/image";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  categoryName?: string;
  notes?: string | null;
}

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

interface SmartUpsellProps {
  cart: CartItem[];
  onAddToCart: (product: {
    id: number;
    name: string;
    price: number;
    image?: string | null;
    categoryName?: string;
  }) => void;
  compact?: boolean;
}

interface UpsellRecommendation {
  productId: number;
  reason: string;
  product?: Product;
}

export default function SmartUpsell({ cart, onAddToCart, compact = false }: SmartUpsellProps) {
  const [headline, setHeadline] = useState<string>("");
  const [recommendations, setRecommendations] = useState<UpsellRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  // 1. Fetch catalog once
  useEffect(() => {
    let isMounted = true;
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        if (isMounted) setAllProducts(data);
      })
      .catch((err) => console.error("Error loading products for upsell:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch AI recommendation when cart changes
  useEffect(() => {
    if (cart.length === 0 || allProducts.length === 0) {
      setRecommendations([]);
      setHeadline("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "smart-upsell",
            cartItems: cart.map((c) => ({ id: c.id, name: c.name, quantity: c.quantity })),
            allProducts: allProducts.map((p) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              description: p.description,
              is_available: p.is_available,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.recommendations && Array.isArray(data.recommendations)) {
            const mapped = data.recommendations
              .map((rec: any) => {
                const prod = allProducts.find((p) => p.id === rec.productId);
                return prod ? { ...rec, product: prod } : null;
              })
              .filter(Boolean);
            setRecommendations(mapped);
            setHeadline(data.headline || "Complete Your Dining Experience");
          }
        }
      } catch (err) {
        console.warn("Smart upsell error:", err);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [cart, allProducts]);

  if (cart.length === 0 || recommendations.length === 0) {
    return null;
  }

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  const handleAdd = (item: UpsellRecommendation) => {
    if (!item.product) return;
    onAddToCart({
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.image,
      categoryName: item.product.category?.name,
    });
    setAddedIds((prev) => [...prev, item.product!.id]);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border-2 border-resto-yellow-300 bg-gradient-to-br from-amber-50/70 via-white to-resto-yellow-50/60 p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden">
      {/* Decorative sparkle background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-resto-yellow-200/40 rounded-full blur-xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-1 sm:p-1.5 rounded-xl bg-gradient-to-r from-resto-red-600 to-resto-yellow-500 text-white text-xs sm:text-sm font-bold shadow-2xs">
            ✨
          </span>
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-resto-red-700 block">
              Smart AI Pairing &bull; Chef Gemini
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-poppins">
              {headline || "Perfect Add-on for Your Meal"}
            </h3>
          </div>
        </div>

        {loading && (
          <span className="text-[10px] font-semibold text-stone-400 animate-pulse">
            Analyzing...
          </span>
        )}
      </div>

      {/* Recommended Items Grid */}
      <div className={`grid ${compact || recommendations.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-3`}>
        {recommendations.map((rec) => {
          const prod = rec.product;
          if (!prod) return null;
          const isAdded = addedIds.includes(prod.id);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-resto-yellow-200 p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-resto-yellow-400 transition-all"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <img
                  src={getOptimizedImageUrl(prod.image)}
                  alt={prod.name}
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 bg-resto-yellow-50 border border-resto-yellow-200"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 font-poppins truncate">
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-amber-800 line-clamp-1 italic font-medium">
                    &ldquo;{rec.reason}&rdquo;
                  </p>
                  <span className="text-xs font-black text-resto-red-700 font-poppins block mt-0.5">
                    {formatRupiah(prod.price)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isAdded}
                onClick={() => handleAdd(rec)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer shadow-xs ${
                  isAdded
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                    : "bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 text-white active:scale-95 border border-resto-yellow-300"
                }`}
              >
                {isAdded ? "✓ Added" : "+ Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

