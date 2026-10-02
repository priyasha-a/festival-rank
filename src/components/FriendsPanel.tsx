"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  acceptRequest,
  cleanUsername,
  findProfile,
  getMyProfile,
  inviteLink,
  listFriendships,
  removeFriendship,
  sendRequest,
  type Friendship,
  type Profile,
} from "@/lib/social";
import { isSupabaseConfigured } from "@/lib/supabase";

const inputClass =
  "w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500";

export default function FriendsPanel() {
  // "loading" until we know; undefined = signed out; null = no username yet.
  const [me, setMe] = useState<Profile | null | undefined | "loading">("loading");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const { confirm, dialog } = useConfirm();

  const refresh = useCallback(() => listFriendships().then(setFriendships), []);

  useEffect(() => {
    getMyProfile().then((p) => {
      setMe(p);
      if (p) refresh();
    });
  }, [refresh]);

  if (!isSupabaseConfigured) return <Note>Friends need sign-in, which isn’t set up yet.</Note>;
  if (me === "loading") return null;
  if (me === undefined) return <SetupPrompt text="Sign in to add friends and see their rankings." cta="Sign in" />;
  if (me === null) return <SetupPrompt text="Pick a username so friends can find you." cta="Pick a username" />;

  const incoming = friendships.filter((f) => f.status === "pending" && f.incoming);
  const outgoing = friendships.filter((f) => f.status === "pending" && !f.incoming);
  const friends = friendships.filter((f) => f.status === "accepted");

  return (
    <div className="space-y-8">
      {dialog}
      <InviteCard username={me.username} />
      <AddByUsername onSent={refresh} />

      {incoming.length > 0 && (
        <Section title="Requests">
          {incoming.map((f) => (
            <PersonRow key={f.id} person={f.other}>
              <button
                type="button"
                onClick={() => acceptRequest(f.id).then(refresh)}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-neutral-950 active:scale-95"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => removeFriendship(f.id).then(refresh)}
                className="px-2 py-1.5 text-sm text-neutral-400 active:text-neutral-200"
              >
                Decline
              </button>
            </PersonRow>
          ))}
        </Section>
      )}

      <Section title={`Your friends${friends.length ? ` (${friends.length})` : ""}`}>
        {friends.length === 0 ? (
          <p className="text-sm text-neutral-500">No friends yet. Share your link or add someone by username.</p>
        ) : (
          friends.map((f) => (
            <PersonRow key={f.id} person={f.other} href={`/u/${f.other.username}`}>
              <button
                type="button"
                aria-label={`Remove ${f.other.display_name}`}
                onClick={async () => {
                  const ok = await confirm(`Remove ${f.other.display_name} as a friend?`, {
                    body: "You’ll stop seeing each other’s rankings.",
                  });
                  if (ok) removeFriendship(f.id).then(refresh);
                }}
                className="px-2 py-1 text-lg text-neutral-600 active:text-neutral-200"
              >
                ×
              </button>
            </PersonRow>
          ))
        )}
      </Section>

      {outgoing.length > 0 && (
        <Section title="Sent">
          {outgoing.map((f) => (
            <PersonRow key={f.id} person={f.other}>
              <button
                type="button"
                onClick={() => removeFriendship(f.id).then(refresh)}
                className="px-2 py-1.5 text-sm text-neutral-400 active:text-neutral-200"
              >
                Cancel
              </button>
            </PersonRow>
          ))}
        </Section>
      )}
    </div>
  );
}

function InviteCard({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  useEffect(() => setLink(inviteLink(username)), [username]);

  async function share() {
    // Phones get the native share sheet; elsewhere, copy to the clipboard.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Add me on Set Rank", url: link });
        return;
      } catch {
        // Cancelled, or not allowed here: fall back to copying.
      }
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-2xl bg-neutral-900 px-5 py-4 ring-1 ring-neutral-800">
      <div>
        <p className="font-semibold">Invite friends</p>
        <p className="text-sm text-neutral-400">Send them your link. Once you accept each other, you can see each other’s rankings.</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-lg bg-neutral-950 px-3 py-2 text-sm text-neutral-300">{link}</span>
        <button
          type="button"
          onClick={share}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 active:scale-95"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}

function AddByUsername({ onSent }: { onSent: () => void }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const handle = cleanUsername(query);
    if (!handle || busy) return;
    setBusy(true);
    setMessage(null);
    const person = await findProfile(handle);
    if (!person) {
      setMessage({ text: `No one with the username @${handle}.`, ok: false });
    } else {
      const err = await sendRequest(person);
      setMessage(err ? { text: err, ok: false } : { text: `Request sent to ${person.display_name}.`, ok: true });
      if (!err) {
        setQuery("");
        onSent();
      }
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Add by username</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="@username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!cleanUsername(query) || busy}
          className="shrink-0 rounded-xl bg-white px-4 font-semibold text-neutral-950 active:scale-95 disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function PersonRow({ person, href, children }: { person: Profile; href?: string; children?: React.ReactNode }) {
  const name = (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-semibold text-neutral-200"
      >
        {person.display_name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{person.display_name}</span>
        <span className="block truncate text-sm text-neutral-500">@{person.username}</span>
      </span>
    </span>
  );
  return (
    <li className="flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800">
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 active:opacity-70">
          {name}
        </Link>
      ) : (
        name
      )}
      {children}
    </li>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">{children}</p>;
}

export function SetupPrompt({ text, cta, next = "/friends" }: { text: string; cta: string; next?: string }) {
  return (
    <div className="space-y-4 rounded-2xl bg-neutral-900 px-5 py-4 ring-1 ring-neutral-800">
      <p className="text-neutral-300">{text}</p>
      <Link
        href={`/account?next=${encodeURIComponent(next)}`}
        className="inline-block rounded-full bg-white px-5 py-2.5 font-semibold text-neutral-950 active:scale-95"
      >
        {cta}
      </Link>
    </div>
  );
}
