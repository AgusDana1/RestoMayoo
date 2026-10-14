"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  categoryName?: string;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  customerName: string;
  tableCode: string;
  tableId: number | null;
  addToCart: (product: { id: number; name: string; price: number; image?: string | null; categoryName?: string }, notes?: string) => void;
  updateQuantity: (id: number, delta: number) => void;
  updateNotes: (id: number, notes: string) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  setCustomerInfo: (name: string, tableCode: string, tableId?: number | null) => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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
    product: { id: number; name: string; price: number; image?: string | null; categoryName?: string },
    notes?: string
  ) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, notes: notes !== undefined ? notes : item.notes }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          categoryName: product.categoryName,
          quantity: 1,
          notes: notes || "",
        },
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNotes = (id: number, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
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

