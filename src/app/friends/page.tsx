import Link from "next/link";
import FriendsPanel from "@/components/FriendsPanel";

export default function FriendsPage() {
  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ Home
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
      <FriendsPanel />
    </div>
  );
}
