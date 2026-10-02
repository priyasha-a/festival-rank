import Link from "next/link";
import AddFestivalForm from "@/components/AddFestivalForm";

export default function AddFestivalPage() {
  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-neutral-400 active:text-neutral-200">
        ‹ All festivals
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Add a festival</h1>
        <p className="text-sm text-neutral-500">Not in our list yet? Add it and rank the sets you saw right away.</p>
      </header>
      <AddFestivalForm />
    </div>
  );
}
