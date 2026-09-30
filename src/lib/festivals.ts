import { ALL_FESTIVALS } from "@/lineups";

export type Festival = {
  id: string;
  name: string;
  year: number;
  /** ISO date of day 1, used for sorting. */
  startDate: string;
  location: string;
  /** Human-readable dates, e.g. "Apr 10–12 & 17–19". */
  dates: string;
  /** Tailwind gradient classes for the festival card. */
  gradient: string;
  /** True when we couldn't confirm the full lineup; the UI nudges users to add missing artists. */
  partial?: boolean;
  lineup: string[];
};

export type FestivalSummary = Omit<Festival, "lineup">;

// Hardcoded for now; later this can move into Supabase `festivals` / `artists` tables.
// Newest first, with duplicate names removed (artist names double as React keys and storage ids).
export const FESTIVALS: Festival[] = ALL_FESTIVALS.map((f) => ({ ...f, lineup: [...new Set(f.lineup)] })).sort(
  (a, b) => b.startDate.localeCompare(a.startDate),
);

export function getFestival(id: string): Festival | undefined {
  return FESTIVALS.find((f) => f.id === id);
}
