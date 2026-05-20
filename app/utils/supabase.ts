import { createClient } from '@supabase/supabase-js';

function supabaseUrlFromEnv(): string {
  if (typeof process !== "undefined" && process.env.VITE_SUPABASE_URL) {
    return process.env.VITE_SUPABASE_URL;
  }
  return import.meta.env.VITE_SUPABASE_URL || "";
}

function supabaseAnonKeyFromEnv(): string {
  if (typeof process !== "undefined" && process.env.VITE_SUPABASE_ANON_KEY) {
    return process.env.VITE_SUPABASE_ANON_KEY;
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY || "";
}

const supabaseUrl = supabaseUrlFromEnv();
const supabaseKey = supabaseAnonKeyFromEnv();

if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL no está definida");
if (!supabaseKey) throw new Error("VITE_SUPABASE_ANON_KEY no está definida");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void supabase.auth.getSession();
    }
  });
}

export default supabase;
