import type { Festival } from "@/lib/festivals";

// Give Thanks Festival (Midnite Events with Insomniac), Thanksgiving weekend in the Bay Area.
// Source: search summaries of edm.com, edmidentity.com, jambase.com, ra.co, dothebay.com,
// festivaldust.com, djlifemag.com (pages couldn't be fetched).

const GRADIENT = "from-yellow-200 via-amber-400 to-orange-600";

// Two separate nights (Wed bass night, Sat EDM night).
export const giveThanks2023 = {
  id: "give-thanks-2023",
  name: "Give Thanks",
  year: 2023,
  startDate: "2023-11-22",
  location: "Daly City, CA",
  dates: "Nov 22 & 25",
  gradient: GRADIENT,
  partial: true,
  lineup: [
    "Subtronics",
    "Porter Robinson",
    "AFROJACK",
    "Wooli",
    "Riot Ten b2b Bear Grillz",
    "MitiS",
    "Level Up",
    "yetep",
    "HALIENE",
    "Grabbitz",
  ],
} satisfies Festival;

// "SoftestChyl" and "PolarBears" are spelled as the search results had them; unverified.
export const giveThanks2024 = {
  id: "give-thanks-2024",
  name: "Give Thanks",
  year: 2024,
  startDate: "2024-11-29",
  location: "Daly City, CA",
  dates: "Nov 29–30",
  gradient: GRADIENT,
  partial: true,
  lineup: [
    "SLANDER",
    "Kaskade",
    "ARMNHMR",
    "Deorro",
    "PEEKABOO",
    "Audien",
    "Starsigns",
    "SoftestChyl",
    "SAYMYNAME",
    "PolarBears",
  ],
} satisfies Festival;

// First year in San Jose. Believed complete.
export const giveThanks2025 = {
  id: "give-thanks-2025",
  name: "Give Thanks",
  year: 2025,
  startDate: "2025-11-28",
  location: "San Jose, CA",
  dates: "Nov 28–29",
  gradient: GRADIENT,
  lineup: [
    "Excision b2b Sullivan King",
    "ILLENIUM b2b Dabin",
    "ATLiens",
    "William Black",
    "Juelz",
    "Bear Grillz",
    "SABAI",
    "Bad News Bears",
    "yetep",
    "HVDES",
    "HALIENE",
    "Hoang",
  ],
} satisfies Festival;

// Announced Sep 2026, before the festival; some slots still TBA. WANKDAT = Crankdat b2b Wooli;
// Skull Machine = Black Tiger Sex Machine x Kai Wachi.
export const giveThanks2026 = {
  id: "give-thanks-2026",
  name: "Give Thanks",
  year: 2026,
  startDate: "2026-11-25",
  location: "San Jose, CA",
  dates: "Nov 25, 27 & 28",
  gradient: GRADIENT,
  partial: true,
  lineup: [
    "Zeds Dead b2b Levity",
    "SLANDER b2b Seven Lions",
    "WANKDAT (Crankdat b2b Wooli)",
    "Skull Machine",
    "Said The Sky",
    "Trivecta",
    "PEEKABOO b2b LYNY",
    "Barely Alive b2b Cyclops",
    "Jason Ross b2b Nurko",
    "Kompany b2b TYNAN",
    "Automhate b2b BEASTBOII",
    "Fairlane b2b Hoang",
    "Nikita the Wicked b2b KLO",
    "Avello presents Monochrome",
    "Capochino b2b AG",
  ],
} satisfies Festival;
