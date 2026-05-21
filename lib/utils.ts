import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper estándar de shadcn/ui: combina clsx con tailwind-merge para
 * mergear classes de Tailwind sin colisiones (e.g., `text-red-500 text-blue-500`
 * resolverá a `text-blue-500`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
