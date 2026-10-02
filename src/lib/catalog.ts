// Server-side festival catalog: the built-in lineups in src/lineups, merged with the `festivals` table in
// Supabase. A database row with the same id replaces the built-in one (that's how the admin page edits a
// festival); rows marked hidden remove it from the app; other rows are festivals added since. If the database
// can't be reached, the built-in list is used on its own, so the site keeps working.

import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { cache } from "react";
import { ALL_FESTIVALS } from "@/lineups";
import { GRADIENTS, type Festival } from "./festivals";

export type CatalogEntry = {
  festival: Festival;
  /** Hidden from the app by an admin (still listed on the admin page so it can be un-hidden). */
  hidden: boolean;
  /** True when the database has a copy (edited or added via the admin page). */
  inDatabase: boolean;
  /** True when it ships with the code (src/lineups). */
  builtIn: boolean;
};

export type FestivalRow = {
  id: string;
  name: string;
  year: number;
  start_date: string;
  location: string;
  dates: string;
  gradient: string;
  partial: boolean;
  aliases: string[];
  lineup: string[];
  hidden: boolean;
};

const ALLOWED_GRADIENTS = new Set(GRADIENTS.map((g) => g.value));

function festivalFromRow(row: FestivalRow): Festival {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    startDate: row.start_date,
    location: row.location,
    dates: row.dates,
    // Fall back to a known color if a row somehow has one Tailwind didn't generate.
    gradient: ALLOWED_GRADIENTS.has(row.gradient) ? row.gradient : GRADIENTS[0].value,
    partial: row.partial,
    aliases: row.aliases,
    lineup: row.lineup,
  };
}

async function fetchRows(): Promise<FestivalRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.from("festivals").select("*");
  if (error) {
    // e.g. the table hasn't been created yet: carry on with the built-in list.
    console.warn("Couldn't load festivals from Supabase:", error.message);
    return [];
  }
  return data as FestivalRow[];
}

/** Every festival, including hidden ones, newest first. One database read per request. */
export const getCatalog = cache(async (): Promise<CatalogEntry[]> => {
  await connection(); // read fresh on every request, so admin edits show up right away
  const entries = new Map<string, CatalogEntry>(
    ALL_FESTIVALS.map((f) => [f.id, { festival: f, hidden: false, inDatabase: false, builtIn: true }]),
  );
  for (const row of await fetchRows()) {
    entries.set(row.id, {
      festival: festivalFromRow(row),
      hidden: row.hidden,
      inDatabase: true,
      builtIn: entries.get(row.id)?.builtIn ?? false,
    });
  }
  return [...entries.values()]
    .map((e) => ({ ...e, festival: { ...e.festival, lineup: [...new Set(e.festival.lineup)] } }))
    .sort((a, b) => b.festival.startDate.localeCompare(a.festival.startDate));
});

/** Festivals shown in the app, newest first. */
export async function getFestivals(): Promise<Festival[]> {
  return (await getCatalog()).filter((e) => !e.hidden).map((e) => e.festival);
}

export async function getFestival(id: string): Promise<Festival | undefined> {
  return (await getFestivals()).find((f) => f.id === id);
}
