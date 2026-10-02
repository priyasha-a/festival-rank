import Link from "next/link";
import { notFound } from "next/navigation";
import { FriendFestivalRanking } from "@/components/FriendProfile";
import { getFestival } from "@/lib/festivals";

export default async function FriendFestivalPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const festival = getFestival(id);
  if (!festival) notFound();
  const { lineup: _lineup, ...summary } = festival;
  const handle = decodeURIComponent(username).toLowerCase();

  return (
    <div className="space-y-6">
      <Link href={`/u/${handle}`} className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ @{handle}
      </Link>
      <FriendFestivalRanking username={handle} festival={summary} />
    </div>
  );
}
