import type { Festival } from "@/lib/festivals";

// Audiotistic (Insomniac). Each year's card shows where it was held.
// Source: search summaries of edmidentity.com, edmtunes.com, musicfestivalwizard.com (pages couldn't be fetched).

const GRADIENT = "from-red-400 via-orange-400 to-yellow-300";

// SoCal edition: one day, two stages, at NOS Events Center. Believed complete.
export const audiotistic2019 = {
  id: "audiotistic-2019",
  name: "Audiotistic",
  year: 2019,
  startDate: "2019-12-28",
  location: "San Bernardino, CA",
  dates: "Dec 28",
  gradient: GRADIENT,
  lineup: [
    "Tchami b2b Malaa",
    "NGHTMRE",
    "Flosstradamus",
    "4B b2b Valentino Khan",
    "AC Slater",
    "Getter",
    "Blanke b2b Lick",
    "Anna Lunoe b2b Wax Motif",
    "Saint Punk",
    "Whipped Cream",
    "Jack Beats & Friends",
    "Flava D",
    "BIJOU",
    "Notion",
    "Taiki Nulight",
  ],
} satisfies Festival;

// The SoCal edition didn't run 2020–2026; this Bay Area edition is the only one found for 2022–2026.
// Only the bigger names were confirmed.
export const audiotistic2022 = {
  id: "audiotistic-bay-area-2022",
  name: "Audiotistic",
  year: 2022,
  startDate: "2022-07-09",
  location: "Mountain View, CA",
  dates: "Jul 9–10",
  gradient: GRADIENT,
  partial: true,
  lineup: [
    "Chris Lake",
    "REZZ",
    "SVDDEN DEATH",
    "ScHoolboy Q",
    "Dom Dolla",
    "John Summit",
    "SIDEPIECE",
    "Said The Sky",
    "TroyBoi",
    "Whipped Cream",
    "Blunts & Blondes",
  ],
} satisfies Festival;
