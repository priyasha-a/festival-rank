"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { CompareScreen, RankedList } from "@/components/RankingUI";
import type { FestivalSummary } from "@/lib/festivals";
import { deleteRecord, loadRecord, saveRecord } from "@/lib/storage";
import { useRanking } from "@/lib/useRanking";

const label = (artist: string) => ({ title: artist });

export default function SetRanker({ festival }: { festival: FestivalSummary }) {
  const router = useRouter();
  const [seen, setSeen] = useState<string[] | null>(null);
  const ranking = useRanking((ranked) => saveRecord(festival.id, { ranked }));
  const { start } = ranking;
  const { confirm, dialog } = useConfirm();

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

  /** "Didn't see this": uncheck the artist and carry on with everyone else. */
  function removeArtist(artist: string) {
    const nextSeen = seen!.filter((a) => a !== artist);
    const nextRanked = state!.ranked.filter((a) => a !== artist);
    setSeen(nextSeen);
    saveRecord(festival.id, { seen: nextSeen, ranked: nextRanked });
    start(nextSeen, nextRanked);
  }

  /** The × on a finished ranking asks first; "Didn't see this" mid-comparison doesn't (it's re-checkable). */
  async function confirmRemoveArtist(artist: string) {
    if (await confirm(`Remove ${artist}?`, { body: "They’ll be unchecked and taken out of your ranking." }))
      removeArtist(artist);
  }

  async function removeFestival() {
    const name = `${festival.name} ${festival.year}`;
    if (!(await confirm(`Remove ${name}?`, { body: "Your picks and ranking for it will be deleted." }))) return;
    await deleteRecord(festival.id);
    router.push("/");
  }

  const backLink = (
    <Link href={`/festival/${festival.id}`} className="inline-block text-sm text-neutral-400 active:text-neutral-200">
      ‹ Edit sets
    </Link>
  );

  // Rendered on every view of this page; the confirm dialog rides along with it.
  const removeFestivalLink = (
    <div className="border-t border-neutral-900 pt-4 text-center">
      {dialog}
      <button type="button" onClick={removeFestival} className="px-3 py-2 text-sm text-neutral-500 active:text-red-400">
        Didn’t go? Remove this festival
      </button>
    </div>
  );

  if (seen.length < 2) {
    return (
      <div className="space-y-6">
        {backLink}
        <p className="text-neutral-400">Pick at least 2 sets you saw at {festival.name} to start ranking.</p>
        {removeFestivalLink}
      </div>
    );
  }

  if (state.current) {
    return (
      <div className="space-y-6">
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
          onRemove={removeArtist}
        />
        {removeFestivalLink}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {backLink}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          Your {festival.name} {festival.year} ranking
        </h1>
        <p className="text-sm text-neutral-500">Tap ↻ to re-rank a set, or × if you didn’t see it.</p>
      </header>

      <RankedList
        ranked={state.ranked}
        label={label}
        gradient={festival.gradient}
        onRerank={ranking.rerank}
        onRemove={confirmRemoveArtist}
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

      {removeFestivalLink}
    </div>
  );
}
