"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItemOption {
  name: string;
  price: number;
}

export interface CartItem {
  id: number;
  key?: string;
  name: string;
  price: number;
  basePrice?: number;
  image?: string | null;
  categoryName?: string;
  quantity: number;
  notes?: string;
  spicyLevel?: string;
  options?: CartItemOption[];
}

export interface AddToCartCustomization {
  spicyLevel?: string;
  options?: CartItemOption[];
  notes?: string;
  quantity?: number;
}

interface CartContextType {
  cart: CartItem[];
  customerName: string;
  tableCode: string;
  tableId: number | null;
  addToCart: (
    product: {
      id: number;
      name: string;
      price: number;
      image?: string | null;
      categoryName?: string;
    },
    customization?: string | AddToCartCustomization
  ) => void;
  updateQuantity: (keyOrId: string | number, delta: number) => void;
  updateNotes: (keyOrId: string | number, notes: string) => void;
  removeFromCart: (keyOrId: string | number) => void;
  clearCart: () => void;
  setCustomerInfo: (name: string, tableCode: string, tableId?: number | null) => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateItemKey(
  id: number,
  spicyLevel?: string,
  options?: CartItemOption[],
  notes?: string
): string {
  const spicy = spicyLevel || "original";
  const opts = (options || []).map((o) => o.name).sort().join("|");
  const n = (notes || "").trim().toLowerCase();
  return `${id}_${spicy}_${opts}_${n}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("resto_mayo_cart");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [customerName, setCustomerNameState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("resto_mayo_customer_name") || "";
    }
    return "";
  });

  const [tableCode, setTableCodeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("resto_mayo_table_code") || "";
    }
    return "";
  });

  const [tableId, setTableIdState] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resto_mayo_table_id");
      return saved ? Number(saved) : null;
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem("resto_mayo_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  const setCustomerInfo = (name: string, code: string, id?: number | null) => {
    setCustomerNameState(name);
    setTableCodeState(code);
    if (id !== undefined) setTableIdState(id);
    try {
      localStorage.setItem("resto_mayo_customer_name", name);
      localStorage.setItem("resto_mayo_table_code", code);
      if (id !== undefined && id !== null) {
        localStorage.setItem("resto_mayo_table_id", id.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (
    product: {
      id: number;
      name: string;
      price: number;
      image?: string | null;
      categoryName?: string;
    },
    customization?: string | AddToCartCustomization
  ) => {
    let customObj: AddToCartCustomization = {};
    if (typeof customization === "string") {
      customObj = { notes: customization };
    } else if (customization) {
      customObj = customization;
    }

    const spicyLevel = customObj.spicyLevel || "Level 0 (Normal)";
    const options = customObj.options || [];
    const notes = customObj.notes || "";
    const qtyToAdd = customObj.quantity && customObj.quantity > 0 ? customObj.quantity : 1;

    const basePrice = Number(product.price);
    const optionsTotal = options.reduce((sum, opt) => sum + (Number(opt.price) || 0), 0);
    const spicyExtra = spicyLevel.includes("Level 3") ? 2000 : 0;
    const finalUnitPrice = basePrice + optionsTotal + spicyExtra;

    const itemKey = generateItemKey(product.id, spicyLevel, options, notes);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => (item.key || item.id.toString()) === itemKey
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + qtyToAdd,
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: product.id,
          key: itemKey,
          name: product.name,
          basePrice,
          price: finalUnitPrice,
          image: product.image,
          categoryName: product.categoryName,
          quantity: qtyToAdd,
          notes,
          spicyLevel,
          options,
        },
      ];
    });
  };

  const updateQuantity = (keyOrId: string | number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          const match =
            (item.key && item.key === keyOrId.toString()) || item.id === keyOrId;
          if (match) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNotes = (keyOrId: string | number, notes: string) => {
    setCart((prev) =>
      prev.map((item) => {
        const match =
          (item.key && item.key === keyOrId.toString()) || item.id === keyOrId;
        return match ? { ...item, notes } : item;
      })
    );
  };

  const removeFromCart = (keyOrId: string | number) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !((item.key && item.key === keyOrId.toString()) || item.id === keyOrId)
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        customerName,
        tableCode,
        tableId,
        addToCart,
        updateQuantity,
        updateNotes,
        removeFromCart,
        clearCart,
        setCustomerInfo,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
