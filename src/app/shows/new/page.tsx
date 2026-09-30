import Link from "next/link";
import AddShowForm from "@/components/AddShowForm";

export default function NewShowPage() {
  return (
    <div className="space-y-6">
      <Link href="/shows" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ Your shows
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Add a show</h1>
        <p className="text-sm text-neutral-500">Only the artist is required. You’ll rank it against your other shows next.</p>
      </header>
      <AddShowForm />
    </div>
  );
}
