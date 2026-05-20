import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSearchText(text: string): string {
  if (text == null || typeof text !== "string") return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function formatDateOnly(isoOrDateStr: string | null | undefined, locale = "es-ES"): string {
  if (isoOrDateStr == null) return "";
  const s = String(isoOrDateStr).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return isoOrDateStr;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}

/** Montos del negocio en USD */
export function formatUsd(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(amount);
}
