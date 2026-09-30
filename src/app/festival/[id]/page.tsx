import Link from "next/link";
import { notFound } from "next/navigation";
import ArtistChecklist from "@/components/ArtistChecklist";
import { FESTIVALS, getFestival } from "@/lib/festivals";

export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ id: f.id }));
}

export default async function FestivalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const festival = getFestival(id);
  if (!festival) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ All festivals
      </Link>

      <header className={`rounded-2xl bg-gradient-to-br ${festival.gradient} p-5 text-neutral-950`}>
        <h1 className="text-3xl font-bold">
          {festival.name} {festival.year}
        </h1>
        <p className="text-sm font-medium opacity-80">
          {festival.location} · {festival.dates}
        </p>
      </header>

      {festival.partial && (
        <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
          This lineup may be incomplete. If someone’s missing, type their name in the search box to add them.
        </p>
      )}

      <ArtistChecklist festival={festival} />
    </div>
  );
}
