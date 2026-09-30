"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Festival } from "@/lib/festivals";
import { loadRecord, saveRecord } from "@/lib/storage";

const MIN_TO_RANK = 2;
const MAX_NAME_LENGTH = 60;

// Case- and accent-insensitive, so "tiesto" finds "Tiësto".
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const cleanName = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);

export default function ArtistChecklist({ festival }: { festival: Festival }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");

  // Official lineup (billing order) followed by anything the user added.
  const allArtists = useMemo(() => [...festival.lineup, ...custom], [festival.lineup, custom]);

  // Saved data lives in the browser (and Supabase), so load after mount to avoid a hydration mismatch.
  useEffect(() => {
    let cancelled = false;
    loadRecord(festival.id).then((record) => {
      if (cancelled) return;
      const lineupKeys = new Set(festival.lineup.map(normalize));
      const storedCustom = record.custom.filter((a) => !lineupKeys.has(normalize(a)));
      const valid = new Set([...festival.lineup, ...storedCustom]);
      setCustom(storedCustom);
      setSeen(new Set(record.seen.filter((a) => valid.has(a))));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [festival]);

  useEffect(() => {
    if (!loaded) return;
    saveRecord(festival.id, { custom, seen: allArtists.filter((a) => seen.has(a)) });
  }, [seen, custom, allArtists, loaded, festival.id]);

  const q = normalize(cleanName(query));
  const visible = q ? allArtists.filter((a) => normalize(a).includes(q)) : allArtists;
  const newName = cleanName(query);
  const canAdd = q.length > 0 && !allArtists.some((a) => normalize(a) === q);

  function toggle(artist: string) {
    setSeen((prev) => {
      const next = new Set(prev);
      if (next.has(artist)) next.delete(artist);
      else next.add(artist);
      return next;
    });
  }

  function addArtist() {
    if (!canAdd) return;
    setCustom((prev) => [...prev, newName]);
    setSeen((prev) => new Set(prev).add(newName));
    setQuery("");
  }

  function removeArtist(artist: string) {
    setCustom((prev) => prev.filter((a) => a !== artist));
    setSeen((prev) => {
      const next = new Set(prev);
      next.delete(artist);
      return next;
    });
  }

  const count = seen.size;
  const canRank = count >= MIN_TO_RANK;
  const customSet = new Set(custom);

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold">Which sets did you see?</h2>
        {count > 0 && (
          <button
            type="button"
            onClick={() => setSeen(new Set())}
            className="shrink-0 text-sm text-neutral-400 active:text-neutral-200"
          >
            Clear
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addArtist();
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or add an artist"
          maxLength={MAX_NAME_LENGTH}
          enterKeyHint={canAdd ? "done" : "search"}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500"
        />
      </form>

      <ul className="divide-y divide-neutral-900 overflow-hidden rounded-2xl bg-neutral-900/60 ring-1 ring-neutral-800">
        {visible.map((artist) => {
          const checked = seen.has(artist);
          const isCustom = customSet.has(artist);
          return (
            <li key={artist} className="flex items-center active:bg-neutral-800">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(artist)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400 ${
                    checked ? "border-transparent bg-white text-neutral-950" : "border-neutral-600"
                  }`}
                >
                  {checked && "✓"}
                </span>
                <span className={`truncate ${checked ? "font-medium text-white" : "text-neutral-300"}`}>
                  {artist}
                </span>
                {isCustom && (
                  <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                    added
                  </span>
                )}
              </label>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => removeArtist(artist)}
                  aria-label={`Remove ${artist}`}
                  className="shrink-0 px-4 py-3.5 text-lg text-neutral-500 active:text-neutral-200"
                >
                  ×
                </button>
              )}
            </li>
          );
        })}

        {canAdd ? (
          <li>
            <button
              type="button"
              onClick={addArtist}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-800"
            >
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-500 text-neutral-300"
              >
                +
              </span>
              <span className="min-w-0 truncate text-neutral-200">
                Add “<span className="font-medium text-white">{newName}</span>”
              </span>
            </button>
          </li>
        ) : (
          !q && (
            <li className="px-4 py-3.5 text-sm text-neutral-500">
              Don’t see someone? Type their name above to add them.
            </li>
          )
        )}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-900 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <span className="text-sm text-neutral-400">
            {count} {count === 1 ? "set" : "sets"} selected
          </span>
          {canRank ? (
            <Link
              href={`/festival/${festival.id}/rank`}
              className={`rounded-full bg-gradient-to-r ${festival.gradient} px-6 py-3 font-semibold text-neutral-950 active:scale-95`}
            >
              Rank them →
            </Link>
          ) : (
            <span className="rounded-full bg-neutral-800 px-6 py-3 font-semibold text-neutral-500">
              Pick {MIN_TO_RANK - count} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
