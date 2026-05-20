export const INGRESO_CATEGORIES = ["pago_cliente", "otro_ingreso"] as const;
export const EGRESO_CATEGORIES = [
  "equipo",
  "software",
  "locacion",
  "transporte",
  "marketing",
  "otro_egreso",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  pago_cliente: "Pago de cliente",
  otro_ingreso: "Otro ingreso",
  equipo: "Equipo",
  software: "Software",
  locacion: "Locación",
  transporte: "Transporte",
  marketing: "Marketing",
  otro_egreso: "Otro egreso",
};

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return CATEGORY_LABELS[key] ?? key.replace(/_/g, " ");
}
