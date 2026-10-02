"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { friendsAtFestival, type Profile } from "@/lib/social";
import type { FestivalRecord } from "@/lib/storage";

/** "Friends who went" for one festival, each linking to a side-by-side compare. Hidden when there are none. */
export default function FriendsWhoWent({ festivalId }: { festivalId: string }) {
  const [friends, setFriends] = useState<{ friend: Profile; record: FestivalRecord }[]>([]);

  useEffect(() => {
    let cancelled = false;
    friendsAtFestival(festivalId).then((list) => {
      if (!cancelled) setFriends(list);
    });
    return () => {
      cancelled = true;
    };
  }, [festivalId]);

  if (friends.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
        {friends.length === 1 ? "A friend went" : `${friends.length} friends went`}
      </h2>
      <ul className="space-y-2">
        {friends.map(({ friend, record }) => {
          const seen = new Set(record.seen);
          const ranked = record.ranked.filter((a) => seen.has(a));
          const status =
            ranked.length > 0
              ? `#1 ${ranked[0]} · ${record.seen.length} ${record.seen.length === 1 ? "set" : "sets"}`
              : record.seen.length > 0
                ? `${record.seen.length} ${record.seen.length === 1 ? "set" : "sets"} seen`
                : "Went · too long ago to rank";
          return (
            <li key={friend.id}>
              <Link
                href={`/u/${friend.username}/festival/${festivalId}`}
                className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800 active:bg-neutral-800"
              >
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-semibold"
                >
                  {friend.display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{friend.display_name}</span>
                  <span className="block truncate text-sm text-neutral-400">{status}</span>
                </span>
                <span className="shrink-0 text-sm text-neutral-400">Compare ›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
