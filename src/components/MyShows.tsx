"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadShows, SHOWS_GRADIENT, type ShowsRecord } from "@/lib/shows";

/** Home-page entry point for solo shows: a summary once you have some, an invitation before that. */
export default function MyShows() {
  const [record, setRecord] = useState<ShowsRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadShows().then((r) => {
      if (!cancelled) setRecord(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (record === null) return null;

  const { shows, ranked } = record;
  const byId = new Map(shows.map((s) => [s.id, s]));
  const top = ranked.map((id) => byId.get(id)).find(Boolean);
  const unranked = shows.filter((s) => !ranked.includes(s.id)).length;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Your shows</h2>
      {shows.length === 0 ? (
        <Link
          href="/shows/new"
          className="flex items-center gap-4 rounded-2xl border border-dashed border-neutral-700 px-4 py-3 active:bg-neutral-900"
        >
          <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${SHOWS_GRADIENT} text-xl font-bold text-neutral-950`}>
            +
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Went to a solo show?</span>
            <span className="block text-sm text-neutral-400">Log it and rank it against your other shows</span>
          </span>
        </Link>
      ) : (
        <div className="flex gap-2">
          <Link
            href="/shows"
            className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800 active:bg-neutral-800"
          >
            <span aria-hidden className={`size-10 shrink-0 rounded-xl bg-gradient-to-br ${SHOWS_GRADIENT}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">
                {shows.length} {shows.length === 1 ? "show" : "shows"}
              </span>
              <span className="block truncate text-sm text-neutral-400">
                {unranked > 0 ? (
                  `${unranked} waiting to be ranked`
                ) : top ? (
                  <>
                    #1 <span className="text-neutral-200">{top.artist}</span>
                  </>
                ) : null}
              </span>
            </span>
          </Link>
          <Link
            href="/shows/new"
            aria-label="Add a show"
            className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-2xl text-neutral-300 ring-1 ring-neutral-800 active:bg-neutral-800"
          >
            +
          </Link>
        </div>
      )}
    </section>
  );
}
