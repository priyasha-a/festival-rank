import Link from "next/link";
import { SHOWS_GRADIENT } from "@/lib/shows";

/** Standing entry point for logging a solo show. */
export default function AddShowCard() {
  return (
    <Link
      href="/shows/new"
      className="flex items-center gap-4 rounded-2xl border border-dashed border-neutral-700 px-4 py-3 active:bg-neutral-900"
    >
      <span
        aria-hidden
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${SHOWS_GRADIENT} text-xl font-bold text-neutral-950`}
      >
        +
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Went to a solo show?</span>
        <span className="block text-sm text-neutral-400">Log it and rank it against your other shows</span>
      </span>
    </Link>
  );
}
