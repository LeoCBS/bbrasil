export type QuoteCartItem = {
  id: string;
  name: string;
  unit_id: string;
  unit_name: string;
  category: string;
  size: string;
  quantity: number;
};

export const cartStorageKey = "bbrasil_quote_cart";
export const currentUnitStorageKey = "bbrasil_quote_unit_id";
export const cartUpdatedEvent = "bbrasil:quote-cart-updated";

export const storageUnavailableMessage =
  "Não foi possível salvar seu orçamento neste navegador. Verifique se o armazenamento local está habilitado.";

function isQuoteCartItem(value: unknown): value is QuoteCartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.unit_id === "string" &&
    typeof item.unit_name === "string" &&
    typeof item.category === "string" &&
    typeof item.size === "string" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity)
  );
}

function readStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch (reason) {
    console.error(`Leitura de ${key} no localStorage falhou:`, reason);
    return null;
  }
}

export function readCart(): QuoteCartItem[] {
  const value = readStorageItem(cartStorageKey);

  if (!value) return [];

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (reason) {
    console.error("Carrinho de orçamento inválido no localStorage, descartando:", reason);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("Carrinho de orçamento inválido no localStorage: formato inesperado.");
    return [];
  }

  const items = parsed.filter(isQuoteCartItem);

  if (items.length !== parsed.length) {
    console.error("Itens inválidos do carrinho de orçamento foram descartados.");
  }

  return items;
}

export function readSelectedUnitId(items: QuoteCartItem[], units: { id: string }[] = []) {
  return readStorageItem(currentUnitStorageKey) ?? items[0]?.unit_id ?? units[0]?.id ?? "";
}

export function writeSelectedUnitId(unitId: string) {
  window.localStorage.setItem(currentUnitStorageKey, unitId);
}

export function writeCart(items: QuoteCartItem[], unitId: string) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  writeSelectedUnitId(unitId);
}

export function notifyCartUpdated({ open }: { open: boolean }) {
  window.dispatchEvent(new CustomEvent(cartUpdatedEvent, { detail: { open } }));
}
