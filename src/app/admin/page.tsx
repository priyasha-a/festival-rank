import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";
import { getCatalog } from "@/lib/catalog";
import { toSummary } from "@/lib/festivals";

/** Admin-only (enforced in the browser and by the database): festival requests and the festival list. */
export default async function AdminPage() {
  const entries = (await getCatalog()).map(({ festival, ...rest }) => ({ festival: toSummary(festival), ...rest }));
  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ Back to app
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
      <AdminPanel entries={entries} />
    </div>
  );
}
