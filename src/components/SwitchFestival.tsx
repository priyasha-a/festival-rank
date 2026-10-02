"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FestivalHeader from "@/components/FestivalHeader";
import { findOfficialMatch, isCustomId, planSwitch } from "@/lib/customFestivals";
import type { Festival, FestivalSummary } from "@/lib/festivals";
import { deleteRecord, loadAllRecords, loadRecord, saveRecord, type FestivalRecord } from "@/lib/storage";

const DISMISS_PREFIX = "setrank:dismissed-switch:"; // "setrank:" so sign-out clears it

type Match = { customId: string; customName: string; official: FestivalSummary };

/** Banners offering to move user-added festivals onto official ones that have since been added. */
export function SwitchBanners({ festivals, onlyFor }: { festivals: FestivalSummary[]; onlyFor?: string }) {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadAllRecords().then((records) => {
      if (cancelled) return;
      setMatches(
        [...records].flatMap(([id, record]) => {
          if (!isCustomId(id) || !record.meta || (onlyFor && id !== onlyFor)) return [];
          // The home page respects "Not now"; the festival's own page always offers it.
          if (!onlyFor && localStorage.getItem(DISMISS_PREFIX + id)) return [];
          const official = findOfficialMatch(record.meta, festivals);
          return official ? [{ customId: id, customName: `${record.meta.name} ${record.meta.year}`, official }] : [];
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [festivals, onlyFor]);

  if (matches.length === 0) return null;

  return (
    <div className="space-y-3">
      {matches.map(({ customId, customName, official }) => (
        <div key={customId} className={`rounded-2xl bg-gradient-to-br ${official.gradient} p-[2px]`}>
          <div className="space-y-3 rounded-[14px] bg-neutral-950/90 px-4 py-3">
            <div>
              <p className="font-semibold">
                {official.name} {official.year} is now in Set Rank 🎉
              </p>
              <p className="text-sm text-neutral-400">
                Switch “{customName}” over to the full lineup? Your picks and ranking come with you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/festival/${official.id}/switch?from=${encodeURIComponent(customId)}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 active:scale-95"
              >
                Switch
              </Link>
              {!onlyFor && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(DISMISS_PREFIX + customId, "1");
                    setMatches((m) => m.filter((x) => x.customId !== customId));
                  }}
                  className="px-3 py-2 text-sm text-neutral-400 active:text-neutral-200"
                >
                  Not now
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The confirmation screen: shows what will move, then merges and removes the user-added copy. */
export function SwitchPanel({ festival }: { festival: Festival }) {
  const router = useRouter();
  const [fromId, setFromId] = useState<string | null>(null);
  const [records, setRecords] = useState<{ custom: FestivalRecord; official: FestivalRecord } | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (!from || !isCustomId(from)) return setRecords(null);
    setFromId(from);
    Promise.all([loadRecord(from), loadRecord(festival.id)]).then(([custom, official]) =>
      setRecords(custom.meta ? { custom, official } : null),
    );
  }, [festival.id]);

  if (records === undefined) return null;

  const back = (
    <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
      ‹ Home
    </Link>
  );
  if (records === null || !fromId) {
    return (
      <div className="space-y-6">
        {back}
        <p className="text-neutral-400">Nothing to switch. It may have been switched already.</p>
      </div>
    );
  }

  const { matched, extra, merged } = planSwitch(records.custom, records.official, festival.lineup);
  const customName = `${records.custom.meta!.name} ${records.custom.meta!.year}`;

  async function confirm() {
    setBusy(true);
    saveRecord(festival.id, merged);
    await deleteRecord(fromId!);
    router.push(merged.seen.length >= 2 ? `/festival/${festival.id}/rank` : `/festival/${festival.id}`);
  }

  return (
    <div className="space-y-6">
      {back}
      <FestivalHeader festival={festival} />

      <div className="space-y-3 rounded-2xl bg-neutral-900 px-5 py-4 ring-1 ring-neutral-800">
        <p className="font-semibold">Switch “{customName}” to the official festival?</p>
        <ul className="space-y-1 text-sm text-neutral-300">
          <li>
            ✓ {matched.length} {matched.length === 1 ? "artist matches" : "artists match"} the official lineup
          </li>
          {extra.length > 0 && (
            <li>
              + {extra.length} {extra.length === 1 ? "artist isn’t" : "artists aren’t"} on it and will stay as{" "}
              {extra.length === 1 ? "an artist" : "artists"} you added ({extra.slice(0, 3).join(", ")}
              {extra.length > 3 ? "…" : ""})
            </li>
          )}
          {records.official.ranked.length > 0 ? (
            <li>✓ Your existing ranking for this festival is kept</li>
          ) : (
            records.custom.ranked.length > 0 && <li>✓ Your ranking comes with you</li>
          )}
        </ul>
        <p className="text-sm text-neutral-500">Your own copy is then removed, so it won’t show up twice.</p>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/" className="px-2 py-2 text-sm text-neutral-400 active:text-neutral-200">
          Not now
        </Link>
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="rounded-full bg-white px-6 py-3 font-semibold text-neutral-950 active:scale-95 disabled:opacity-40"
        >
          {busy ? "Switching…" : "Switch"}
        </button>
      </div>
    </div>
  );
}

