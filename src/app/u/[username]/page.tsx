import Link from "next/link";
import FriendProfile from "@/components/FriendProfile";
import { FESTIVALS } from "@/lib/festivals";

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Strip lineups so the page doesn't ship thousands of artist names to the browser.
  const summaries = FESTIVALS.map(({ lineup: _lineup, ...summary }) => summary);

  return (
    <div className="space-y-6">
      <Link href="/friends" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ Friends
      </Link>
      <FriendProfile username={decodeURIComponent(username).toLowerCase()} festivals={summaries} />
    </div>
  );
}
