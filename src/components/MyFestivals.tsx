"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FestivalSummary } from "@/lib/festivals";
import { loadAllRecords, type FestivalRecord } from "@/lib/storage";

type Entry = { festival: FestivalSummary; record: FestivalRecord };

/** The festivals the user has started, most recent festival first. Hidden until there's at least one. */
export default function MyFestivals({ festivals }: { festivals: FestivalSummary[] }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadAllRecords().then((records) => {
      if (cancelled) return;
      const byId = new Map(festivals.map((f) => [f.id, f]));
      setEntries(
        [...records]
          .flatMap(([id, record]) => {
            const festival = byId.get(id);
            return festival && (record.seen.length > 0 || record.attendedOnly) ? [{ festival, record }] : [];
          })
          // Most recent festival first (by when it happened, not when it was last edited).
          .sort((a, b) => b.festival.startDate.localeCompare(a.festival.startDate)),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [festivals]);

  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Your festivals</h2>
      <ul className="space-y-2">
        {entries.map(({ festival, record }) => {
          const seen = new Set(record.seen);
          const ranked = record.ranked.filter((a) => seen.has(a));
          const done = record.seen.length >= 2 && ranked.length === record.seen.length;
          // "Too long ago to rank": listed as attended, no nudge to keep going.
          const attendedOnly = record.attendedOnly && !done;
          const status = attendedOnly
            ? "Attended · too long ago to rank"
            : record.seen.length < 2
              ? "Pick 1 more set to rank"
              : done
                ? `${ranked.length} sets ranked`
                : `${ranked.length} of ${record.seen.length} sets ranked`;

          return (
            <li key={festival.id}>
              <Link
                href={
                  attendedOnly || record.seen.length < 2 ? `/festival/${festival.id}` : `/festival/${festival.id}/rank`
                }
                className="flex items-center gap-4 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800 active:bg-neutral-800"
              >
                <span aria-hidden className={`size-10 shrink-0 rounded-xl bg-gradient-to-br ${festival.gradient}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {festival.name} <span className="font-normal text-neutral-500">{festival.year}</span>
                  </span>
                  <span className="block truncate text-sm text-neutral-400">
                    {done && ranked[0] ? (
                      <>
                        #1 <span className="text-neutral-200">{ranked[0]}</span> · {status}
                      </>
                    ) : (
                      status
                    )}
                  </span>
                </span>
                {!attendedOnly && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      done ? "bg-neutral-800 text-neutral-300" : "bg-white text-neutral-950"
                    }`}
                  >
                    {done ? "View" : "Continue"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
