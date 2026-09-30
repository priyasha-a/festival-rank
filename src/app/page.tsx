import Link from "next/link";
import FestivalPicker from "@/components/FestivalPicker";
import MyFestivals from "@/components/MyFestivals";
import MyShows from "@/components/MyShows";
import { FESTIVALS } from "@/lib/festivals";

export default function FestivalPickerPage() {
  // Strip lineups so the home page doesn't ship thousands of artist names to the browser.
  const summaries = FESTIVALS.map(({ lineup: _lineup, ...summary }) => summary);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Set Rank</h1>
          <p className="text-neutral-400">Rank the festival sets and shows you’ve seen.</p>
        </div>
        <Link
          href="/account"
          className="mt-1 shrink-0 rounded-full px-3 py-1.5 text-sm text-neutral-400 ring-1 ring-neutral-800 active:text-neutral-200"
        >
          Account
        </Link>
      </header>

      <MyFestivals festivals={summaries} />

      <MyShows />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">All festivals</h2>
        <FestivalPicker festivals={summaries} />
      </section>
    </div>
  );
}
