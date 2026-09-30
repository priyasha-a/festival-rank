"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { clearLocal } from "@/lib/storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Status = "idle" | "sending" | "sent" | "error";

export default function AccountPanel() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
        Syncing isn’t set up yet, so your rankings are saved in this browser only.
      </p>
    );
  }

  if (session === undefined) return null;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setStatus("sending");
    setError("");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function signOut() {
    await getSupabase()?.auth.signOut();
    // Your data stays in your account; wipe this browser's copy so the next person starts fresh.
    clearLocal();
  }

  if (session) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-neutral-900 px-5 py-4 ring-1 ring-neutral-800">
          <p className="text-sm text-neutral-400">Signed in as</p>
          <p className="truncate text-lg font-semibold">{session.user.email}</p>
          <p className="mt-2 text-sm text-neutral-400">Your picks and rankings sync to any device you sign in on.</p>
        </div>
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-full bg-white px-5 py-2.5 font-semibold text-neutral-950 active:scale-95">
            Go to festivals
          </Link>
          <button type="button" onClick={signOut} className="px-4 py-2 text-sm text-neutral-400 active:text-neutral-200">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="space-y-3 rounded-2xl bg-neutral-900 px-5 py-4 ring-1 ring-neutral-800">
        <p className="text-lg font-semibold">Check your email</p>
        <p className="text-sm text-neutral-400">
          We sent a sign-in link to <span className="text-neutral-200">{email.trim()}</span>. Open it in this same
          browser to finish signing in.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="text-sm text-neutral-400 underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={sendLink} className="space-y-3">
      <p className="text-neutral-400">
        Sign in to save your rankings to your account and see them on any device. No password needed.
      </p>
      <input
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-white px-5 py-3 font-semibold text-neutral-950 active:scale-[0.98] disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      {status === "error" && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
