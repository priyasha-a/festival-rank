"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SetupPrompt } from "@/components/FriendsPanel";
import { RankedList } from "@/components/RankingUI";
import { customFestival, festivalForRecord } from "@/lib/customFestivals";
import type { FestivalSummary } from "@/lib/festivals";
import { SHOWS_GRADIENT, showSubtitle, type ShowsRecord } from "@/lib/shows";
import {
  acceptRequest,
  findProfile,
  friendFestivals,
  friendShows,
  getMyProfile,
  listFriendships,
  sendRequest,
  type Friendship,
  type Profile,
} from "@/lib/social";
import type { FestivalRecord } from "@/lib/storage";

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "no-username" }
  | { kind: "not-found" }
  | { kind: "self" }
  | { kind: "person"; me: Profile; them: Profile; friendship: Friendship | null };

/**
 * A person's page — and the invite link (/u/username). Friends see their festivals and shows;
 * everyone else sees an Add friend / Accept button.
 */
export default function FriendProfile({ username, festivals }: { username: string; festivals: FestivalSummary[] }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [records, setRecords] = useState<Map<string, FestivalRecord> | null>(null);
  const [shows, setShows] = useState<ShowsRecord | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const me = await getMyProfile();
    if (me === undefined) return setState({ kind: "signed-out" });
    if (me === null) return setState({ kind: "no-username" });
    const them = await findProfile(username);
    if (!them) return setState({ kind: "not-found" });
    if (them.id === me.id) return setState({ kind: "self" });
    const friendship = (await listFriendships()).find((f) => f.other.id === them.id) ?? null;
    setState({ kind: "person", me, them, friendship });
    if (friendship?.status === "accepted") {
      const [r, s] = await Promise.all([friendFestivals(them.id), friendShows(them.id)]);
      setRecords(r);
      setShows(s);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  const here = `/u/${username}`;
  if (state.kind === "loading") return null;
  if (state.kind === "signed-out")
    return <SetupPrompt text={`Sign in to add @${username} as a friend.`} cta="Sign in" next={here} />;
  if (state.kind === "no-username")
    return <SetupPrompt text="Pick a username first, then you can add friends." cta="Pick a username" next={here} />;
  if (state.kind === "not-found") return <p className="text-neutral-400">No one has the username @{username}.</p>;
  if (state.kind === "self")
    return (
      <p className="text-neutral-400">
        This is your own page. Share this link with friends, or{" "}
        <Link href="/friends" className="text-white underline">
          manage friends
        </Link>
        .
      </p>
    );

  const { them, friendship } = state;
  const header = (
    <header className="flex items-center gap-4">
      <span
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-2xl font-bold"
      >
        {them.display_name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold">{them.display_name}</h1>
        <p className="truncate text-neutral-400">@{them.username}</p>
      </div>
    </header>
  );

  if (friendship?.status !== "accepted") {
    async function add() {
      setError("");
      const err = await sendRequest(them);
      if (err) setError(err);
      load();
    }
    return (
      <div className="space-y-6">
        {header}
        {!friendship && (
          <button
            type="button"
            onClick={add}
            className="w-full rounded-full bg-white px-5 py-3 font-semibold text-neutral-950 active:scale-[0.98]"
          >
            Add friend
          </button>
        )}
        {friendship?.incoming && (
          <button
            type="button"
            onClick={() => acceptRequest(friendship.id).then(load)}
            className="w-full rounded-full bg-white px-5 py-3 font-semibold text-neutral-950 active:scale-[0.98]"
          >
            Accept friend request
          </button>
        )}
        {friendship && !friendship.incoming && (
          <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
            Request sent. You’ll see {them.display_name}’s rankings once they accept.
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  if (!records) return header;

  const byId = new Map(festivals.map((f) => [f.id, f]));
  const theirFestivals = [...records]
    .flatMap(([id, record]) => {
      const festival = festivalForRecord(id, record, byId);
      return festival ? [{ festival, record }] : [];
    })
    .sort((a, b) => b.festival.startDate.localeCompare(a.festival.startDate));

  const showById = new Map((shows?.shows ?? []).map((s) => [s.id, s]));
  const rankedShows = (shows?.ranked ?? []).filter((id) => showById.has(id));

  return (
    <div className="space-y-8">
      {header}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Festivals</h2>
        {theirFestivals.length === 0 ? (
          <p className="text-sm text-neutral-500">No festivals yet.</p>
        ) : (
          <ul className="space-y-2">
            {theirFestivals.map(({ festival, record }) => {
              const seen = new Set(record.seen);
              const ranked = record.ranked.filter((a) => seen.has(a));
              const status =
                ranked.length >= 2
                  ? `#1 ${ranked[0]} · ${ranked.length} sets ranked`
                  : record.attendedOnly
                    ? "Attended · too long ago to rank"
                    : `${record.seen.length} ${record.seen.length === 1 ? "set" : "sets"} seen`;
              return (
                <li key={festival.id}>
                  <Link
                    href={`/u/${them.username}/festival/${festival.id}`}
                    className="flex items-center gap-4 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800 active:bg-neutral-800"
                  >
                    <span aria-hidden className={`size-10 shrink-0 rounded-xl bg-gradient-to-br ${festival.gradient}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {festival.name} <span className="font-normal text-neutral-500">{festival.year}</span>
                      </span>
                      <span className="block truncate text-sm text-neutral-400">{status}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Shows</h2>
        {rankedShows.length === 0 ? (
          <p className="text-sm text-neutral-500">No shows yet.</p>
        ) : (
          <RankedList
            ranked={rankedShows}
            gradient={SHOWS_GRADIENT}
            label={(id) => {
              const show = showById.get(id)!;
              return { title: show.artist, subtitle: showSubtitle(show) || undefined };
            }}
          />
        )}
      </section>
    </div>
  );
}

/**
 * One of a friend's festival rankings, read-only. `builtIn` is the festival's details when it's one of the
 * app's festivals; for a festival the friend added themselves, the details come from their saved record.
 */
export function FriendFestivalRanking({
  username,
  festivalId,
  builtIn,
}: {
  username: string;
  festivalId: string;
  builtIn?: FestivalSummary;
}) {
  const [them, setThem] = useState<Profile | null | undefined>(undefined);
  const [record, setRecord] = useState<FestivalRecord | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const person = await findProfile(username);
      setThem(person);
      if (person) setRecord((await friendFestivals(person.id)).get(festivalId) ?? null);
    })();
  }, [username, festivalId]);

  if (them === undefined || (them && record === undefined)) return null;
  const festival = builtIn ?? (record?.meta ? customFestival(festivalId, record.meta) : undefined);
  if (!them || !record || !festival) {
    return <p className="text-neutral-400">Nothing to show here. You may need to be friends with @{username} first.</p>;
  }

  const seen = new Set(record.seen);
  const ranked = record.ranked.filter((a) => seen.has(a));
  const unranked = record.seen.filter((a) => !ranked.includes(a));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          {them.display_name}’s {festival.name} {festival.year}
        </h1>
        <p className="text-sm text-neutral-500">
          {[festival.location, festival.dates].filter(Boolean).join(" · ")}
        </p>
      </header>

      {ranked.length > 0 && <RankedList ranked={ranked} label={(a) => ({ title: a })} gradient={festival.gradient} />}

      {unranked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            {ranked.length > 0 ? "Also saw (not ranked yet)" : "Sets they saw"}
          </h2>
          <p className="text-neutral-300">{unranked.join(" · ")}</p>
        </section>
      )}

      {record.attendedOnly && record.seen.length === 0 && (
        <p className="text-neutral-400">They went, but it was too long ago to rank.</p>
      )}
    </div>
  );
}
