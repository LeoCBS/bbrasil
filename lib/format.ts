import { onlyDigits } from "@/lib/text";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return currencyFormatter.format(value);
}

export function formatCurrencyFromCents(digits: string) {
  if (!digits) {
    return "";
  }

  const cents = Number(digits);

  return Number.isFinite(cents) ? currencyFormatter.format(cents / 100) : "";
}

export function parseCurrency(value: string) {
  const cleaned = value.trim().replace(/[^0-9,.-]/g, "");

  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMarginPercent(price?: number | null, costPrice?: number | null) {
  if (typeof price !== "number" || typeof costPrice !== "number" || !price) {
    return "-";
  }

  return `${(((price - costPrice) / (costPrice || 1)) * 100).toFixed(2)}%`;
}

export function whatsappHref(whatsappNumber?: string | null, message?: string) {
  const digits = onlyDigits(whatsappNumber ?? "");

  if (!digits) {
    return "#";
  }

  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}

export function formatCnpj(value: string) {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhone(value: string) {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const checkDigit = (length: number) => {
    let sum = 0;
    let weight = length - 7;

    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }

    const remainder = sum % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  return checkDigit(12) === Number(digits[12]) && checkDigit(13) === Number(digits[13]);
}
