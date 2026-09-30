"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadShows, SHOWS_GRADIENT, showSubtitle, type Show } from "@/lib/shows";

/** The user's solo shows, best first (unranked ones last). Hidden until they've logged one. */
export default function MyShows() {
  const [shows, setShows] = useState<{ show: Show; rank: number | null }[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadShows().then(({ shows, ranked }) => {
      if (cancelled) return;
      const position = new Map(ranked.map((id, i) => [id, i + 1]));
      setShows(
        shows
          .map((show) => ({ show, rank: position.get(show.id) ?? null }))
          .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (shows.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Your shows</h2>
      <ul className="space-y-2">
        {shows.map(({ show, rank }) => (
          <li key={show.id}>
            <Link
              href="/shows"
              className="flex items-center gap-4 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800 active:bg-neutral-800"
            >
              <span
                aria-hidden
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${SHOWS_GRADIENT} font-bold text-neutral-950`}
              >
                {rank ?? "–"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{show.artist}</span>
                <span className="block truncate text-sm text-neutral-400">
                  {rank === null ? "Not ranked yet" : showSubtitle(show) || `#${rank} of your shows`}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  rank === null ? "bg-white text-neutral-950" : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {rank === null ? "Rank" : "View"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
