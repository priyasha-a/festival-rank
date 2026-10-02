import Link from "next/link";
import { notFound } from "next/navigation";
import ArtistChecklist from "@/components/ArtistChecklist";
import { CustomFestivalPage } from "@/components/CustomFestival";
import FestivalHeader from "@/components/FestivalHeader";
import { isCustomId } from "@/lib/customFestivals";
import { FESTIVALS, getFestival } from "@/lib/festivals";

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ id: f.id }));
}

export default async function FestivalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = getFestival(id);
  if (!festival) {
    // Festivals users added themselves live in their saved data, so they load in the browser.
    if (isCustomId(id)) {
      // Official festivals (no lineups) so the page can offer a switch if this one has since been added.
      const summaries = FESTIVALS.map(({ lineup: _lineup, ...summary }) => summary);
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

      <ArtistChecklist festival={festival} />
    </div>
  );
}
