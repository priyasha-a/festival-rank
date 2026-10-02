"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ArtistChecklist from "@/components/ArtistChecklist";
import FestivalHeader from "@/components/FestivalHeader";
import SetRanker from "@/components/SetRanker";
import { SwitchBanners } from "@/components/SwitchFestival";
import { customFestival } from "@/lib/customFestivals";
import type { Festival, FestivalSummary } from "@/lib/festivals";
import { loadRecord } from "@/lib/storage";

/** Loads a user-added festival's details from their saved data (they aren't in the built-in list). */
function useCustomFestival(id: string): Festival | null | undefined {
  const [festival, setFestival] = useState<Festival | null | undefined>(undefined);
  useEffect(() => {
    loadRecord(id).then((record) => setFestival(record.meta ? customFestival(id, record.meta) : null));
  }, [id]);
  return festival;
}

const notFound = (
  <div className="space-y-4">
    <p className="text-neutral-400">This festival isn’t saved on this device or in your account.</p>
    <Link href="/" className="text-white underline">
      Back to festivals
    </Link>
  </div>
);

export function CustomFestivalPage({ id, festivals }: { id: string; festivals: FestivalSummary[] }) {
  const festival = useCustomFestival(id);
  if (festival === undefined) return null;
  if (festival === null) return notFound;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ All festivals
      </Link>
      <SwitchBanners festivals={festivals} onlyFor={id} />
      <FestivalHeader festival={festival} />
      <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
        You added this festival. Type more names in the search box to add anyone you missed.
      </p>
      <ArtistChecklist festival={festival} />
    </div>
  );
}

export function CustomRankPage({ id }: { id: string }) {
  const festival = useCustomFestival(id);
  if (festival === undefined) return null;
  if (festival === null) return notFound;
  const { lineup: _lineup, ...summary } = festival;
  return <SetRanker festival={summary} />;
}
