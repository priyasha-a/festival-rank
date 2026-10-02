import type { FestivalSummary } from "@/lib/festivals";

/** Gradient title block at the top of a festival's page. */
export default function FestivalHeader({ festival }: { festival: FestivalSummary }) {
  const details = [festival.location, festival.dates].filter(Boolean).join(" · ");
  return (
    <header className={`rounded-2xl bg-gradient-to-br ${festival.gradient} p-5 text-neutral-950`}>
      <h1 className="text-3xl font-bold">
        {festival.name} {festival.year}
      </h1>
      {details && <p className="text-sm font-medium opacity-80">{details}</p>}
    </header>
  );
}
