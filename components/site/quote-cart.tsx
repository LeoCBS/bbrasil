"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, MessageCircle, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { productCompanyContacts } from "@/lib/companies";
import { Button } from "@/components/ui/button";
import { cartStorageKey, currentCompanyStorageKey, type QuoteCartItem } from "@/components/site/add-to-quote-button";

function readCart() {
  try {
    const value = window.localStorage.getItem(cartStorageKey);

    return value ? (JSON.parse(value) as QuoteCartItem[]) : [];
  } catch {
    return [];
  }
}

function readCurrentCompany(items: QuoteCartItem[]) {
  return window.localStorage.getItem(currentCompanyStorageKey) ?? items[0]?.company ?? productCompanyContacts[0].name;
}

function writeCart(items: QuoteCartItem[], company: string) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  window.localStorage.setItem(currentCompanyStorageKey, company);
}

function buildWhatsappHref(items: QuoteCartItem[], company: string) {
  const contact = productCompanyContacts.find((item) => item.name === company) ?? productCompanyContacts[0];
  const productLines = items.map((item) => `- ${item.quantity}x ${item.name} (${item.size}) - ${item.category} - ${item.company}`);
  const message = [
    "Ola, gostaria de solicitar um orcamento para os produtos abaixo:",
    "",
    ...productLines,
    "",
    `Empresa para atendimento: ${contact.name}`
  ].join("\n");

  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function QuoteCart() {
  const [items, setItems] = useState<QuoteCartItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState(productCompanyContacts[0].name);
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const whatsappHref = useMemo(() => buildWhatsappHref(items, selectedCompany), [items, selectedCompany]);

  useEffect(() => {
    const storedItems = readCart();

    setItems(storedItems);
    setSelectedCompany(readCurrentCompany(storedItems));

    function handleCartUpdated(event: Event) {
      const updatedItems = readCart();
      const shouldOpen = event instanceof CustomEvent ? Boolean(event.detail?.open) : false;

      setItems(updatedItems);
      setSelectedCompany(readCurrentCompany(updatedItems));

      if (shouldOpen) {
        setIsOpen(true);
      }
    }

    window.addEventListener("storage", handleCartUpdated);
    window.addEventListener("bbrasil:quote-cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("storage", handleCartUpdated);
      window.removeEventListener("bbrasil:quote-cart-updated", handleCartUpdated);
    };
  }, []);

  function updateItems(nextItems: QuoteCartItem[]) {
    setItems(nextItems);
    writeCart(nextItems, selectedCompany);
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

  function handleCompanyChange(company: string) {
    setSelectedCompany(company);
    writeCart(items, company);
  }

  return (
    <>
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
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.company}</p>
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
              <label className="grid gap-2 text-sm font-medium text-brand-ink">
                Empresa para envio
                <select
                  value={selectedCompany}
                  onChange={(event) => handleCompanyChange(event.target.value)}
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {productCompanyContacts.map((company) => (
                    <option key={company.name} value={company.name}>
                      {company.name} - {company.phoneLabel}
                    </option>
                  ))}
                </select>
              </label>
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
