"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuoteCartItem = {
  id: string;
  name: string;
  company: string;
  category: string;
  size: string;
  quantity: number;
};

const cartStorageKey = "bbrasil_quote_cart";
const currentCompanyStorageKey = "bbrasil_quote_company";

function readCart() {
  try {
    const value = window.localStorage.getItem(cartStorageKey);

    return value ? (JSON.parse(value) as QuoteCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: QuoteCartItem[], company: string) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  window.localStorage.setItem(currentCompanyStorageKey, company);
  window.dispatchEvent(new CustomEvent("bbrasil:quote-cart-updated", { detail: { open: true } }));
}

export function AddToQuoteButton({ item }: { item: Omit<QuoteCartItem, "quantity"> }) {
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    const cart = readCart();
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    const nextCart = existingItem
      ? cart.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))
      : [...cart, { ...item, quantity: 1 }];

    writeCart(nextCart, item.company);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Button type="button" size="lg" onClick={handleAddToCart}>
      <MessageCircle className="h-5 w-5" /> {added ? "Produto adicionado" : "Solicitar orcamento"}
    </Button>
  );
}

export { cartStorageKey, currentCompanyStorageKey };
