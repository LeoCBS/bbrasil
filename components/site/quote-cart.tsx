"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, Minus, MessageCircle, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import type { Unit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  cartUpdatedEvent,
  readCart,
  readSelectedUnitId,
  storageUnavailableMessage,
  writeCart,
  type QuoteCartItem
} from "@/lib/quote-cart-storage";

function buildWhatsappHref(items: QuoteCartItem[], unitId: string, units: Unit[]) {
  const contact = units.find((unit) => unit.id === unitId) ?? units[0];
  if (!contact?.whatsapp_number) return "#";
  const productLines = items.map((item) => `- ${item.quantity}x ${item.name} (${item.size}) - ${item.category} - ${item.unit_name}`);
  const message = [
    "Ola, gostaria de solicitar um orcamento para os produtos abaixo:",
    "",
    ...productLines,
    "",
    `Empresa para atendimento: ${contact.name}`
  ].join("\n");

  return `https://wa.me/${contact.whatsapp_number}?text=${encodeURIComponent(message)}`;
}

export function QuoteCart({ units }: { units: Unit[] }) {
  const [items, setItems] = useState<QuoteCartItem[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const whatsappHref = useMemo(() => buildWhatsappHref(items, selectedUnitId, units), [items, selectedUnitId, units]);

  useEffect(() => {
    const storedItems = readCart();

    setItems(storedItems);
    setSelectedUnitId(readSelectedUnitId(storedItems, units));

    function handleCartUpdated(event: Event) {
      const updatedItems = readCart();
      const shouldOpen = event instanceof CustomEvent ? Boolean(event.detail?.open) : false;

      setItems(updatedItems);
      setSelectedUnitId(readSelectedUnitId(updatedItems, units));

      if (shouldOpen) {
        setIsOpen(true);
      }
    }

    window.addEventListener("storage", handleCartUpdated);
    window.addEventListener(cartUpdatedEvent, handleCartUpdated);

    return () => {
      window.removeEventListener("storage", handleCartUpdated);
      window.removeEventListener(cartUpdatedEvent, handleCartUpdated);
    };
  }, [units]);

  function updateItems(nextItems: QuoteCartItem[]) {
    try {
      writeCart(nextItems, selectedUnitId);
    } catch (reason) {
      console.error("Não foi possível gravar o carrinho de orçamento:", reason);
      setError(storageUnavailableMessage);
      return;
    }

    setError("");
    setItems(nextItems);
  }

  function updateQuantity(id: string, quantity: number) {
    const nextItems = items
      .map((item) => (item.id === id ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    updateItems(nextItems);
  }

  function removeItem(id: string) {
    updateItems(items.filter((item) => item.id !== id));
  }

  function clearCart() {
    updateItems([]);
  }

  const pathname = usePathname();

  const isAdmin = typeof pathname === "string" && pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin ? (
        <Button
          type="button"
          className="fixed bottom-5 right-5 z-50 h-14 rounded-full px-5 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" /> Orçamento
          {totalItems > 0 ? (
            <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-blue">{totalItems}</span>
          ) : null}
        </Button>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/35">
          <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-brand-ink">Carrinho de orçamento</h2>
                <p className="mt-1 text-sm text-slate-600">{totalItems} {totalItems === 1 ? "item" : "itens"}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar carrinho">
                <X className="h-5 w-5" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {error ? (
                <div className="mb-4">
                  <Alert variant="error" message={error} onClose={() => setError("")} />
                </div>
              ) : null}

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <ShoppingCart className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-semibold text-brand-ink">Nenhum produto no orçamento</p>
                  <p className="mt-2 text-sm text-slate-600">Adicione produtos pelo botão “Solicitar orçamento”.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-brand-ink">{item.name}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.size} · {item.category}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.unit_name}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remover produto">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="flex h-10 min-w-12 items-center justify-center rounded-md border px-3 font-semibold">
                          {item.quantity}
                        </span>
                        <Button type="button" variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="border-t p-5">
              <Button type="button" className="mb-4 w-full bg-brand-green text-white hover:bg-brand-greenDark" onClick={() => setIsOpen(false)}>
                <ArrowLeft className="h-4 w-4" /> Continuar comprando
              </Button>
              <p className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Unidade para envio: <strong className="text-brand-ink">{units.find((unit) => unit.id === selectedUnitId)?.name ?? "—"}</strong>
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                {items.length === 0 ? (
                  <Button disabled>
                    <MessageCircle className="h-5 w-5" /> Enviar pelo WhatsApp
                  </Button>
                ) : (
                  <Button asChild>
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-5 w-5" /> Enviar pelo WhatsApp
                    </a>
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={clearCart} disabled={items.length === 0}>
                  Limpar
                </Button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
