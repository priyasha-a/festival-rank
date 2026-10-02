import Link from "next/link";
import { notFound } from "next/navigation";
import FestivalEditor from "@/components/FestivalEditor";
import { getCatalog } from "@/lib/catalog";

/** /admin/festival/new adds a festival; /admin/festival/<id> edits one (including hidden ones). */
export default async function AdminFestivalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await getCatalog();
  const existing = id === "new" ? undefined : catalog.find((e) => e.festival.id === id);
  if (id !== "new" && !existing) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ Admin
      </Link>
      <h1 className="text-2xl font-bold">
        {existing ? `${existing.festival.name} ${existing.festival.year}` : "New festival"}
      </h1>
      <FestivalEditor existing={existing} takenIds={catalog.map((e) => e.festival.id)} />
    </div>
  );
}
