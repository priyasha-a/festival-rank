import Link from "next/link";
import FriendProfile from "@/components/FriendProfile";
import { getFestivals } from "@/lib/catalog";
import { toSummary } from "@/lib/festivals";

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const summaries = (await getFestivals()).map(toSummary);

  return (
    <div className="space-y-6">
      <Link href="/friends" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ Friends
      </Link>
      <FriendProfile username={decodeURIComponent(username).toLowerCase()} festivals={summaries} />
    </div>
  );
}
