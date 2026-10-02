import { notFound } from "next/navigation";
import { CustomRankPage } from "@/components/CustomFestival";
import SetRanker from "@/components/SetRanker";
import { isCustomId } from "@/lib/customFestivals";
import { FESTIVALS, getFestival } from "@/lib/festivals";

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ id: f.id }));
}

export default async function RankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = getFestival(id);
  if (!festival) {
    if (isCustomId(id)) return <CustomRankPage id={id} />;
    notFound();
  }

  // The ranker only needs the festival's details, not its full lineup.
  const { lineup: _lineup, ...summary } = festival;
  return <SetRanker festival={summary} />;
}
