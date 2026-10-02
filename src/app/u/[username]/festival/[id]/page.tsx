import Link from "next/link";
import { notFound } from "next/navigation";
import { FriendFestivalRanking } from "@/components/FriendProfile";
import { isCustomId } from "@/lib/customFestivals";
import { getFestival } from "@/lib/catalog";
import { toSummary } from "@/lib/festivals";

export default async function FriendFestivalPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const festival = await getFestival(id);
  // Festivals a friend added themselves aren't in the catalog; their details come from the friend's saved data.
  if (!festival && !isCustomId(id)) notFound();
  const summary = festival ? toSummary(festival) : undefined;
  const handle = decodeURIComponent(username).toLowerCase();

  return (
    <div className="space-y-6">
      <Link href={`/u/${handle}`} className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ @{handle}
      </Link>
      <FriendFestivalRanking username={handle} festivalId={id} builtIn={summary} />
    </div>
  );
}
