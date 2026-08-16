export function buildIlikePattern(value: string) {
  const escaped = value.replace(/[\\%_]/g, "\\$&").replace(/"/g, '\\"');

  return `"%${escaped}%"`;
}
