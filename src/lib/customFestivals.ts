// Festivals a user added themselves because they weren't in src/lineups. They're stored like any other
// festival record (storage.ts), plus a `meta` block with the festival's details, under a "custom-" id.

import type { Festival, FestivalSummary } from "./festivals";
import type { CustomFestivalMeta, FestivalRecord } from "./storage";
import { getSupabase } from "./supabase";
import { normalize } from "./text";

export const CUSTOM_PREFIX = "custom-";
export const CUSTOM_GRADIENT = "from-slate-200 via-slate-400 to-slate-500";

export const isCustomId = (id: string) => id.startsWith(CUSTOM_PREFIX);
export const newCustomId = () => `${CUSTOM_PREFIX}${crypto.randomUUID()}`;

/** Turns a user-added festival's details into the same shape as a built-in festival. */
export function customFestival(id: string, meta: CustomFestivalMeta): Festival {
  return {
    id,
    name: meta.name,
    year: meta.year,
    startDate: meta.startDate,
    location: meta.location,
    dates: meta.dates,
    gradient: CUSTOM_GRADIENT,
    lineup: [],
  };
}

/**
 * The festival a saved record belongs to — built-in (looked up by id) or user-added (from its meta) —
 * or undefined when there's nothing to show (e.g. a festival that's since been removed from the app).
 */
export function festivalForRecord(
  id: string,
  record: FestivalRecord,
  builtIn: Map<string, FestivalSummary>,
): FestivalSummary | undefined {
  const festival = builtIn.get(id) ?? (record.meta ? customFestival(id, record.meta) : undefined);
  const started = record.seen.length > 0 || record.attendedOnly || record.meta !== null;
  return festival && started ? festival : undefined;
}

/**
 * The official festival a user-added one corresponds to, if it's since been added to the app: same year, and
 * the same name (ignoring case/accents), a listed alias, or one name extending the other by whole words
 * ("Movement" ↔ "Movement Detroit").
 */
export function findOfficialMatch(meta: CustomFestivalMeta, festivals: FestivalSummary[]): FestivalSummary | undefined {
  // Punctuation is ignored too, so a phone's curly apostrophe ("Governor’s") matches a straight one.
  const key = (s: string) =>
    normalize(s)
      .replace(/[^a-z0-9 ]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const wanted = key(meta.name);
  const extends_ = (a: string, b: string) => a.startsWith(`${b} `) || b.startsWith(`${a} `);
  return festivals.find((f) => {
    if (f.year !== meta.year) return false;
    const names = [f.name, ...(f.aliases ?? [])].map(key);
    return names.some((n) => n === wanted || extends_(n, wanted));
  });
}

/** What switching a user-added festival onto the official one will do (and the merged record to save). */
export function planSwitch(custom: FestivalRecord, official: FestivalRecord, lineup: string[]) {
  const byKey = new Map(lineup.map((a) => [normalize(a), a]));
  // Use the official spelling when the artist is on the lineup ("fisher" → "FISHER").
  const toOfficial = (a: string) => byKey.get(normalize(a)) ?? a;
  const unique = (xs: string[]) => [...new Set(xs)];

  const matched = unique(custom.seen.map(toOfficial)).filter((a) => lineup.includes(a));
  const extra = unique(custom.seen.map(toOfficial)).filter((a) => !lineup.includes(a));

  const seen = unique([...official.seen, ...custom.seen.map(toOfficial)]);
  const merged: Omit<FestivalRecord, "updatedAt"> = {
    meta: null,
    seen,
    custom: unique([...official.custom, ...extra]),
    // Keep a ranking they've already made on the official festival; otherwise bring theirs over.
    ranked: official.ranked.length > 0 ? official.ranked : unique(custom.ranked.map(toOfficial)),
    // "Too long ago to rank" only makes sense while they have no sets checked.
    attendedOnly: (official.attendedOnly || custom.attendedOnly) && seen.length === 0,
  };
  return { matched, extra, merged };
}

/**
 * Logs that someone wanted a festival we don't have, so it can be added properly for everyone.
 * Best effort: failures (e.g. signed out with sync not set up) are ignored — the user's own copy still works.
 */
export async function submitFestivalRequest(request: {
  name: string;
  year: number;
  location: string;
  dates: string;
  artists: string[];
}) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("festival_requests").insert(request);
  if (error) console.warn("Couldn't send festival request:", error.message);
}
