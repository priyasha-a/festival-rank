import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

/** True when the Supabase env vars are set. Without them the app runs in browser-only mode. */
export const isSupabaseConfigured = Boolean(url && key);

/**
 * Browser-side Supabase client, or null on the server / when not configured.
 * All data access happens in the browser; Row Level Security scopes it to the signed-in user.
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined" || !url || !key) return null;
  // PKCE: the sign-in link comes back with ?code=..., which the client exchanges automatically.
  client ??= createClient(url, key, { auth: { flowType: "pkce" } });
  return client;
}
