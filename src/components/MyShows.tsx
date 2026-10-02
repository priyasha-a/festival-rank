"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { loadShows, saveShows, SHOWS_GRADIENT, showSubtitle, type Show, type ShowsRecord } from "@/lib/shows";

type Row = { show: Show; rank: number | null };

/** Ranked shows first (in order), then unranked ones. */
function toRows({ shows, ranked }: Pick<ShowsRecord, "shows" | "ranked">): Row[] {
  const position = new Map(ranked.map((id, i) => [id, i + 1]));
  return shows
    .map((show) => ({ show, rank: position.get(show.id) ?? null }))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}

/** The user's solo shows, best first (unranked ones last). Hidden until they've logged one. */
export default function MyShows() {
  const [record, setRecord] = useState<ShowsRecord | null>(null);
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    let cancelled = false;
    loadShows().then((r) => {
      if (!cancelled) setRecord(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!record || record.shows.length === 0) return null;

  async function remove(show: Show) {
    if (!record || !(await confirm(`Remove ${show.artist}?`, { body: "It’ll be taken out of your shows ranking." })))
      return;
    const shows = record.shows.filter((s) => s.id !== show.id);
    const ranked = record.ranked.filter((id) => id !== show.id);
    setRecord({ ...record, shows, ranked });
    saveShows({ shows, ranked });
  }

  return (
    <section className="space-y-3">
      {dialog}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Your shows</h2>
      <ul className="space-y-2">
        {toRows(record).map(({ show, rank }) => (
          <li
            key={show.id}
            className="flex min-h-[4.25rem] items-center overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-neutral-800"
          >
            <Link href="/shows" className="flex min-w-0 flex-1 items-center gap-4 self-stretch py-3 pl-4 pr-1 active:bg-neutral-800">
              <span
                aria-hidden
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${SHOWS_GRADIENT} font-bold text-neutral-950`}
              >
                {rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{show.artist}</span>
                {showSubtitle(show) && (
                  <span className="block truncate text-sm text-neutral-400">{showSubtitle(show)}</span>
                )}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => remove(show)}
              aria-label={`Remove ${show.artist}`}
              className="shrink-0 self-stretch px-3 text-lg text-neutral-600 active:text-red-400"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
