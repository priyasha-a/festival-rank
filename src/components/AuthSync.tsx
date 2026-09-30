"use client";

import { useEffect } from "react";
import { syncLocalToRemote } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

/** When a user signs in, upload anything they ranked on this device before signing in. */
export default function AuthSync() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((event) => {
      // Defer: Supabase recommends not awaiting other Supabase calls inside this callback.
      if (event === "SIGNED_IN") setTimeout(() => void syncLocalToRemote(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
