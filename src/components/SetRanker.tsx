"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CompareScreen, RankedList } from "@/components/RankingUI";
import type { FestivalSummary } from "@/lib/festivals";
import { loadRecord, saveRecord } from "@/lib/storage";
import { useRanking } from "@/lib/useRanking";

const label = (artist: string) => ({ title: artist });

export default function SetRanker({ festival }: { festival: FestivalSummary }) {
  const [seen, setSeen] = useState<string[] | null>(null);
  const ranking = useRanking((ranked) => saveRecord(festival.id, { ranked }));
  const { start } = ranking;

  // Saved data lives in the browser (and Supabase), so load after mount to avoid a hydration mismatch.
  useEffect(() => {
    let cancelled = false;
    loadRecord(festival.id).then((record) => {
      if (cancelled) return;
      setSeen(record.seen);
      start(record.seen, record.ranked);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per festival
  }, [festival.id]);

  const { state } = ranking;
  if (seen === null || state === null) return null;

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

  if (state.current) {
    return (
      <CompareScreen
        state={{ ...state, current: state.current }}
        label={label}
        question="Which set was better?"
        context={`${festival.name} ${festival.year}`}
        gradient={festival.gradient}
        topLeft={backLink}
        onChoose={ranking.choose}
        onTie={ranking.tie}
        onUndo={ranking.undo}
        canUndo={ranking.canUndo}
      />
    );
  }

  return (
    <div className="space-y-6">
      {backLink}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          Your {festival.name} {festival.year} ranking
        </h1>
        <p className="text-sm text-neutral-500">Tap ↻ to re-rank a set.</p>
      </header>

      <RankedList ranked={state.ranked} label={label} gradient={festival.gradient} onRerank={ranking.rerank} />

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
          <button
            type="button"
            onClick={() => ranking.startOver(seen)}
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
