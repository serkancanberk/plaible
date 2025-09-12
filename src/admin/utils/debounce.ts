// src/admin/utils/debounce.ts
export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let t: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
