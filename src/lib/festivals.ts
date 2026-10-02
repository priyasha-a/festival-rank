// Festival types and shared helpers. The festival list itself is loaded on the server by catalog.ts
// (built-in lineups from src/lineups, overridden/extended by the `festivals` table in Supabase).

export type Festival = {
  id: string;
  name: string;
  year: number;
  /** ISO date of day 1, used for sorting. */
  startDate: string;
  location: string;
  /** Human-readable dates, e.g. "Apr 10–12 & 17–19". */
  dates: string;
  /** Tailwind gradient classes for the festival card. Must be one of GRADIENTS (see below). */
  gradient: string;
  /** True when we couldn't confirm the full lineup; the UI nudges users to add missing artists. */
  partial?: boolean;
  /**
   * Other names people use for this festival (e.g. "Movement" for "Movement Detroit"), so festivals users
   * added themselves get matched to it and offered a switch. Add spellings seen in festival_requests.
   */
  aliases?: string[];
  lineup: string[];
};

export type FestivalSummary = Omit<Festival, "lineup">;

/** Drops the lineup so pages don't ship thousands of artist names to the browser when they don't need them. */
export const toSummary = ({ lineup: _lineup, ...summary }: Festival): FestivalSummary => summary;

/**
 * Card colors. Tailwind only generates classes it can see in the source code, so festivals saved in the
 * database must use one of these exact strings (the admin editor offers them as choices).
 */
export const GRADIENTS: { label: string; value: string }[] = [
  { label: "Sunset", value: "from-orange-400 via-pink-500 to-purple-600" },
  { label: "Neon", value: "from-yellow-300 via-pink-500 to-fuchsia-600" },
  { label: "Night", value: "from-sky-400 via-indigo-500 to-fuchsia-600" },
  { label: "Ocean", value: "from-cyan-300 via-blue-500 to-violet-600" },
  { label: "Bay", value: "from-cyan-300 via-sky-400 to-blue-600" },
  { label: "Forest", value: "from-emerald-300 via-teal-400 to-violet-500" },
  { label: "Lime", value: "from-lime-300 via-green-500 to-emerald-700" },
  { label: "Meadow", value: "from-lime-300 via-emerald-400 to-teal-500" },
  { label: "Citrus", value: "from-yellow-300 via-lime-400 to-cyan-500" },
  { label: "Fire", value: "from-amber-300 via-orange-500 to-rose-600" },
  { label: "Halloween", value: "from-orange-400 via-red-500 to-purple-700" },
  { label: "Gold", value: "from-yellow-200 via-amber-400 to-orange-600" },
  { label: "Dawn", value: "from-amber-200 via-rose-400 to-indigo-500" },
  { label: "Ember", value: "from-red-400 via-orange-400 to-yellow-300" },
  { label: "Slate", value: "from-slate-200 via-slate-400 to-slate-500" },
];
