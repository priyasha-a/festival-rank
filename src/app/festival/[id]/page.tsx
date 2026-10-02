import Link from "next/link";
import { notFound } from "next/navigation";
import ArtistChecklist from "@/components/ArtistChecklist";
import { CustomFestivalPage } from "@/components/CustomFestival";
import FestivalHeader from "@/components/FestivalHeader";
import FriendsWhoWent from "@/components/FriendsWhoWent";
import { getFestival, getFestivals } from "@/lib/catalog";
import { isCustomId } from "@/lib/customFestivals";
import { toSummary } from "@/lib/festivals";

export default async function FestivalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = await getFestival(id);
  if (!festival) {
    // Festivals users added themselves live in their saved data, so they load in the browser.
    if (isCustomId(id)) {
      // Official festivals (no lineups) so the page can offer a switch if this one has since been added.
      const summaries = (await getFestivals()).map(toSummary);
      return <CustomFestivalPage id={id} festivals={summaries} />;
    }
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ All festivals
      </Link>

      <FestivalHeader festival={festival} />

      {festival.partial && (
        <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
          This lineup may be incomplete. If someone’s missing, type their name in the search box to add them.
        </p>
      )}

      <FriendsWhoWent festivalId={festival.id} />

      <ArtistChecklist festival={festival} />
    </div>
  );
}
