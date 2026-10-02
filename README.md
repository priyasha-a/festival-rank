# Set Rank

Pick a music festival you went to, check off the sets you saw, and rank them with
head-to-head comparisons (binary insertion, like the Beli app). Solo shows can be logged too
(just the artist, plus optional venue, city, month and openers) and ranked against each other.

Built with Next.js and Supabase. Mobile-first.

## Running it on your computer

```
npm.cmd install      # first time only
npm.cmd run dev      # then open http://localhost:3000
```

Stop it with Ctrl + C. (`npm.cmd` rather than `npm` because PowerShell blocks `npm`'s script.)

## Adding a festival

**Easiest: the admin page.** Sign in as an admin and open `/admin` (or Account → Admin). There you can see
festival requests (most-requested first), add a festival, or edit/hide any existing one. Saving writes it to
the `festivals` table in Supabase and it's live on the next page load — no code change or publishing needed.
A database copy with the same id as a built-in festival replaces it. To make someone an admin, run in the
Supabase SQL Editor:

```sql
insert into public.admins (user_id) select id from auth.users where email = 'their@email.com';
```

**In code (the built-in starting set):** lineups also live in [`src/lineups/`](src/lineups/), one file per
festival, with every year of that festival in the same file. These ship with the app and are used whenever
the database has no copy of them (or can't be reached).

**A new year of a festival that's already there** (e.g. EDC 2027): open its file
(`src/lineups/edc.ts`), copy an existing block like `export const edc2026 = { ... }`, rename it
(`edc2027`), and change the details. Then add it to [`src/lineups/index.ts`](src/lineups/index.ts):
import it at the top and add it to the `ALL_FESTIVALS` list.

**A brand-new festival**: copy any file in `src/lineups/` (e.g. `wobbleland.ts`) to a new name,
edit it, and add it to `index.ts` the same way.

Each festival looks like this:

```ts
export const edc2027 = {
  id: "edc-las-vegas-2027",        // unique; used in the web address. Never change it once people have rankings.
  name: "EDC Las Vegas",
  year: 2027,
  startDate: "2027-05-14",         // first day, YYYY-MM-DD. Used to sort newest first.
  location: "Las Vegas, NV",
  dates: "May 14–16",              // shown on the card, written however you like
  gradient: "from-yellow-300 via-pink-500 to-fuchsia-600", // card colors (Tailwind classes)
  partial: true,                   // true shows a "lineup may be incomplete" note; remove if complete
  lineup: [
    "Headliner One",
    "Headliner Two",
    // ...one artist per line, in quotes, each followed by a comma
  ],
} satisfies Festival;
```

**Festivals users asked for**: when someone adds a festival that isn't listed (the "Festival not listed?
Add it yourself" button), a row lands in Supabase → Table Editor → `festival_requests`. After adding the
official version here, anyone who added their own copy sees a "now in Set Rank — Switch?" banner, matched
by year plus name. If people typed a different name (e.g. "Movement" for "Movement Detroit"), add it to
the festival's `aliases: ["Movement"]` so they still get matched.

Fixing a typo in an artist's name is fine, but anyone who already checked that artist will lose
the check for them (names are how picks are saved).

## Where the rest of the code is

| What | Where |
|---|---|
| Home page (your festivals + all festivals) | `src/app/page.tsx`, `src/components/MyFestivals.tsx`, `src/components/FestivalPicker.tsx` |
| "Which sets did you see?" checklist | `src/app/festival/[id]/page.tsx`, `src/components/ArtistChecklist.tsx` |
| Festival ranking screen | `src/app/festival/[id]/rank/page.tsx`, `src/components/SetRanker.tsx` |
| Solo shows (list, ranking, add form, home card) | `src/app/shows/`, `src/components/ShowsRanker.tsx`, `src/components/AddShowForm.tsx`, `src/components/MyShows.tsx`, `src/lib/shows.ts` |
| Head-to-head screen and ranked list (shared) | `src/components/RankingUI.tsx`, `src/lib/useRanking.ts` |
| Ranking algorithm (binary insertion) | `src/lib/ranking.ts` |
| Saving and syncing (browser + Supabase) | `src/lib/storage.ts`, `src/lib/supabase.ts` |
| Sign in / account page | `src/app/account/page.tsx`, `src/components/AccountPanel.tsx` |
| Colors, fonts, page width | `src/app/globals.css`, `src/app/layout.tsx` |
| Database table and security rules | `supabase/schema.sql` |

## Supabase setup

1. Create a project at supabase.com and run `supabase/schema.sql` in its SQL Editor. (It's safe to
   re-run the whole file whenever it changes, e.g. after new tables are added.)
2. In Authentication → URL Configuration, add every address the app runs at to Redirect URLs
   (`http://localhost:3000/**` and your live address).
3. Put the Project URL and publishable key in `.env.local` (and in Vercel's Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Without them the app still works, saving only in the browser.
