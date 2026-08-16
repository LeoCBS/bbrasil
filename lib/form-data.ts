import { parseCurrency } from "@/lib/format";
import { onlyDigits } from "@/lib/text";

export function textField(formData: FormData, name: string, fallback = "") {
  const value = String(formData.get(name) ?? "").trim();

  return value || fallback;
}

export function digitsField(formData: FormData, name: string) {
  return onlyDigits(textField(formData, name));
}

export function checkboxField(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export function currencyField(formData: FormData, name: string) {
  return parseCurrency(textField(formData, name));
}

export function numberField(formData: FormData, name: string, fallback = 0) {
  const value = Number(formData.get(name));

  return Number.isFinite(value) ? value : fallback;
}
