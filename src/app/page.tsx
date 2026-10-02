import Link from "next/link";
import AddShowCard from "@/components/AddShowCard";
import FestivalPicker from "@/components/FestivalPicker";
import MyFestivals from "@/components/MyFestivals";
import MyShows from "@/components/MyShows";
import { SwitchBanners } from "@/components/SwitchFestival";
import UsernameBanner from "@/components/UsernameBanner";
import { getFestivals } from "@/lib/catalog";
import { toSummary } from "@/lib/festivals";

export default async function FestivalPickerPage() {
  const summaries = (await getFestivals()).map(toSummary);

  return (
    <div data-wide className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Set Rank</h1>
          <p className="text-neutral-400">Rank the festival sets and shows you’ve seen.</p>
        </div>
        <nav className="mt-1 flex shrink-0 gap-2">
          <Link
            href="/friends"
            className="rounded-full px-3 py-1.5 text-sm text-neutral-400 ring-1 ring-neutral-800 active:text-neutral-200"
          >
            Friends
          </Link>
          <Link
            href="/account"
            className="rounded-full px-3 py-1.5 text-sm text-neutral-400 ring-1 ring-neutral-800 active:text-neutral-200"
          >
            Account
          </Link>
        </nav>
      </header>

      <UsernameBanner />
      <SwitchBanners festivals={summaries} />

      {/* Stacked on phones; on wider screens your stuff sits in a left column beside the full list. */}
      <div className="space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-8 md:space-y-0">
        <div className="space-y-6 md:sticky md:top-6 md:-m-1 md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:p-1">
          <MyFestivals festivals={summaries} />
          <MyShows />
        </div>

        <div className="space-y-6">
          <AddShowCard />

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Went to a festival? Rank them
            </h2>
            <FestivalPicker festivals={summaries} />
          </section>
        </div>
      </div>
    </div>
  );
}
