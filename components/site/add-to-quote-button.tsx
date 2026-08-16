"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  notifyCartUpdated,
  readCart,
  readSelectedUnitId,
  storageUnavailableMessage,
  writeCart,
  type QuoteCartItem
} from "@/lib/quote-cart-storage";

export function AddToQuoteButton({ item }: { item: Omit<QuoteCartItem, "quantity"> }) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  function handleAddToCart() {
    const cart = readCart();
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    const nextCart = existingItem
      ? cart.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))
      : [...cart, { ...item, quantity: 1 }];

    try {
      writeCart(nextCart, readSelectedUnitId(cart) || item.unit_id);
    } catch (reason) {
      console.error("Não foi possível gravar o carrinho de orçamento:", reason);
      setError(storageUnavailableMessage);
      return;
    }

    notifyCartUpdated({ open: true });
    setError("");
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="grid gap-3">
      {error ? <Alert variant="error" message={error} onClose={() => setError("")} /> : null}
      <Button type="button" size="lg" onClick={handleAddToCart}>
        <MessageCircle className="h-5 w-5" /> {added ? "Produto adicionado" : "Solicitar orcamento"}
      </Button>
    </div>
  );
}

export type { QuoteCartItem };
