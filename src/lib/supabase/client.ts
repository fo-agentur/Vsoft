import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Supabase-Client für Client Components (Browser). */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
