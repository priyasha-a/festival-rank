"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FestivalSummary } from "@/lib/festivals";
import {
  choose,
  comparisonsLeft,
  initialState,
  midpoint,
  rerank,
  settle,
  tie,
  type RankState,
} from "@/lib/ranking";
import { loadRecord, saveRecord } from "@/lib/storage";

export default function SetRanker({ festival }: { festival: FestivalSummary }) {
  const [seen, setSeen] = useState<string[] | null>(null);
  const [state, setState] = useState<RankState>({ ranked: [], queue: [], current: null });
  const [history, setHistory] = useState<RankState[]>([]);

  // Saved data lives in the browser (and Supabase), so load after mount to avoid a hydration mismatch.
  useEffect(() => {
    let cancelled = false;
    loadRecord(festival.id).then((record) => {
      if (cancelled) return;
      setSeen(record.seen);
      setState(initialState(record.seen, record.ranked));
    });
    return () => {
      cancelled = true;
    };
  }, [festival.id]);

  useEffect(() => {
    if (seen) saveRecord(festival.id, { ranked: state.ranked });
  }, [state.ranked, seen, festival.id]);

  function update(next: RankState) {
    setHistory((h) => [...h, state]);
    setState(next);
  }

  function undo() {
    if (history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }

  if (seen === null) return null;

  const backLink = (
    <Link href={`/festival/${festival.id}`} className="inline-block text-sm text-neutral-400 active:text-neutral-200">
      ‹ Edit sets
    </Link>
  );

  if (seen.length < 2) {
    return (
      <div className="space-y-6">
        {backLink}
        <p className="text-neutral-400">Pick at least 2 sets you saw at {festival.name} to start ranking.</p>
      </div>
    );
  }

  const { ranked, queue, current } = state;
  const total = ranked.length + queue.length + (current ? 1 : 0);

  if (current) {
    const opponent = ranked[midpoint(current)];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {backLink}
          <span className="text-sm text-neutral-500">
            {ranked.length} of {total} ranked
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full bg-gradient-to-r ${festival.gradient} transition-all`}
            style={{ width: `${(ranked.length / total) * 100}%` }}
          />
        </div>

        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Which set was better?</h1>
          <p className="text-sm text-neutral-500">
            {festival.name} {festival.year} · about {comparisonsLeft(current)} more for this one
          </p>
        </header>

        <div className="space-y-3">
          <ChoiceButton artist={current.artist} gradient={festival.gradient} onClick={() => update(choose(state, true))} />
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-neutral-600">or</p>
          <ChoiceButton artist={opponent} gradient={festival.gradient} onClick={() => update(choose(state, false))} />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="rounded-full px-4 py-2 text-sm text-neutral-400 active:text-neutral-200 disabled:opacity-30"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={() => update(tie(state))}
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300 ring-1 ring-neutral-800 active:bg-neutral-800"
          >
            Too close to call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {backLink}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Your {festival.name} {festival.year} ranking</h1>
        <p className="text-sm text-neutral-500">Tap ↻ to re-rank a set.</p>
      </header>

      <ol className="space-y-2">
        {ranked.map((artist, i) => (
          <li
            key={artist}
            className={
              i === 0
                ? `rounded-2xl bg-gradient-to-br ${festival.gradient} p-[2px]`
                : "rounded-2xl ring-1 ring-neutral-800"
            }
          >
            <div className="flex items-center gap-4 rounded-[14px] bg-neutral-950/85 py-3 pl-4 pr-1">
              <span className="w-7 shrink-0 text-right text-lg font-bold tabular-nums text-neutral-500">{i + 1}</span>
              <span className={`min-w-0 flex-1 truncate ${i === 0 ? "text-lg font-semibold" : ""}`}>{artist}</span>
              <button
                type="button"
                onClick={() => update(rerank(state, artist))}
                aria-label={`Re-rank ${artist}`}
                className="shrink-0 px-3 py-1 text-lg text-neutral-500 active:text-neutral-200"
              >
                ↻
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="rounded-full px-3 py-2 text-sm text-neutral-400 active:text-neutral-200 disabled:opacity-30"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={() => update(settle({ ranked: [], queue: seen, current: null }))}
            className="rounded-full px-3 py-2 text-sm text-neutral-500 active:text-neutral-200"
          >
            Start over
          </button>
        </div>
        <Link href="/" className="rounded-full bg-white px-6 py-2.5 font-semibold text-neutral-950 active:scale-95">
          Done
        </Link>
      </div>
    </div>
  );
}

function ChoiceButton({ artist, gradient, onClick }: { artist: string; gradient: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-3xl bg-gradient-to-br ${gradient} p-[2px] transition active:scale-[0.97]`}
    >
      <span className="flex min-h-32 items-center justify-center rounded-[22px] bg-neutral-950/85 px-6 py-8 text-center text-2xl font-bold leading-tight">
        {artist}
      </span>
    </button>
  );
}
