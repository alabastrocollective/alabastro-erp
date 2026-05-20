import supabase from "~/utils/supabase";
import type { ServicePackageRow } from "~/types/alabastro";

export async function listServicePackages(): Promise<{ data: ServicePackageRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("service_packages")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ServicePackageRow[], error: null };
}

/** Precio vigente según promo (USD). */
export function effectivePackagePriceUsd(pkg: ServicePackageRow): number {
  if (pkg.promo_active) return Number(pkg.price_promo_usd);
  return Number(pkg.price_regular_usd);
}
