import { notFound } from "next/navigation";
import { CustomRankPage } from "@/components/CustomFestival";
import SetRanker from "@/components/SetRanker";
import { getFestival } from "@/lib/catalog";
import { isCustomId } from "@/lib/customFestivals";
import { toSummary } from "@/lib/festivals";

export default async function RankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = await getFestival(id);
  if (!festival) {
    if (isCustomId(id)) return <CustomRankPage id={id} />;
    notFound();
  }

  // The ranker only needs the festival's details, not its full lineup.
  return <SetRanker festival={toSummary(festival)} />;
}
