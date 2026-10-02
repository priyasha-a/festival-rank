"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  cleanUsername,
  createProfile,
  getMyProfile,
  listFriendships,
  safeNext,
  USERNAME_PATTERN,
  type Profile,
} from "@/lib/social";
import { clearLocal } from "@/lib/storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Status = "idle" | "sending" | "sent" | "error";

const inputClass =
  "w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500";

export default function AccountPanel() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  // undefined = still loading, null = signed in but no username yet.
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  // Where to go after signing in (e.g. back to a friend's invite link).
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get("next")));
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const signedIn = Boolean(session);
  useEffect(() => {
    if (!signedIn) return;
    getMyProfile().then((p) => setProfile(p ?? null));
  }, [signedIn]);

  // Already set up: carry on to wherever they were headed.
  useEffect(() => {
    if (profile && next) router.replace(next);
  }, [profile, next, router]);

  // Friend count (and requests waiting) for the link under the profile card.
  const [friendCounts, setFriendCounts] = useState<{ friends: number; requests: number } | null>(null);
  const hasProfile = Boolean(profile);
  useEffect(() => {
    if (!hasProfile) return;
    listFriendships().then((list) =>
      setFriendCounts({
        friends: list.filter((f) => f.status === "accepted").length,
        requests: list.filter((f) => f.status === "pending" && f.incoming).length,
      }),
    );
  }, [hasProfile]);

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
      options: {
        emailRedirectTo: `${window.location.origin}/account${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      },
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
    if (profile === undefined) return null;
    if (profile === null) {
      return <UsernameForm onCreated={setProfile} />;
    }
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-neutral-900 px-5 py-4 ring-1 ring-neutral-800">
          <p className="truncate text-lg font-semibold">{profile.display_name}</p>
          <p className="truncate text-sm text-neutral-400">
            @{profile.username} · {session.user.email}
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Your picks and rankings sync to any device you sign in on. Only friends you accept can see them.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Link
            href="/friends"
            className="rounded-full px-5 py-2.5 font-semibold text-neutral-200 ring-1 ring-neutral-700 active:scale-95"
          >
            {friendCounts === null ? (
              "Friends"
            ) : (
              <>
                {friendCounts.friends} {friendCounts.friends === 1 ? "friend" : "friends"}
                {friendCounts.requests > 0 && (
                  <span className="font-normal text-neutral-400">
                    {" "}
                    · {friendCounts.requests} {friendCounts.requests === 1 ? "request" : "requests"}
                  </span>
                )}
              </>
            )}{" "}
            <span aria-hidden className="text-neutral-500">
              ›
            </span>
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

/** First-time setup: the name friends will see instead of your email. */
function UsernameForm({ onCreated }: { onCreated: (p: Profile) => void }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = cleanUsername(username);
  const valid = USERNAME_PATTERN.test(handle) && displayName.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    const err = await createProfile(handle, displayName);
    setSaving(false);
    if (err) setError(err);
    else {
      const p = await getMyProfile();
      if (p) onCreated(p);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <p className="text-lg font-semibold">Pick a username</p>
        <p className="text-sm text-neutral-400">Friends find you by this, and see it instead of your email.</p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">Name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          placeholder="Priyasha"
          autoComplete="name"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-neutral-300">Username</span>
          <span className="text-neutral-500">3–20 letters, numbers or _</span>
        </span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={21}
          placeholder="@priyasha"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={!valid || saving}
        className="w-full rounded-full bg-white px-5 py-3 font-semibold text-neutral-950 active:scale-[0.98] disabled:opacity-40"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
