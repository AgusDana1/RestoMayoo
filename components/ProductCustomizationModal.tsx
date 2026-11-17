"use client";

import React, { useState, useEffect } from "react";
import { getOptimizedImageUrl } from "../lib/image";
import { CartItemOption } from "../context/CartContext";

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

interface ProductCustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: {
      id: number;
      name: string;
      price: number;
      image?: string | null;
      categoryName?: string;
    },
    customization?: {
      spicyLevel?: string;
      options?: CartItemOption[];
      notes?: string;
      quantity?: number;
    }
  ) => void;
}

const SPICY_OPTIONS = [
  { label: "Level 0 (Original)", extra: 0, desc: "Savory & mild without chili" },
  { label: "Level 1 (Mild)", extra: 0, desc: "A touch of fresh warmth" },
  { label: "Level 2 (Spicy)", extra: 0, desc: "Classic kick with sambal mayo" },
  { label: "Level 3 (Extra Hot)", extra: 2000, desc: "Fiery bird's eye chili relish (+Rp 2.000)" },
];

const FOOD_ADDONS: CartItemOption[] = [
  { name: "Extra Melted Mozzarella", price: 5000 },
  { name: "Extra Signature Mayo Dip", price: 3000 },
  { name: "Telur Mata Sapi / Fried Egg", price: 4000 },
  { name: "Extra Kerupuk Renyah", price: 3000 },
];

const DRINK_ADDONS: CartItemOption[] = [
  { name: "Extra Signature Mayo Cream", price: 4000 },
  { name: "Less Ice (Sedikit Es)", price: 0 },
  { name: "Less Sugar (Sedikit Gula)", price: 0 },
  { name: "No Ice (Tanpa Es)", price: 0 },
];

export default function ProductCustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSpicy, setSelectedSpicy] = useState<string>("Level 0 (Original)");
  const [selectedOptions, setSelectedOptions] = useState<CartItemOption[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedSpicy("Level 0 (Original)");
      setSelectedOptions([]);
      setSpecialNotes("");
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const isBeverage =
    product.category?.name?.toLowerCase().includes("minum") ||
    product.category?.name?.toLowerCase().includes("beverage") ||
    product.name.toLowerCase().includes("es ") ||
    product.name.toLowerCase().includes("jus ") ||
    product.name.toLowerCase().includes("shake");

  const basePrice = Number(product.price);
  const spicyExtra = selectedSpicy.includes("Level 3") ? 2000 : 0;
  const addonsTotal = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
  const unitPrice = basePrice + spicyExtra + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const formatRupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  const toggleOption = (opt: CartItemOption) => {
    setSelectedOptions((prev) => {
      const exists = prev.some((o) => o.name === opt.name);
      if (exists) {
        return prev.filter((o) => o.name !== opt.name);
      } else {
        return [...prev, opt];
      }
    });
  };

  const handleConfirm = () => {
    onAddToCart(
      {
        id: product.id,
        name: product.name,
        price: basePrice,
        image: product.image,
        categoryName: product.category?.name,
      },
      {
        spicyLevel: isBeverage ? undefined : selectedSpicy,
        options: selectedOptions,
        notes: specialNotes.trim(),
        quantity,
      }
    );
    onClose();
  };

  const availableAddons = isBeverage ? DRINK_ADDONS : FOOD_ADDONS;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#30251F]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dish-title"
        className="relative w-full max-w-lg bg-[#FFF9F0] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-[#EADBCA] flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#30251F]/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close customization modal"
          className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#30251F] flex items-center justify-center shadow-md border border-[#EADBCA] cursor-pointer transition-transform active:scale-90"
        >
          ✕
        </button>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 -webkit-overflow-scrolling-touch">
          {/* Dish Header Image & Info */}
          <div className="flex gap-3 sm:gap-4 items-start">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#F2EDE4] shrink-0 border border-[#EADBCA] relative">
              <img
                src={getOptimizedImageUrl(product.image)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.category?.name && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-[#30251F]/80 text-[#FFF9F0] text-[8px] sm:text-[9px] font-bold tracking-wider uppercase backdrop-blur-2xs">
                  {product.category.name}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <h3
                id="modal-dish-title"
                className="text-sm sm:text-lg font-extrabold text-[#30251F] font-heading leading-snug truncate sm:whitespace-normal"
              >
                {product.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5F4E44] mt-0.5 sm:mt-1 leading-relaxed line-clamp-2">
                {product.description || "Authentic freshly-made recipe with signature mayo."}
              </p>
              <div className="mt-1 sm:mt-2 flex items-baseline space-x-1.5">
                <span className="text-[10px] sm:text-xs text-[#8E7A6F] font-medium">Base:</span>
                <span className="text-xs sm:text-base font-black text-[#D94B35] font-heading">
                  {formatRupiah(basePrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Spicy Level Selection (for non-beverages) */}
          {!isBeverage && (
            <div className="pt-2 border-t border-[#EADBCA]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#30251F] flex items-center space-x-1.5">
                  <span>🌶️</span>
                  <span>Select Spice Level</span>
                </label>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#829477] bg-[#F2F5F0] px-2 py-0.5 rounded-full border border-[#829477]/30">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SPICY_OPTIONS.map((opt) => {
                  const isSelected = selectedSpicy === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedSpicy(opt.label)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer min-h-[44px] ${
                        isSelected
                          ? "bg-[#D94B35] text-white border-[#D94B35] shadow-xs font-semibold"
                          : "bg-white text-[#30251F] border-[#EADBCA] hover:border-[#D94B35]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{opt.label.split(" ")[0]} {opt.label.split(" ")[1]}</span>
                        {opt.extra > 0 && (
                          <span
                            className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-black ${
                              isSelected ? "bg-white/20 text-white" : "text-[#D94B35]"
                            }`}
                          >
                            +{formatRupiah(opt.extra)}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[9px] sm:text-[10px] mt-0.5 truncate ${
                          isSelected ? "text-white/90" : "text-[#8E7A6F]"
                        }`}
                      >
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-on Toppings Selection */}
          <div className="pt-2 border-t border-[#EADBCA]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#30251F] flex items-center space-x-1.5">
                <span>🧀</span>
                <span>{isBeverage ? "Beverage Preferences" : "Add-Ons & Extras"}</span>
              </label>
              <span className="text-[10px] text-[#8E7A6F] font-medium">Optional</span>
            </div>

            <div className="space-y-1.5">
              {availableAddons.map((opt) => {
                const isSelected = selectedOptions.some((o) => o.name === opt.name);
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => toggleOption(opt)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer min-h-[44px] ${
                      isSelected
                        ? "bg-[#FEF8E9] border-[#F2C14E] text-[#30251F]"
                        : "bg-white border-[#EADBCA] hover:border-[#F2C14E] text-[#5F4E44]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? "bg-[#F2C14E] border-[#D4A334] text-[#30251F]"
                            : "border-[#8E7A6F]/40 bg-white"
                        }`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="text-xs font-semibold text-[#30251F] text-left">{opt.name}</span>
                    </div>

                    <span className="text-xs font-bold text-[#D94B35] shrink-0 ml-2">
                      {opt.price > 0 ? `+${formatRupiah(opt.price)}` : "Free"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="pt-2 border-t border-[#EADBCA]">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#30251F] mb-1.5 flex items-center space-x-1.5">
              <span>📝</span>
              <span>Kitchen Note / Catatan Khusus</span>
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="E.g. Pisahkan saus mayo, jangan pakai daun bawang..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EADBCA] text-xs text-[#30251F] placeholder:text-[#8E7A6F] focus:outline-none focus:border-[#D94B35] focus:ring-1 focus:ring-[#D94B35]"
              maxLength={150}
            />
          </div>
        </div>

        {/* Sticky Action Footer with Safe Area */}
        <div className="p-3.5 sm:p-5 bg-white border-t border-[#EADBCA] flex items-center justify-between gap-3 shadow-lg pb-[max(14px,env(safe-area-inset-bottom))]">
          {/* Quantity Stepper */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-[#FFF9F0] p-1 rounded-xl sm:rounded-2xl border border-[#EADBCA]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg sm:rounded-xl bg-white border border-[#EADBCA] text-[#30251F] font-bold flex items-center justify-center hover:bg-[#FEF8E9] disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
            >
              -
            </button>
            <span className="w-6 text-center font-black text-sm text-[#30251F] font-heading">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 rounded-lg sm:rounded-xl bg-[#D94B35] text-white font-bold flex items-center justify-center hover:bg-[#B73824] shadow-xs cursor-pointer transition-colors active:scale-95"
            >
              +
            </button>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-[#D94B35] hover:bg-[#B73824] text-white font-bold text-xs sm:text-sm font-heading flex items-center justify-between shadow-md transition-all active:scale-98 cursor-pointer min-h-[44px]"
          >
            <span>Add to Order</span>
            <span className="font-black bg-white/20 px-2 py-0.5 rounded-lg text-xs sm:text-sm">
              {formatRupiah(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
