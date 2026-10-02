"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { CompareScreen, RankedList } from "@/components/RankingUI";
import { loadShows, saveShows, SHOWS_GRADIENT, showSubtitle, type Show } from "@/lib/shows";
import { useRanking } from "@/lib/useRanking";

const homeLink = (
  <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
    ‹ Home
  </Link>
);

const addButton = (
  <Link
    href="/shows/new"
    className="block rounded-2xl border border-dashed border-neutral-700 px-4 py-3 text-center font-medium text-neutral-200 active:bg-neutral-900"
  >
    + Add a show
  </Link>
);

export default function ShowsRanker() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const ranking = useRanking((ranked) => saveShows({ ranked }));
  const { start } = ranking;
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    let cancelled = false;
    loadShows().then((record) => {
      if (cancelled) return;
      setShows(record.shows);
      // Any show not in the saved ranking yet (e.g. one just added) gets queued for comparisons.
      start(
        record.shows.map((s) => s.id),
        record.ranked,
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);

  const { state } = ranking;
  if (shows === null || state === null) return null;

  const byId = new Map(shows.map((s) => [s.id, s]));
  const label = (id: string) => {
    const show = byId.get(id);
    return show ? { title: show.artist, subtitle: showSubtitle(show) || undefined } : { title: "Removed show" };
  };

  async function remove(id: string) {
    const show = byId.get(id);
    if (!show || !state) return;
    if (!(await confirm(`Remove ${show.artist}?`, { body: "It’ll be taken out of your shows ranking." }))) return;
    const remaining = shows!.filter((s) => s.id !== id);
    const ranked = state.ranked.filter((r) => r !== id);
    setShows(remaining);
    saveShows({ shows: remaining, ranked });
    start(
      remaining.map((s) => s.id),
      ranked,
    );
  }

  if (shows.length === 0) {
    return (
      <div className="space-y-6">
        {homeLink}
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Your shows</h1>
          <p className="text-neutral-400">
            Log the solo shows you’ve been to and rank them against each other, from your best concert down.
          </p>
        </header>
        {addButton}
      </div>
    );
  }

  if (state.current) {
    return (
      <CompareScreen
        state={{ ...state, current: state.current }}
        label={label}
        question="Which show was better?"
        context="Your shows"
        gradient={SHOWS_GRADIENT}
        topLeft={homeLink}
        onChoose={ranking.choose}
        onTie={ranking.tie}
        onUndo={ranking.undo}
        canUndo={ranking.canUndo}
      />
    );
  }

  return (
    <div className="space-y-6">
      {homeLink}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Your shows</h1>
        <p className="text-sm text-neutral-500">
          {shows.length === 1
            ? "Add another show to start comparing."
            : `${shows.length} shows ranked. Tap ↻ to re-rank one.`}
        </p>
      </header>

      {addButton}
      {dialog}

      <RankedList
        ranked={state.ranked}
        label={label}
        gradient={SHOWS_GRADIENT}
        onRerank={ranking.rerank}
        onRemove={remove}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center">
          <button
            type="button"
            onClick={ranking.undo}
            disabled={!ranking.canUndo}
            className="rounded-full px-3 py-2 text-sm text-neutral-400 active:text-neutral-200 disabled:opacity-30"
          >
            ↶ Undo
          </button>
          {shows.length > 1 && (
            <button
              type="button"
              onClick={() => ranking.startOver(shows.map((s) => s.id))}
              className="rounded-full px-3 py-2 text-sm text-neutral-500 active:text-neutral-200"
            >
              Start over
            </button>
          )}
        </div>
        <Link href="/" className="rounded-full bg-white px-6 py-2.5 font-semibold text-neutral-950 active:scale-95">
          Done
        </Link>
      </div>
    </div>
  );
}
