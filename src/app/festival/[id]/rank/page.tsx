import { notFound } from "next/navigation";
import SetRanker from "@/components/SetRanker";
import { FESTIVALS, getFestival } from "@/lib/festivals";

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ id: f.id }));
}

export default async function RankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = getFestival(id);
  if (!festival) notFound();

  // The ranker only needs the festival's details, not its full lineup.
  const { lineup: _lineup, ...summary } = festival;
  return <SetRanker festival={summary} />;
}
