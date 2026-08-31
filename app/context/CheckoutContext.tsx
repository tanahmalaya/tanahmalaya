"use client";

import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "plt-checkout-draft";

export type CheckoutContact = {
  namaPembeli: string;
  telefon: string;
  emel: string;
};

export type CheckoutAddress = {
  alamat: string;
  poskod: string;
  bandar: string;
  negeri: string;
};

export type CheckoutQuoteItem = {
  id: string;
  namaProduk: string;
  kuantiti: number;
  hargaBarangSen: number;
  hargaAsalSen: number;
  diskaunPercent: number;
};

export type CheckoutQuote = {
  items: CheckoutQuoteItem[];
  subtotalSen: number;
  diskaunSen: number;
  shippingSen: number;
  jumlahSen: number;
  courierName: string | null;
};

type CheckoutDraft = {
  contact: CheckoutContact | null;
  address: CheckoutAddress | null;
  quote: CheckoutQuote | null;
};

const EMPTY_DRAFT: CheckoutDraft = { contact: null, address: null, quote: null };

type CheckoutContextType = CheckoutDraft & {
  setInformation: (contact: CheckoutContact, address: CheckoutAddress, quote: CheckoutQuote) => void;
  resetCheckout: () => void;
};

const CheckoutContext = createContext<CheckoutContextType | null>(null);

export const CheckoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [draft, setDraft] = useState<CheckoutDraft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft(JSON.parse(saved));
    } catch {
      // abaikan - mula dengan draft kosong
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // abaikan
    }
  }, [draft, loaded]);

  const setInformation = (contact: CheckoutContact, address: CheckoutAddress, quote: CheckoutQuote) => {
    setDraft({ contact, address, quote });
  };

  const resetCheckout = () => {
    setDraft(EMPTY_DRAFT);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // abaikan
    }
  };

  return (
    <CheckoutContext.Provider value={{ ...draft, setInformation, resetCheckout }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error("CheckoutContext not found");
  return context;
};
