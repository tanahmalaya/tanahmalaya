"use client";

import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "plt-cart";

export type CartItem = {
  /** Kunci unik baris troli - "productId" sahaja, atau "productId:saiz" kalau produk ada saiz. */
  id: string;
  productId: string;
  saiz: string | null;
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Muatkan troli dari localStorage sekali sahaja bila component mount -
  // supaya troli tak hilang bila customer refresh/navigate antara halaman
  // checkout (/cart, /checkout/information, dll).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {
      // abaikan - mula dengan troli kosong
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return; // elak overwrite storage dengan [] sebelum load selesai
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // abaikan (cth: private browsing yang sekat localStorage)
    }
  }, [cart, loaded]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === item.id);
      if (exist) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartContext not found");
  return context;
};
