import Link from "next/link";
import { notFound } from "next/navigation";
import { FriendFestivalRanking } from "@/components/FriendProfile";
import { isCustomId } from "@/lib/customFestivals";
import { getFestival } from "@/lib/festivals";

export default async function FriendFestivalPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const festival = getFestival(id);
  // Festivals a friend added themselves aren't built in; their details come from the friend's saved data.
  if (!festival && !isCustomId(id)) notFound();
  const summary = festival ? (({ lineup: _lineup, ...rest }) => rest)(festival) : undefined;
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
