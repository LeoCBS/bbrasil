export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesText(value: string, selected?: string) {
  return selected ? normalizeText(value) === normalizeText(selected) : true;
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function likePattern(value: string) {
  return `%${value.trim().replace(/[%_]/g, "\\$&")}%`;
}
