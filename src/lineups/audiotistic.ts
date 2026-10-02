import type { Festival } from "@/lib/festivals";

// Audiotistic (Insomniac). The SoCal edition hasn't run since Dec 2019; the only standalone edition
// found for 2022–2026 is Audiotistic Bay Area 2022. Source: search summaries of edmidentity.com and
// musicfestivalwizard.com (pages couldn't be fetched). Only the bigger names were confirmed.
export const audiotisticBayArea2022 = {
  id: "audiotistic-bay-area-2022",
  name: "Audiotistic Bay Area",
  year: 2022,
  startDate: "2022-07-09",
  location: "Mountain View, CA",
  dates: "Jul 9–10",
  gradient: "from-red-400 via-orange-400 to-yellow-300",
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
