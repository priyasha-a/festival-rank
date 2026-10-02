"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/social";

/** Nudges signed-in users who haven't picked a username yet (needed for friends). Hidden otherwise. */
export default function UsernameBanner() {
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    // null = signed in without a username; undefined = signed out.
    getMyProfile().then((p) => setNeedsUsername(p === null));
  }, []);

  if (!needsUsername) return null;

  return (
    <Link
      href={`/account?next=${encodeURIComponent("/")}`}
      className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3 text-neutral-950 active:scale-[0.98]"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Pick a username</span>
        <span className="block text-sm text-neutral-600">So friends can find you and see your rankings</span>
      </span>
      <span aria-hidden className="text-xl">
        →
      </span>
    </Link>
  );
}
